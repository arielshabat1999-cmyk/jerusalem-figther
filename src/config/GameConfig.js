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

// Weapon prices/damage/magazine and their upgrades now live in
// EconomyConfig.js (the single source of truth for the whole economy) —
// see WEAPONS/UPGRADE_EFFECTS/UPGRADE_PRICES there.

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

// Base AI-behavioral stats only (read directly by EnemyAI.js) — HP, coin
// reward, and stage composition/unlock/maxAlive are economy data and live
// in EconomyConfig.js (ENEMY_TIERS/STAGE_COMPOSITION/ENEMY_FIRST_STAGE).
// `damage`/`moveSpeed` here are the base an enemy tier's damageMult/
// speedMult multiplies onto — never a duplicate of the economy's own
// numbers.
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

export const SPAWN_DOOR = {
  enemyExitDelaySec: 0.55,
  doorOpenCloseSec: 0.5,
};

// The Spawn Director (systems/SpawnDirector.js): decides WHAT spawns,
// WHERE (door/floor), and WHEN. Pure pacing/behavior knobs — never
// duplicates ENEMY_TIERS/STAGE_COMPOSITION economy data (EconomyConfig.js).
export const SPAWN_DIRECTOR = {
  // Usually 1 active spawn door at a time, occasionally 2, never every
  // visible door; peak encounters (late stages only, rare) may briefly go
  // to 3.
  maxConcurrentOpenDoors: 2,
  peakMaxConcurrentOpenDoors: 3,
  peakEncounterChance: 0.12,
  peakEncounterMinStage: 7,
  // Never activate a door the player is standing this close to.
  doorSafeDistance: 90,
  // How much of a zone's remaining budget one encounter block "claims" when
  // generated — hard encounters claim a bigger share so the stage's whole
  // authored count table gets spent by stage end regardless of exactly how
  // many combat blocks a given stage happens to contain (see StageBuilder).
  zoneBudgetShare: { normal: 0.3, hard: 0.55 },
  emptyDoorChance: 0.18, // some doors open and close with nobody inside
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

// Bumped to 2 for the economy reset: weaponUpgradeLevels changed shape from
// a single 0-5 number per weapon to 3 independent 0-3 category levels
// ({damage,fireRate,magazine}) — see SaveSystem.js's migration.
export const SAVE = {
  schemaVersion: 2,
  storageKey: 'jerusalemFighter.save.v1',
};

export const STAGES = {
  curatedCount: 10,
};

// Stage-body generation knobs (StageBuilder.buildBodyBlocks), lifted out of
// inline magic numbers into data so the dev dashboard's Stage tab can tune
// them live without touching the generator's logic itself.
export const STAGE_GEN = {
  unitCountBase: 3,
  unitCountPerStage: 0.5, // unitCount = min(unitCountCap, unitCountBase + floor(stage * unitCountPerStage))
  unitCountCap: 10,
  stairChanceBase: 0.12,
  stairChancePerStage: 0.025,
  stairChanceCap: 0.5,
  obstacleChance: 0.2, // rolled independently per non-stair body slot
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
  // Stage-generation pacing, derived from PLAYER.moveSpeed so "~N seconds of
  // traversal" translates to actual world-pixel widths (at 210px/s, 3-4s ->
  // 630-840px). Read by BlockLibrary.js's ENTRANCE/EXIT blocks and
  // StageBuilder's stair-gap pacing.
  entranceWidthRange: [630, 840],
  exitWidthRange: [630, 840],
  stairGapRange: [840, 1470],
};

