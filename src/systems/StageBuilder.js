import { LEVEL, STAGES, SPAWN_DIRECTOR, STAGE_GEN } from '../config/GameConfig.js';
import { ENEMY_TIERS, getSpawnStageConfig } from '../config/EconomyConfig.js';
import {
  FLOOR_MIN,
  FLOOR_MAX,
  randRange,
  buildEntranceBlock,
  buildExitBlock,
  buildFlatMiddleBlock,
  buildObstacleMiddleBlock,
  buildStairsBlock,
  buildFinalWaveBlock,
  FINAL_WAVE_COMPOSITION,
} from './BlockLibrary.js';

// Deterministic PRNG so a given stage number always builds the same layout
// (needed for stage 11+ to be reproducible/testable) while still varying
// stage-to-stage.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Total threat-point budget the stage's whole authored count table
// represents. StageBuilder doesn't decide WHAT spawns (that's
// SpawnDirector.js at runtime) — it only needs this total so each combat
// block's `enemyBudget` share, taken together, gets the Director's
// per-stage counts roughly fully spent by stage end regardless of exactly
// how many combat blocks this particular seed happens to place.
function totalThreatBudget(stage) {
  const { counts } = getSpawnStageConfig(stage);
  let total = 0;
  for (const tier of Object.keys(counts)) total += counts[tier] * ENEMY_TIERS[tier].threatCost;
  // Stage 10's final wave is guaranteed on top of the normal random spend —
  // deduct its cost here so the stage's total spend still lands on the
  // authored economy target instead of overshooting it.
  if (stage === 10) {
    for (const tier of FINAL_WAVE_COMPOSITION) total -= ENEMY_TIERS[tier].threatCost;
  }
  return Math.max(0, total);
}

