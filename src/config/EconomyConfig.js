// ============================================================================
// ECONOMY CONFIG — the SINGLE SOURCE OF TRUTH for weapon purchase prices,
// weapon damage/magazine, weapon upgrade effects/prices, enemy HP/coin
// rewards, and stage enemy-composition progression.
//
// Nothing else in the codebase may define or duplicate these numbers. Every
// consumer (WeaponSystem, InventorySystem, InventoryUI, Player, Enemy,
// StageBuilder, StageSystem, SaveSystem) imports directly from this file.
// Arcade-simple by design: no crafting, no rarity, no skill trees, no
// random weapon stats.
// ============================================================================

export const WEAPON_IDS = ['pistol', 'rifle', 'machinegun', 'rpg'];

// Base weapon stats. `price`/`damage`/`magSize` are the values upgrades are
// applied on top of — never mutated in place.
export const WEAPONS = {
  pistol: {
    id: 'pistol',
    name: 'Pistol',
    price: 0,
    ownedByDefault: true,
    fireMode: 'single',
    damage: 18,
    magSize: 12,
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
    magSize: 30,
    reloadSec: 1.4,
    fireCooldownSec: 0.12,
    projectileSpeed: 1000,
  },
  machinegun: {
    id: 'machinegun',
    name: 'Machine Gun',
    price: 4800,
    fireMode: 'auto',
    damage: 24,
    magSize: 60,
    reloadSec: 1.9,
    fireCooldownSec: 0.07,
    projectileSpeed: 1000,
  },
  rpg: {
    id: 'rpg',
    name: 'RPG',
    price: 9500,
    fireMode: 'single',
    damage: 150,
    magSize: 1,
    reloadSec: 2.8,
    fireCooldownSec: 0.5,
    projectileSpeed: 620,
    blastRadius: 120,
    isExplosive: true,
  },
};

// Exactly 3 independent upgrade categories, 3 levels each. Every level value
// is the FINAL multiplier for that level — never stacked/compounded across
// levels (Damage Lv2 = baseDamage * 1.25, never baseDamage * 1.12 * 1.25).
// Level 0 (not purchased) is always multiplier 1 (no effect).
export const UPGRADE_CATEGORIES = ['damage', 'fireRate', 'magazine'];

export const UPGRADE_EFFECTS = {
  damage: { 0: 1, 1: 1.12, 2: 1.25, 3: 1.40 },
  fireRate: { 0: 1, 1: 1.08, 2: 1.16, 3: 1.25 },
  magazine: { 0: 1, 1: 1.25, 2: 1.50, 3: 2.00 },
};

export const MAX_UPGRADE_LEVEL = 3;

// Same price for all 3 categories of a given weapon at a given level —
// purchased independently, Lv2 requires Lv1 in the same category first.
export const UPGRADE_PRICES = {
  pistol: { 1: 350, 2: 750, 3: 1300 },
  rifle: { 1: 900, 2: 1700, 3: 2800 },
  machinegun: { 1: 1400, 2: 2600, 3: 4200 },
  rpg: { 1: 2200, 2: 4000, 3: 6500 },
};

export function upgradePrice(weaponId, category, level) {
  return UPGRADE_PRICES[weaponId]?.[level] ?? null;
}

export function defaultUpgradeLevels() {
  return { damage: 0, fireRate: 0, magazine: 0 };
}

// Enemy identity tiers. HP and coin reward are fixed per tier and
// deliberately NOT scaled by stage — difficulty climbs through composition/
// spawn pressure/max-alive instead (see STAGE_COMPOSITION below).
// `damageMult`/`speedMult` layer onto the existing ranged/melee AI behavior
// base stats (GameConfig.ENEMIES) — tiers never add a new AI behavior.
// `visualStrong` reuses the existing enemy_*_strong sprite family/scale so
// heavier tiers read as visually bigger without a third art variant.
export const ENEMY_TIER_ORDER = ['enemy1', 'enemy2', 'enemy3', 'heavy', 'elite'];

export const ENEMY_TIERS = {
  enemy1: { hp: 70, coinMin: 35, coinMax: 50, scoreValue: 100, damageMult: 1, speedMult: 1, visualStrong: false },
  enemy2: { hp: 110, coinMin: 60, coinMax: 80, scoreValue: 160, damageMult: 1.3, speedMult: 1.05, visualStrong: false },
  enemy3: { hp: 170, coinMin: 100, coinMax: 140, scoreValue: 240, damageMult: 1.6, speedMult: 1.1, visualStrong: true },
  heavy: { hp: 300, coinMin: 220, coinMax: 300, scoreValue: 420, damageMult: 2.1, speedMult: 0.85, visualStrong: true },
  elite: { hp: 450, coinMin: 400, coinMax: 550, scoreValue: 650, damageMult: 2.6, speedMult: 1.1, visualStrong: true },
};

// "Never spawn an enemy type before its intended stage."
export const ENEMY_FIRST_STAGE = { enemy1: 1, enemy2: 3, enemy3: 5, heavy: 7, elite: 9 };

// Authored per-stage composition: `maxAlive` and the total budget of each
// tier available to be drawn from while generating that stage's doors.
export const STAGE_COMPOSITION = {
  1: { maxAlive: 3, counts: { enemy1: 12 } },
  2: { maxAlive: 4, counts: { enemy1: 15 } },
  3: { maxAlive: 4, counts: { enemy1: 12, enemy2: 5 } },
  4: { maxAlive: 5, counts: { enemy1: 10, enemy2: 8 } },
  5: { maxAlive: 5, counts: { enemy1: 6, enemy2: 10, enemy3: 5 } },
  6: { maxAlive: 6, counts: { enemy1: 4, enemy2: 10, enemy3: 8 } },
  7: { maxAlive: 6, counts: { enemy1: 2, enemy2: 8, enemy3: 10, heavy: 2 } },
  8: { maxAlive: 7, counts: { enemy2: 6, enemy3: 12, heavy: 4 } },
  9: { maxAlive: 7, counts: { enemy2: 4, enemy3: 10, heavy: 6, elite: 2 } },
  10: { maxAlive: 8, counts: { enemy2: 2, enemy3: 10, heavy: 8, elite: 3 } },
};

// Stage 11+ (procedural) reuses stage 10's shape — HP/reward per tier still
// never scales — but grows the per-tier budget and alive cap a little
// further so indefinite progression keeps getting harder through
// count/pressure only.
export function getStageComposition(stage) {
  const table = STAGE_COMPOSITION[Math.min(stage, 10)];
  if (stage <= 10) return table;
  const growth = 1 + (stage - 10) * 0.12;
  const counts = {};
  for (const tier of Object.keys(table.counts)) counts[tier] = Math.round(table.counts[tier] * growth);
  return { maxAlive: Math.min(12, table.maxAlive + Math.floor((stage - 10) / 2)), counts };
}
