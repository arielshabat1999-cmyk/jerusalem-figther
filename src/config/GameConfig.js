// Central data-driven tuning. No gameplay system should hard-code a magic
// number that appears here — change balance by editing this file only.

export const WORLD = {
  gravity: 2200,
  terminalFallSpeed: 1400,
  pixelsPerMeter: 40, // world-unit <-> meter conversion (spec section 26/34)
};

export const PLAYER = {
  standWidth: 30,
  standHeight: 64,
  crouchHeight: 36,
  moveSpeed: 210,
  crouchMoveSpeed: 95,
  jumpVelocity: -780,
  maxHealth: 100,
  maxShield: 0, // raised via inventory shield upgrades
  healthRegen: {
    delaySec: 4.5, // time without taking damage before regen starts
    ratePerSec: 8,
    capPercent: 0.5,
  },
  hitReaction: {
    knockbackSpeed: 260,
    hitStunSec: 0.2,
    invulnSec: 0.45,
  },
  backtrackDistanceMeters: 20,
  // Walk/run use real multi-frame cycles (see ART_INTEGRATION_STATUS.md).
  // This is the distance (px) of horizontal travel per animation frame
  // advance, so cadence scales with actual movement speed rather than
  // wall-clock time - a fast run visibly cycles the legs faster than a
  // slow walk, and standing still never advances a frame.
  gaitPxPerFrame: 10,
};

// Visual-only scale normalization: every actor sheet was authored/extracted
// at its own native pixel size, so ArtAdapter scales each actor's rendered
// sprite (never the source crop, only the destination draw size) around its
// existing bottom-center anchor to this shared on-screen height. Collision
// hitboxes (PLAYER.standHeight/crouchHeight above, enemy w/h in Enemy.js)
// are completely unaffected by this — visible size stays independent of
// collision size by design.
export const CHARACTER_SCALE = {
  targetHeightPx: 72,
  heavyMultiplier: 1.3, // "strong" enemy variants read as intentionally larger, not just re-skinned
};

// Rifle muzzle anchor for the player, expressed in world pixels relative to
// the player's own feet (bottom-center, same point ArtAdapter anchors the
// sprite to) and the shared CHARACTER_SCALE visual height above it — NOT the
// small collision hitbox — so the projectile spawn point (and the
// muzzle-flash effect main.js spawns at that same x/y) both read as coming
// from the barrel instead of the player's center. heightFraction is measured
// up from the feet as a fraction of CHARACTER_SCALE.targetHeightPx;
// forwardPx is how far past the body centerline the muzzle sits in the
// current facing direction (mirrored automatically for facingDir -1).
// shoot/crouch_shoot values below are MEASURED from the approved player_male
// runtime frames (rifle-tip position within the chest-height band of the
// actual extracted art, converted from canvas-pixel to world-pixel via the
// same canvas-height/targetHeightPx ratio ArtAdapter uses to scale those
// sprites) - not estimates. The other poses never fire a shot mid-pose in
// this game (Player._muzzleSpawn only ever resolves to 'shoot' or
// 'crouch_shoot') so they stay as reasonable placeholders.
export const MUZZLE = {
  idle: { heightFraction: 0.62, forwardPx: 20 },
  walk: { heightFraction: 0.62, forwardPx: 21 },
  run: { heightFraction: 0.62, forwardPx: 23 },
  jump: { heightFraction: 0.60, forwardPx: 20 },
  fall: { heightFraction: 0.60, forwardPx: 20 },
  crouch_shoot: { heightFraction: 0.447, forwardPx: 29.8 },
  shoot: { heightFraction: 0.731, forwardPx: 31.5 },
};

// Weapon ids double as inventory keys and save-file keys.
// Prices/damage tuned to the Spawn Director's coin economy (spawn-director
// spec section 17/18): pistol carries stages 1-2, the rifle becomes
// affordable around stage 3, machine gun around stage 5-6, RPG around
// stage 8-10. Weapons are never auto-granted by stage — still purchase-only
// via Inventory (InventorySystem is untouched).
export const WEAPONS = {
  pistol: {
    id: 'pistol',
    name: 'Pistol',
    price: 0,
    ownedByDefault: true,
    fireMode: 'single',
    damage: 18,
    magSize: 8,
    reloadSec: 0.9,
    fireCooldownSec: 0.28,
    projectileSpeed: 900,
  },
  rifle: {
    id: 'rifle',
    name: 'Assault Rifle',
    price: 1800,
    fireMode: 'auto',
    damage: 28,
    magSize: 24,
    reloadSec: 1.4,
    fireCooldownSec: 0.12,
    projectileSpeed: 1000,
  },
  machinegun: {
    id: 'machinegun',
    name: 'Machine Gun',
    price: 4500,
    fireMode: 'auto',
    damage: 23,
    magSize: 45,
    reloadSec: 1.9,
    fireCooldownSec: 0.07,
    projectileSpeed: 1000,
  },
  rpg: {
    id: 'rpg',
    name: 'RPG',
    price: 9000,
    fireMode: 'single',
    damage: 140,
    magSize: 1,
    reloadSec: 2.8,
    fireCooldownSec: 0.5,
    projectileSpeed: 620,
    blastRadius: 120,
    isExplosive: true,
  },
};