// Builds the randomized MIDDLE-block sequence between ENTRANCE and EXIT.
// This is the one place that decides pacing:
//   - a stair transition never appears less than LEVEL.stairGapRange (4-7s
//     worth of px) after the previous one, or before the entrance;
//   - stairs are never placed back-to-back (each stair resets the gap
//     counter to 0, so the very next block can't also be a stair);
//   - the last MIDDLE slot before EXIT is never a stair, and never carries
//     an enemy door (clear, enemy-free EXIT approach);
//   - the player is always walked back down to FLOOR_MIN before EXIT,
//     because EXIT (and the base-ground solid StageBuilder wraps every
//     stage in) only exists at street level.
//
// Each combat block's `enemyBudget` is a share of `stageBudgetRemaining`,
// taken geometrically (a "hard encounter" claims a bigger share than a
// normal one) so the total spent across a stage's combat blocks converges
// close to the full authored per-stage count table within just a handful of
// blocks, however many a given stage/seed ends up placing — see
// SPAWN_DIRECTOR.zoneBudgetShare. `unitCount`/stair-chance/obstacle-chance
// all come from STAGE_GEN (GameConfig.js) so the dev dashboard's Stage tab
// can tune pacing live without touching this logic.
function buildBodyBlocks(stage, rng) {
  const unitCount = Math.min(STAGE_GEN.unitCountCap, STAGE_GEN.unitCountBase + Math.floor(stage * STAGE_GEN.unitCountPerStage));
  const stairChance = Math.min(STAGE_GEN.stairChanceCap, STAGE_GEN.stairChanceBase + stage * STAGE_GEN.stairChancePerStage);
  const obstacleChance = STAGE_GEN.obstacleChance;

  let currentFloor = FLOOR_MIN;
  let pxSinceLastStair = 0;
  let nextStairGap = randRange(rng, LEVEL.stairGapRange);
  let stageBudgetRemaining = totalThreatBudget(stage);
  let lastCombatBlock = null;
  const blocks = [];

  for (let i = 0; i < unitCount; i++) {
    const isLastSlot = i === unitCount - 1;
    const roomForStair = !isLastSlot && currentFloor < FLOOR_MAX && pxSinceLastStair >= nextStairGap;

    if (roomForStair && rng() < stairChance) {
      const toFloor = currentFloor + 1;
      const block = buildStairsBlock(currentFloor, toFloor);
      blocks.push(block);
      currentFloor = toFloor;
      pxSinceLastStair = 0;
      nextStairGap = randRange(rng, LEVEL.stairGapRange);
      continue;
    }

    if (!isLastSlot && rng() < obstacleChance) {
      const block = buildObstacleMiddleBlock(rng, currentFloor);
      blocks.push(block);
      pxSinceLastStair += block.chunk.width;
      continue;
    }

    // Never seed a fight directly at the stage exit.
    const withCombat = !isLastSlot && rng() < 0.75;
    const hardEncounter = withCombat && rng() < 0.18;
    let enemyBudget = 0;
    if (withCombat && stageBudgetRemaining > 0) {
      const share = hardEncounter ? SPAWN_DIRECTOR.zoneBudgetShare.hard : SPAWN_DIRECTOR.zoneBudgetShare.normal;
      enemyBudget = Math.min(stageBudgetRemaining, Math.max(1, Math.ceil(stageBudgetRemaining * share)));
      stageBudgetRemaining -= enemyBudget;
    }
    const block = buildFlatMiddleBlock(rng, currentFloor, { withCombat, hardEncounter, enemyBudget });
    blocks.push(block);
    pxSinceLastStair += block.chunk.width;
    if (withCombat) lastCombatBlock = block;
  }

  // A seed can plausibly roll zero combat blocks in the randomized body
  // (stairs/obstacle/no-combat-flat all beat the dice) — guarantee at least
  // one combat zone exists so the stage's authored budget always has
  // somewhere to go.
  if (!lastCombatBlock) {
    const block = buildFlatMiddleBlock(rng, currentFloor, { withCombat: true, hardEncounter: false, enemyBudget: 0 });
    blocks.push(block);
    lastCombatBlock = block;
  }

  // Whatever's left of the stage's total threat budget after every combat
  // block took its geometric share (see above) goes entirely to the last
  // combat block, so the full authored per-stage count table always ends
  // up assigned to some zone rather than quietly discarded when a
  // stage/seed happens to place few combat blocks.
  if (stageBudgetRemaining > 0) {
    lastCombatBlock.meta.encounterZone.enemyBudget += stageBudgetRemaining;
    stageBudgetRemaining = 0;
  }

  // Stage 10's deliberate final major wave — a separate, hand-authored
  // encounter on top of the randomized body, placed while still on
  // whatever floor the body left the player on and followed by the usual
  // forced descent + no-combat buffer before EXIT so it never sits directly
  // beside the exit or on a staircase.
  if (stage === 10) {
    blocks.push(buildFinalWaveBlock(rng, currentFloor));
  }

  // Every stage's EXIT sits at street level - walk back down if the
  // randomized body left the player elevated.
  while (currentFloor > FLOOR_MIN) {
    const toFloor = currentFloor - 1;
    blocks.push(buildStairsBlock(currentFloor, toFloor));
    currentFloor = toFloor;
  }

  // A stair (forced descent or otherwise) must never be the block
  // immediately before EXIT, the final wave block must never be either,
  // and — same as the main loop's own isLastSlot guard already
  // enforces for every combat block IT places — an enemy door must never
  // end up directly beside EXIT either. The "guarantee at least one
  // combat block" fallback above is the one place that can violate this:
  // it always sets withCombat:true regardless of position, since at the
  // time it runs there's no later block yet for it to land next to.
  const hasEnemyDoor = (b) => !!b && Object.values(b.meta.enemyDoors).some((list) => list.length > 0);
  const last = blocks[blocks.length - 1];
  if (last && (last.meta.type === 'middle_stairs' || last.meta.type === 'middle_final_wave' || hasEnemyDoor(last))) {
    blocks.push(buildFlatMiddleBlock(rng, currentFloor, { withCombat: false, hardEncounter: false, enemyBudget: 0 }));
  }

  return blocks;
}

