import { SPAWN_DIRECTOR, SPAWN_DOOR } from '../config/GameConfig.js';
import { ENEMY_TIERS, ENEMY_TIER_ORDER, ENEMY_FIRST_STAGE, getSpawnStageConfig } from '../config/EconomyConfig.js';
import { DEV_RUNTIME } from '../dev/GameBalance.js';

function weightedPick(candidates, weights) {
  const total = candidates.reduce((sum, t) => sum + weights[t], 0);
  let r = Math.random() * total;
  for (const tier of candidates) {
    r -= weights[tier];
    if (r <= 0) return tier;
  }
  return candidates[candidates.length - 1];
}

// The Spawn Director: decides WHAT spawns, WHERE (which door/floor), and
// WHEN (pacing + player progression) — everything else (door open/close
// animation, enemy AI, physics, collision) stays exactly as it already
// works. One instance per loaded stage.
export class SpawnDirector {
  constructor(stage, doors, encounterZones) {
    this.stage = stage;
    this.config = getSpawnStageConfig(stage);
    this.maxAlive = this.config.maxAlive;
    this.remaining = { ...this.config.counts };

    const doorsById = new Map(doors.map((d) => [d.id, d]));
    // Zones arrive already sorted left-to-right (assemble() walks blocks in
    // order) — a forward-only cursor means a later tick never rescans a
    // zone the player has already resolved or walked past.
    this.zones = encounterZones.map((z) => ({
      ...z,
      budgetRemaining: z.enemyBudget ?? 0,
      fixedComposition: z.fixedComposition ? [...z.fixedComposition] : null,
      doors: z.doorIds.map((id) => doorsById.get(id)).filter(Boolean),
      active: false,
      finished: false,
      picksSpent: 0,
    }));
    this._zoneCursor = 0;

    this.activeDoors = [];
    this.spawnTimer = this._rollSpawnDelay();
    this.debug = false;
  }

  // DEV dashboard override (Spawns tab): 0/null means "use this stage's own
  // authored maxAlive" — never a second, parallel enemy cap, just the one
  // real value the Director already reads everywhere below.
  get effectiveMaxAlive() {
    return DEV_RUNTIME.spawns.maxAliveOverride ?? this.maxAlive;
  }

  setDebug(on) {
    this.debug = !!on;
  }

  _rollSpawnDelay() {
    const [min, max] = this.config.spawnDelayRange;
    return min + Math.random() * (max - min);
  }

  // Stage-clear condition input (spawn system does not continue after stage
  // completion) — true once nothing is mid-animation and no zone still has
  // anything left it could spend.
  isExhausted() {
    if (this.activeDoors.length > 0) return false;
    for (let i = this._zoneCursor; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (z.finished) continue;
      const hasBudget = z.fixedComposition ? z.fixedComposition.length > 0 : z.budgetRemaining > 0;
      if (hasBudget) return false;
    }
    return true;
  }

  // Called once per frame from StageSystem.update. `ctx`:
  // { player, currentFloor, getAliveCount(), spawnEnemy(kind, tier, x, floorY) }.
  tick(dt, spawnDoorSystem, ctx) {
    this.spawnTimer -= dt;

    // Forward-only zone bookkeeping runs every tick regardless of the spawn
    // timer, so a zone the player has walked past always gets marked
    // finished promptly — otherwise isExhausted() could stay false forever
    // and the stage would never be clearable.
    const zone = this._currentZone(ctx.player.progressionX, ctx.currentFloor);

    if (this.spawnTimer <= 0 && zone) {
      const activated = this._tryActivateDoor(zone, ctx);
      if (activated) this.spawnTimer = this._rollSpawnDelay();
    }

    spawnDoorSystem.update(dt, this.activeDoors, {
      getActiveEnemyCount: ctx.getAliveCount,
      maxAlive: this.effectiveMaxAlive,
      spawnEnemy: (kind, tier, x, floorY) => ctx.spawnEnemy(kind, tier, x, floorY),
    });
    this.activeDoors = this.activeDoors.filter((d) => d.state !== 'idle');

    if (this.debug) {
      console.log('[SpawnDirector]', this.getDebugSnapshot(ctx));
    }
  }

  // Advances the forward-only cursor, finishing any zone that has spent its
  // whole budget, and reports whichever zone is current now (only ever look
  // at the one relevant zone, never the whole stage). A zone is
  // deliberately NOT abandoned just because the player has walked past its
  // authored x-range: the stage exit is already locked until every zone is
  // spent (StageSystem checks isExhausted() before opening it), so there is
  // no way to skip a zone by outrunning it.
  _currentZone(progressionX, currentFloor) {
    while (this._zoneCursor < this.zones.length) {
      const z = this.zones[this._zoneCursor];
      // A zone also counts as spent once nothing left in its budget can
      // actually afford any currently-available tier (e.g. 2 points left
      // but only Heavy/Elite remain available at 5/8) — otherwise a small
      // leftover remainder that can never hit exactly 0 would stall the
      // zone (and the whole stage-clear check) forever.
      const spent = z.fixedComposition ? z.fixedComposition.length === 0 : z.budgetRemaining <= 0 || !this._hasAffordableTier(z);
      if (spent) {
        z.finished = true;
        z.active = false;
        this._zoneCursor++;
        continue;
      }
      // Filter possible doors by currentFloor — a zone authored for another
      // floor simply never goes active while the player is elsewhere; it
      // waits rather than ever activating a door on the wrong floor.
      z.active = progressionX >= z.startX && z.floor === currentFloor;
      return z;
    }
    return null;
  }