// Upgrade caps keep balance from spiraling (spec section 9).
export const WEAPON_UPGRADES = {
  maxLevel: 5,
  perLevel: {
    damageMult: 0.12,
    fireRateMult: 0.08,
    reloadMult: 0.08,
  },
  priceForLevel: (weaponId, level) => Math.round(150 * level * level * (WEAPONS[weaponId].price / 100 + 1)),
};

export const SHIELD_UPGRADES = {
  maxLevel: 4,
  capacityPerLevel: 25,
  priceForLevel: (level) => 200 * level,
};

export const HEALING = {
  cooldownSec: 12,
  price: 60,
  restorePercent: 0.35,
};

// Base AI-behavioral stats only — these are read directly by EnemyAI.js and
// never touched by the Spawn Director. Every enemy is either 'ranged' or
// 'melee' behaviorally; the Spawn Director's enemy TIERS (below) layer HP/
// damage/speed/reward on top of whichever of these two base kinds a spawned
// enemy is assigned, but never introduce a third AI behavior.
export const ENEMIES = {
  ranged: {
    moveSpeed: 80,
    damage: 8,
    preferredMinDist: 160,
    preferredMaxDist: 420,
    fireCooldownSec: 1.3,
    reactionDelaySec: 0.35,
    evadeIntervalSec: 2.2,
  },
  melee: {
    moveSpeed: 150,
    damage: 14,
    meleeRange: 34,
    meleeCooldownSec: 0.9,
    knockbackOnHitSpeed: 320,
    reactionDelaySec: 0.2,
  },
  deathLingerSec: 4,
};

// Spawn Director enemy classes (spawn-director spec section 1). HP and coin
// reward are fixed per tier and intentionally NOT scaled by stage — the
// spec is explicit that difficulty should climb mainly through composition/
// count/pacing, not HP inflation. `damageMult`/`speedMult` layer onto the
// ranged/melee base stats above; `visualStrong` reuses the existing
// enemy_*_strong sprite family/scale (ArtAdapter/AnimationState) so heavier
// tiers read as visually bigger without adding a third art variant.
export const ENEMY_TIERS = {
  enemy1: { hp: 70, coinDrop: [35, 50], scoreValue: 100, damageMult: 1, speedMult: 1, threatCost: 1, visualStrong: false },
  enemy2: { hp: 110, coinDrop: [60, 80], scoreValue: 160, damageMult: 1.3, speedMult: 1.05, threatCost: 2, visualStrong: false },
  enemy3: { hp: 170, coinDrop: [100, 140], scoreValue: 240, damageMult: 1.6, speedMult: 1.1, threatCost: 3, visualStrong: true },
  heavy: { hp: 300, coinDrop: [220, 300], scoreValue: 420, damageMult: 2.1, speedMult: 0.85, threatCost: 5, visualStrong: true },
  elite: { hp: 450, coinDrop: [400, 550], scoreValue: 650, damageMult: 2.6, speedMult: 1.1, threatCost: 8, visualStrong: true },
};

export const ENEMY_TIER_ORDER = ['enemy1', 'enemy2', 'enemy3', 'heavy', 'elite'];

// "Never spawn an enemy type before its intended stage" (spawn-director
// spec section 3) — enforced by the Spawn Director regardless of what a
// stage's table/weights say.
export const ENEMY_FIRST_STAGE = { enemy1: 1, enemy2: 3, enemy3: 5, heavy: 7, elite: 9 };