// Validates the full stage-generation invariant checklist. Every one of
// these is also guaranteed structurally by how buildBodyBlocks/assemble are
// written (a stair block can never appear as the last body block, a stair
// block never carries doors, assemble() itself throws on any
// elevation-continuity break) — this function re-checks the same
// invariants explicitly so a future change to the generator that breaks one
// of them fails loudly instead of silently shipping a broken stage.
function validateStage(allBlocks, layout) {
  const errors = [];
  const [entrance, ...rest] = allBlocks;
  const exit = rest[rest.length - 1];
  const body = rest.slice(0, -1);

  if (!entrance || entrance.meta.type !== 'entrance') errors.push('missing ENTRANCE block');
  if (!exit || exit.meta.type !== 'exit') errors.push('missing EXIT block');
  if (entrance && (entrance.meta.stairs.length > 0)) errors.push('ENTRANCE must not contain stairs');
  if (exit && exit.meta.stairs.length > 0) errors.push('EXIT must not contain stairs');

  const lastBody = body[body.length - 1];
  if (lastBody && (lastBody.meta.type === 'middle_stairs' || lastBody.meta.type === 'middle_final_wave')) {
    errors.push('a stair or final-wave block sits directly beside EXIT');
  }
  if (lastBody) {
    const doorsAtExit = Object.values(lastBody.meta.enemyDoors).some((list) => list.length > 0);
    if (doorsAtExit) errors.push('an enemy door sits directly beside EXIT');
  }

  for (const b of body) {
    if (b.meta.type === 'middle_stairs') {
      const delta = Math.abs(b.meta.exitFloor - b.meta.entryFloor);
      if (delta !== 1) errors.push(`stair block ${b.meta.id} changes floor by ${delta}, must be exactly 1 (no Floor1->Floor3 skip)`);
      const doorsOnStairs = Object.values(b.meta.enemyDoors).some((list) => list.length > 0);
      if (doorsOnStairs) errors.push(`stair block ${b.meta.id} must not carry an enemy door`);
    }
  }

  if (exit && exit.meta.entryFloor !== FLOOR_MIN) errors.push('stage does not return to FLOOR_MIN before EXIT');

  // Continuity between consecutive blocks (assemble() already enforces this
  // by throwing, but re-check here so a validation failure - not a raw
  // exception - is what a bad future change would surface first).
  for (let i = 1; i < allBlocks.length; i++) {
    if (allBlocks[i].meta.entryFloor !== allBlocks[i - 1].meta.exitFloor) {
      errors.push(`block ${allBlocks[i].meta.id} entryFloor does not match previous block's exitFloor`);
    }
  }

  if (layout.length <= 0) errors.push('stage has zero playable length');

  if (errors.length) {
    throw new Error(`Stage generation validation failed:\n - ${errors.join('\n - ')}`);
  }
}

// Assembles a linear block sequence into flat stage geometry, validating
// that each block's entryElevation matches the running elevation left by
// the previous block. A mismatch is a bug in a block factory above, not a
// runtime condition to recover from — it must never silently produce an
// unreachable layout. Also collects each combat block's `encounterZone`
// into absolute world coordinates now that the cumulative x-offset of every
// block is known.
function assemble(blocks) {
  let cursorX = 0;
  let elevation = FLOOR_MIN;
  const solids = [];
  const stairs = [];
  const doorSpecs = [];
  const crateSpecs = [];
  const encounterZones = [];
  for (const block of blocks) {
    const chunk = block.chunk;
    if (chunk.entryElevation !== elevation) {
      throw new Error(`Stage chunk connection mismatch at x=${cursorX}: expected elevation ${elevation}, chunk starts at ${chunk.entryElevation}`);
    }
    for (const s of chunk.solids) solids.push({ ...s, x: s.x + cursorX });
    for (const st of chunk.stairs) stairs.push({ ...st, x: st.x + cursorX });
    for (const d of chunk.doors) doorSpecs.push({ id: d.id, x: cursorX + d.xOffset, elevation: d.elevation });
    for (const c of chunk.crates) crateSpecs.push({ x: cursorX + c.xOffset, type: c.type, destructible: c.destructible });
    if (block.meta.encounterZone) {
      encounterZones.push({ id: block.meta.id, startX: cursorX, endX: cursorX + chunk.width, ...block.meta.encounterZone });
    }
    cursorX += chunk.width;
    elevation = chunk.exitElevation;
  }
  if (elevation !== FLOOR_MIN) {
    throw new Error('Stage sequence must return to street level before the exit approach');
  }
  return { length: cursorX, solids, stairs, doorSpecs, crateSpecs, encounterZones };
}

// Public entry point. Works identically for curated stages 1-10 and
// indefinite procedural stages 11+ — there is only one stage-building
// system, difficulty is what scales with `stage`.
export function buildStageLayout(stage) {
  const rng = mulberry32(stage * 7919 + 13);
  const entrance = buildEntranceBlock(rng);
  const body = buildBodyBlocks(stage, rng);
  const exit = buildExitBlock(rng);
  const allBlocks = [entrance, ...body, exit];

  const layout = assemble(allBlocks);
  validateStage(allBlocks, layout);

  const baseGround = { x: -200, y: LEVEL.groundY, w: layout.length + 400, h: 2000, blocksBullets: true, texture: 'platform' };
  return {
    stage,
    length: layout.length,
    solids: [baseGround, ...layout.solids],
    stairs: layout.stairs,
    doorSpecs: layout.doorSpecs,
    crateSpecs: layout.crateSpecs,
    encounterZones: layout.encounterZones,
    entryX: entrance.chunk.width * 0.35,
    exitX: layout.length - exit.chunk.width * 0.35,
    isProcedural: stage > STAGES.curatedCount,
    blocks: allBlocks.map((b) => b.meta), // explicit per-block metadata, for debugging/tests
  };
}