  _tryActivateDoor(zone, ctx) {
    if (!zone.active) return false;
    if (ctx.getAliveCount() >= this.effectiveMaxAlive) return false;

    const cap = this._effectiveDoorCap();
    if (this.activeDoors.length >= cap) return false;

    const door = zone.doors.find((d) => d.state === 'idle' && d.floorIndex === ctx.currentFloor); // active-floor gating
    if (!door) return false;
    if (Math.abs(door.x - ctx.player.x) < SPAWN_DIRECTOR.doorSafeDistance) return false;

    const specs = this._buildBatch(zone);
    if (!specs) return false; // nothing affordable right now — wait for next tick

    const ok = door.activate(specs, SPAWN_DOOR.doorOpenCloseSec);
    if (ok) {
      this.activeDoors.push(door);
      if (this.debug) {
        const list = specs.map((s) => `${s.tier}/${s.kind}`).join(', ') || 'empty';
        console.log(`[SpawnDirector] stage ${this.stage} door ${door.id} floor ${door.floorIndex} -> [${list}]`);
      }
    }
    return ok;
  }

  // Usually 1, occasionally 2, rarely 3 late-game.
  _effectiveDoorCap() {
    if (this.stage >= SPAWN_DIRECTOR.peakEncounterMinStage && Math.random() < SPAWN_DIRECTOR.peakEncounterChance) {
      return SPAWN_DIRECTOR.peakMaxConcurrentOpenDoors;
    }
    return SPAWN_DIRECTOR.maxConcurrentOpenDoors;
  }

  // Returns an array of {kind, tier} to hand to door.activate(), or null to
  // mean "nothing affordable right now, try again later" (as opposed to an
  // empty array, which means "deliberately open this door with nobody in
  // it").
  _buildBatch(zone) {
    if (zone.fixedComposition) {
      if (zone.fixedComposition.length === 0) return null;
      // Staggered: exactly one per door activation (never dump the whole
      // final wave at once).
      const tier = zone.fixedComposition.shift();
      zone.picksSpent++;
      this.remaining[tier] = Math.max(0, (this.remaining[tier] || 0) - 1);
      return [this._makeSpec(tier)];
    }

    if (Math.random() < SPAWN_DIRECTOR.emptyDoorChance) return []; // deliberate empty door

    const batchSize = zone.picksSpent === 0 || Math.random() >= 0.35 ? 1 : 2;
    const specs = [];
    for (let i = 0; i < batchSize; i++) {
      if (zone.budgetRemaining <= 0) break;
      const tier = this._pickTier(zone, specs);
      if (!tier) break;
      const cost = ENEMY_TIERS[tier].threatCost;
      zone.budgetRemaining -= cost;
      zone.picksSpent++;
      this.remaining[tier] -= 1;
      specs.push(this._makeSpec(tier));
    }
    return specs.length ? specs : null;
  }

  _makeSpec(tier) {
    return { tier, kind: Math.random() < 0.55 ? 'ranged' : 'melee' };
  }

  // Weighted selection among currently available/remaining/affordable
  // tiers, plus "feel intentional" guards: never 2 Elites together, never
  // lead a zone's first pick with a Heavy/Elite while a weaker tier could
  // introduce first, never 2 Heavy/Elite in the same batch.
  _isTierAffordable(tier, zone) {
    return (
      this.config.weights[tier] > 0 &&
      this.stage >= ENEMY_FIRST_STAGE[tier] &&
      this.remaining[tier] > 0 &&
      ENEMY_TIERS[tier].threatCost <= zone.budgetRemaining
    );
  }

  _hasAffordableTier(zone) {
    return ENEMY_TIER_ORDER.some((tier) => this._isTierAffordable(tier, zone));
  }

  _pickTier(zone, alreadyPickedThisBatch) {
    const heavyOrEliteAlready = alreadyPickedThisBatch.some((s) => s.tier === 'heavy' || s.tier === 'elite');
    const eliteAlready = alreadyPickedThisBatch.some((s) => s.tier === 'elite');
    const isZonesFirstPick = zone.picksSpent === 0 && alreadyPickedThisBatch.length === 0;
    const weights = this.config.weights;

    const candidates = [];
    const weakerAvailable = ENEMY_TIER_ORDER.some((t) => t !== 'heavy' && t !== 'elite' && this._isTierAffordable(t, zone));
    for (const tier of ENEMY_TIER_ORDER) {
      if (!this._isTierAffordable(tier, zone)) continue;
      if (tier === 'elite' && eliteAlready) continue;
      if ((tier === 'heavy' || tier === 'elite') && heavyOrEliteAlready) continue;
      if ((tier === 'heavy' || tier === 'elite') && isZonesFirstPick && weakerAvailable) continue;
      candidates.push(tier);
    }
    if (!candidates.length) return null;
    return weightedPick(candidates, weights);
  }

  // Spawn Director debug mode — off by default; call setDebug(true) to also
  // console.log every activation and get this snapshot logged each tick.
  getDebugSnapshot(ctx) {
    const zone = this.zones[this._zoneCursor];
    return {
      stage: this.stage,
      currentFloor: ctx?.currentFloor,
      aliveEnemies: ctx?.getAliveCount ? ctx.getAliveCount() : undefined,
      maxAlive: this.effectiveMaxAlive,
      remaining: { ...this.remaining },
      activeZone: zone && !zone.finished ? zone.id : null,
      activeDoors: this.activeDoors.map((d) => d.id),
      nextSpawnInSec: Math.max(0, this.spawnTimer),
    };
  }
}