// Authored per-stage progression (spawn-director spec section 2/8/12):
// `counts` is the total budget of each tier the Director may spend across
// the whole stage; `weights` drive weighted-random selection among
// currently-available/remaining tiers; `spawnDelayRange` is the randomized
// interval (section 8) between spawn decisions.
export const SPAWN_STAGE_TABLE = {
  1: { maxAlive: 3, counts: { enemy1: 12 }, weights: { enemy1: 100 }, spawnDelayRange: [2.5, 3.5] },
  2: { maxAlive: 4, counts: { enemy1: 15 }, weights: { enemy1: 100 }, spawnDelayRange: [2.5, 3.5] },
  3: { maxAlive: 4, counts: { enemy1: 12, enemy2: 5 }, weights: { enemy1: 70, enemy2: 30 }, spawnDelayRange: [2.2, 3.0] },
  4: { maxAlive: 5, counts: { enemy1: 10, enemy2: 8 }, weights: { enemy1: 55, enemy2: 45 }, spawnDelayRange: [2.2, 3.0] },
  5: { maxAlive: 5, counts: { enemy1: 6, enemy2: 10, enemy3: 5 }, weights: { enemy1: 15, enemy2: 50, enemy3: 35 }, spawnDelayRange: [1.8, 2.6] },
  6: { maxAlive: 6, counts: { enemy1: 4, enemy2: 10, enemy3: 8 }, weights: { enemy1: 8, enemy2: 42, enemy3: 50 }, spawnDelayRange: [1.8, 2.6] },
  7: { maxAlive: 6, counts: { enemy1: 2, enemy2: 8, enemy3: 10, heavy: 2 }, weights: { enemy1: 5, enemy2: 25, enemy3: 50, heavy: 20 }, spawnDelayRange: [1.5, 2.3] },
  8: { maxAlive: 7, counts: { enemy2: 6, enemy3: 12, heavy: 4 }, weights: { enemy2: 20, enemy3: 55, heavy: 25 }, spawnDelayRange: [1.5, 2.3] },
  9: { maxAlive: 7, counts: { enemy2: 4, enemy3: 10, heavy: 6, elite: 2 }, weights: { enemy2: 15, enemy3: 40, heavy: 35, elite: 10 }, spawnDelayRange: [1.3, 2.0] },
  10: { maxAlive: 8, counts: { enemy2: 2, enemy3: 10, heavy: 8, elite: 3 }, weights: { enemy2: 8, enemy3: 35, heavy: 42, elite: 15 }, spawnDelayRange: [1.3, 2.0] },
};

// Stage 11+ (procedural, spec section 30 of the base gameplay spec) reuses
// stage 10's composition/weights/pacing — HP/reward per tier still never
// scales — but grows the per-tier budget and the alive cap a little further
// so indefinite progression keeps getting harder through count/pacing only.
export function getSpawnStageConfig(stage) {
  const table = SPAWN_STAGE_TABLE[Math.min(stage, 10)];
  if (stage <= 10) return table;
  const growth = 1 + (stage - 10) * 0.12;
  const counts = {};
  for (const tier of Object.keys(table.counts)) counts[tier] = Math.round(table.counts[tier] * growth);
  return {
    maxAlive: Math.min(12, table.maxAlive + Math.floor((stage - 10) / 2)),
    counts,
    weights: table.weights,
    spawnDelayRange: table.spawnDelayRange,
  };
}

export const SPAWN_DIRECTOR = {
  // "Usually 1 active spawn door at a time, occasionally 2, never every
  // visible door" (section 6/7) — the normal cap; peak encounters (late
  // stages only, rare) may briefly go to 3.
  maxConcurrentOpenDoors: 2,
  peakMaxConcurrentOpenDoors: 3,
  peakEncounterChance: 0.12,
  peakEncounterMinStage: 7,
  // Never activate a door the player is standing this close to (section 22).
  doorSafeDistance: 90,
  // How much of a zone's remaining budget one encounter block "claims" when
  // generated — hard encounters claim a bigger share so the stage's whole
  // authored count table gets spent by stage end regardless of exactly how
  // many combat blocks a given stage happens to contain (see StageBuilder).
  zoneBudgetShare: { normal: 0.3, hard: 0.55 },
  emptyDoorChance: 0.18, // section 23 base-spec: some doors open and close with nobody inside
};

export const SPAWN_DOOR = {
  enemyExitDelaySec: 0.55,
  doorOpenCloseSec: 0.5,
};

// Coins have no attraction range: every dropped coin does a brief pop/
// bounce, then homes toward the player unconditionally regardless of
// distance, floor, or obstacles in between (see CoinSystem.js).
export const COINS = {
  collectRadius: 26, // world px — collected once the coin gets this close
  popDurationRange: [0.15, 0.3], // sec — brief visual pop/bounce before homing begins
  popVelocity: -180,
  homingMaxSpeed: 640,
  homingAccelPerSec: 2400, // how fast homing speed ramps up from a standstill
};

export const CRATE = {
  hp: 20,
  coinDrop: [1, 4],
};

export const CAMERA = {
  followLerp: 6,
  verticalLerp: 4,
  lookAheadX: 90,
};

export const SAVE = {
  schemaVersion: 1,
  storageKey: 'jerusalemFighter.save.v1',
};

export const STAGES = {
  curatedCount: 10,
};

// Day -> sunset -> night progression (spec: lighting progression across
// stages, art-pack: 3 lighting states). Cycles so procedural stage 11+
// keeps rotating through all three rather than freezing on one.
export function lightingStateForStage(stage) {
  const cycle = ['day', 'sunset', 'night'];
  return cycle[(stage - 1) % cycle.length];
}

export const LEVEL = {
  groundY: 640,
  floorHeight: 160,
  stairSpan: 130,
  clearZoneWidth: 230,
  // Stage-generation pacing (stage-generation spec sections 1/3/17), derived
  // from PLAYER.moveSpeed so "~N seconds of traversal" translates to actual
  // world-pixel widths: at 210px/s, 3-4s -> 630-840px, 4-7s -> 840-1470px.
  entranceWidthRange: [630, 840],
  exitWidthRange: [630, 840],
  stairGapRange: [840, 1470],
};

