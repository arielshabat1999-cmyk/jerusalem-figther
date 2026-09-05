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
  crouch_shoot: { heightFraction: 0.404, forwardPx: 15.1 },
  shoot: { heightFraction: 0.702, forwardPx: 20.4 },
};

// Weapon ids double as inventory keys and save-file keys.
export const WEAPONS = {
  pistol: {
    id: 'pistol',
    name: 'Pistol',
    price: 0,
    ownedByDefault: true,
    fireMode: 'single',
    damage: 14,
    magSize: 8,
    reloadSec: 0.9,
    fireCooldownSec: 0.28,
    projectileSpeed: 900,
  },
  rifle: {
    id: 'rifle',
    name: 'Assault Rifle',
    price: 300,
    fireMode: 'auto',
    damage: 11,
    magSize: 24,
    reloadSec: 1.4,
    fireCooldownSec: 0.12,
    projectileSpeed: 1000,
  },
  machinegun: {
    id: 'machinegun',
    name: 'Machine Gun',
    price: 550,
    fireMode: 'auto',
    damage: 7,
    magSize: 45,
    reloadSec: 1.9,
    fireCooldownSec: 0.07,
    projectileSpeed: 1000,
  },
  rpg: {
    id: 'rpg',
    name: 'RPG',
    price: 800,
    fireMode: 'single',
    damage: 60,
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

export const ENEMIES = {
  ranged: {
    hp: 30,
    moveSpeed: 80,
    scoreValue: 100,
    coinDrop: [1, 3],
    damage: 8,
    preferredMinDist: 160,
    preferredMaxDist: 420,
    fireCooldownSec: 1.3,
    reactionDelaySec: 0.35,
    evadeIntervalSec: 2.2,
  },
  melee: {
    hp: 24,
    moveSpeed: 150,
    scoreValue: 120,
    coinDrop: [1, 3],
    damage: 14,
    meleeRange: 34,
    meleeCooldownSec: 0.9,
    knockbackOnHitSpeed: 320,
    reactionDelaySec: 0.2,
  },
  strong: {
    // Applied as a multiplier layer on top of ranged/melee base stats.
    hpMult: 1.4,
    damageMult: 1.6,
    speedMult: 1.2,
    fireCooldownMult: 0.7,
    reactionDelayMult: 0.5,
  },
  deathLingerSec: 4,
};

export const DIFFICULTY = {
  activeEnemyLimitByStage: (stage) => (stage <= 3 ? 4 : Math.min(8, 4 + Math.floor((stage - 3) / 2))),
  enemyCountForStage: (stage) => Math.min(18, 4 + stage * 2),
  strongEnemyChance: (stage) => Math.min(0.45, Math.max(0, (stage - 2) * 0.05)),
  statScaleForStage: (stage) => 1 + Math.max(0, stage - 1) * 0.06,
};

export const SPAWN_DOOR = {
  activationAheadDistance: 460, // world units ahead of progression frontier
  enemyExitDelaySec: 0.55,
  emptyDoorChance: 0.18,
  doorOpenCloseSec: 0.5,
};

export const COINS = {
  magnetRadius: 100,
  collectRadius: 20,
  magnetSpeed: 520,
  popVelocity: -180,
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
  entryApproachWidth: 260,
  exitApproachWidth: 260,
};

