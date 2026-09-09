// ============================================================================
// GAME BALANCE — the dev dashboard's central registry.
//
// Design: rather than a parallel "override" copy the real systems don't
// know about, this module holds direct references to the SAME objects the
// game already reads every frame (PLAYER, WORLD, CAMERA, SPAWN_DOOR,
// ENEMIES from GameConfig.js; WEAPONS, ENEMY_TIERS, UPGRADE_EFFECTS,
// UPGRADE_PRICES, STAGE_COMPOSITION from EconomyConfig.js) and mutates
// their properties in place. Every consumer reads these fresh each time
// (nothing caches them at module load), so an edit here IS the same edit
// the real game systems see — never a fake, disconnected debug value.
//
// A handful of concepts this game doesn't have a config slot for yet
// (global time scale, per-run speed multipliers, godmode/infinite-ammo/
// no-reload/one-hit-kill toggles, debug-draw flags) live in DEV_RUNTIME —
// still real, still read every frame by the real systems listed in each
// comment below, just newly introduced rather than pre-existing.
// ============================================================================

import { WORLD, PLAYER, CAMERA, ENEMIES, SPAWN_DOOR } from '../config/GameConfig.js';
import {
  WEAPONS,
  UPGRADE_EFFECTS,
  UPGRADE_PRICES,
  ENEMY_TIERS,
  ENEMY_TIER_ORDER,
  STAGE_COMPOSITION,
} from '../config/EconomyConfig.js';
import { STAGE_GEN, LEVEL } from '../config/GameConfig.js';

// Runtime-only knobs with no pre-existing config home. Real systems read
// these every frame/every relevant call — see the wiring comment on each.
export const DEV_RUNTIME = {
  player: {
    godMode: false, // Player.applyDamage: early-return, no damage taken
    infiniteAmmo: false, // WeaponRuntime.consumeShot: skip ammo decrement
    noReload: false, // WeaponRuntime: reload completes instantly
    damageTakenMult: 1, // Player.applyDamage: multiplies incoming damage
  },
  gameFeel: {
    timeScale: 1, // GameLoop: multiplies simulated dt per real frame
    enemySpeedMult: 1, // Enemy constructor: multiplies tier speed
    projectileSpeedMult: 1, // Player/Enemy muzzle spawn: multiplies projectile vx
  },
  economy: {
    coinMultiplier: 1, // SaveSystem.addCoins
    scoreMultiplier: 1, // SaveSystem.addScore
    stageBonus: 0, // main.js advanceStage: one-time bonus on stage clear
  },
  spawns: {
    paused: false, // StageSystem.update: skip spawnDoorSystem.update entirely
    maxAliveOverride: null, // StageSystem: null = use the stage's own composition maxAlive
  },
  enemyAI: {
    frozen: false, // main.js enemy loop: skip AI tick + physics step
    oneHitKill: false, // main.js onActorHit: force lethal damage to enemies
  },
  debug: {
    showCollision: false,
    showHitboxes: false,
    showSpawnDoors: false,
    showEnemyHP: false,
    showProjectileHitboxes: false,
    showCameraCoords: false,
    showFPS: false,
  },
};

// The "balance" surface the dashboard edits, grouped the way the spec asks
// (player/gameFeel/enemies/spawns/economy/weapons/upgrades/stages). Getters
// read the LIVE objects above; nothing here is cached/duplicated.
function enemiesSnapshot() {
  const out = {};
  for (const tier of ENEMY_TIER_ORDER) out[tier] = { ...ENEMY_TIERS[tier] };
  out._rangedFireCooldownSec = ENEMIES.ranged.fireCooldownSec; // shared across all ranged-behavior tiers — see report
  out._meleeCooldownSec = ENEMIES.melee.meleeCooldownSec; // shared across all melee-behavior tiers
  return out;
}

function stagesSnapshot() {
  const composition = {};
  for (const stage of Object.keys(STAGE_COMPOSITION)) composition[stage] = JSON.parse(JSON.stringify(STAGE_COMPOSITION[stage]));
  return {
    composition,
    entryApproachWidth: LEVEL.entryApproachWidth,
    exitApproachWidth: LEVEL.exitApproachWidth,
    ...STAGE_GEN,
  };
}

export function getBalanceSnapshot() {
  return {
    player: {
      maxHealth: PLAYER.maxHealth,
      moveSpeed: PLAYER.moveSpeed,
      crouchMoveSpeed: PLAYER.crouchMoveSpeed,
      jumpVelocity: PLAYER.jumpVelocity,
      gravity: WORLD.gravity,
      hitStunSec: PLAYER.hitReaction.hitStunSec,
      invulnSec: PLAYER.hitReaction.invulnSec,
      regenDelaySec: PLAYER.healthRegen.delaySec,
      regenRatePerSec: PLAYER.healthRegen.ratePerSec,
      regenCapPercent: PLAYER.healthRegen.capPercent,
      godMode: DEV_RUNTIME.player.godMode,
      infiniteAmmo: DEV_RUNTIME.player.infiniteAmmo,
      noReload: DEV_RUNTIME.player.noReload,
      damageTakenMult: DEV_RUNTIME.player.damageTakenMult,
    },
    gameFeel: { ...DEV_RUNTIME.gameFeel, cameraFollowLerp: CAMERA.followLerp, cameraVerticalLerp: CAMERA.verticalLerp },
    enemies: enemiesSnapshot(),
    spawns: {
      activationAheadDistance: SPAWN_DOOR.activationAheadDistance,
      enemyExitDelaySec: SPAWN_DOOR.enemyExitDelaySec,
      doorOpenCloseSec: SPAWN_DOOR.doorOpenCloseSec,
      emptyDoorChance: SPAWN_DOOR.emptyDoorChance,
      paused: DEV_RUNTIME.spawns.paused,
      maxAliveOverride: DEV_RUNTIME.spawns.maxAliveOverride,
    },
    economy: { ...DEV_RUNTIME.economy },
    weapons: JSON.parse(JSON.stringify(WEAPONS)),
    upgrades: { effects: JSON.parse(JSON.stringify(UPGRADE_EFFECTS)), prices: JSON.parse(JSON.stringify(UPGRADE_PRICES)) },
    stages: stagesSnapshot(),
    debug: { ...DEV_RUNTIME.debug, frozen: DEV_RUNTIME.enemyAI.frozen, oneHitKill: DEV_RUNTIME.enemyAI.oneHitKill },
  };
}

// Captured once, at module load, before any dev edit — the reset target
// and the "is this value dirty" comparison baseline.
export const PRODUCTION_DEFAULTS = getBalanceSnapshot();

export function isDirty(section, key) {
  const current = getBalanceSnapshot()[section]?.[key];
  const original = PRODUCTION_DEFAULTS[section]?.[key];
  return JSON.stringify(current) !== JSON.stringify(original);
}

export function isSectionDirty(section) {
  return JSON.stringify(getBalanceSnapshot()[section]) !== JSON.stringify(PRODUCTION_DEFAULTS[section]);
}

// --- Mutators: every one of these writes into the SAME live object the
// real game reads, never a parallel copy. ---

export function setPlayerField(key, value) {
  switch (key) {
    case 'maxHealth': PLAYER.maxHealth = value; break;
    case 'moveSpeed': PLAYER.moveSpeed = value; break;
    case 'crouchMoveSpeed': PLAYER.crouchMoveSpeed = value; break;
    case 'jumpVelocity': PLAYER.jumpVelocity = value; break;
    case 'gravity': WORLD.gravity = value; break;
    case 'hitStunSec': PLAYER.hitReaction.hitStunSec = value; break;
    case 'invulnSec': PLAYER.hitReaction.invulnSec = value; break;
    case 'regenDelaySec': PLAYER.healthRegen.delaySec = value; break;
    case 'regenRatePerSec': PLAYER.healthRegen.ratePerSec = value; break;
    case 'regenCapPercent': PLAYER.healthRegen.capPercent = value; break;
    case 'godMode': DEV_RUNTIME.player.godMode = value; break;
    case 'infiniteAmmo': DEV_RUNTIME.player.infiniteAmmo = value; break;
    case 'noReload': DEV_RUNTIME.player.noReload = value; break;
    case 'damageTakenMult': DEV_RUNTIME.player.damageTakenMult = value; break;
    default: break;
  }
}

export function setGameFeelField(key, value) {
  if (key === 'cameraFollowLerp') { CAMERA.followLerp = value; return; }
  if (key === 'cameraVerticalLerp') { CAMERA.verticalLerp = value; return; }
  if (key in DEV_RUNTIME.gameFeel) DEV_RUNTIME.gameFeel[key] = value;
}

export function setEnemyTierField(tier, key, value) {
  if (ENEMY_TIERS[tier] && key in ENEMY_TIERS[tier]) ENEMY_TIERS[tier][key] = value;
}

export function setEnemyBehaviorField(key, value) {
  if (key === '_rangedFireCooldownSec') ENEMIES.ranged.fireCooldownSec = value;
  if (key === '_meleeCooldownSec') ENEMIES.melee.meleeCooldownSec = value;
}

export function setSpawnField(key, value) {
  if (key === 'paused') { DEV_RUNTIME.spawns.paused = value; return; }
  if (key === 'maxAliveOverride') { DEV_RUNTIME.spawns.maxAliveOverride = value; return; }
  if (key in SPAWN_DOOR) SPAWN_DOOR[key] = value;
}

export function setEconomyField(key, value) {
  if (key in DEV_RUNTIME.economy) DEV_RUNTIME.economy[key] = value;
}

export function setEnemyRewardField(tier, key, value) {
  if (ENEMY_TIERS[tier] && (key === 'coinMin' || key === 'coinMax')) ENEMY_TIERS[tier][key] = value;
}

export function setWeaponField(weaponId, key, value) {
  if (WEAPONS[weaponId] && key in WEAPONS[weaponId]) WEAPONS[weaponId][key] = value;
}

export function setUpgradeEffect(category, level, value) {
  if (UPGRADE_EFFECTS[category]) UPGRADE_EFFECTS[category][level] = value;
}

export function setUpgradePrice(weaponId, level, value) {
  if (UPGRADE_PRICES[weaponId]) UPGRADE_PRICES[weaponId][level] = value;
}

export function setStageCompositionField(stage, key, value) {
  if (!STAGE_COMPOSITION[stage]) return;
  if (key === 'maxAlive') STAGE_COMPOSITION[stage].maxAlive = value;
}

export function setStageCompositionCount(stage, tier, value) {
  if (!STAGE_COMPOSITION[stage]) return;
  STAGE_COMPOSITION[stage].counts[tier] = value;
}

export function setStageGenField(key, value) {
  if (key === 'entryApproachWidth') { LEVEL.entryApproachWidth = value; return; }
  if (key === 'exitApproachWidth') { LEVEL.exitApproachWidth = value; return; }
  if (key in STAGE_GEN) STAGE_GEN[key] = value;
}

export function setDebugFlag(key, value) {
  if (key === 'frozen') { DEV_RUNTIME.enemyAI.frozen = value; return; }
  if (key === 'oneHitKill') { DEV_RUNTIME.enemyAI.oneHitKill = value; return; }
  if (key in DEV_RUNTIME.debug) DEV_RUNTIME.debug[key] = value;
}

// --- Reset ---

// Applies a full/partial balance-shaped patch back into the live objects —
// used by both "load preset" and "reset to defaults" (reset just replays
// the captured PRODUCTION_DEFAULTS snapshot through the same path).
export function applyBalancePatch(patch) {
  if (patch.player) {
    for (const [k, v] of Object.entries(patch.player)) setPlayerField(k, v);
  }
  if (patch.gameFeel) {
    for (const [k, v] of Object.entries(patch.gameFeel)) setGameFeelField(k, v);
  }
  if (patch.enemies) {
    for (const [tier, cfg] of Object.entries(patch.enemies)) {
      if (tier === '_rangedFireCooldownSec' || tier === '_meleeCooldownSec') { setEnemyBehaviorField(tier, cfg); continue; }
      if (!ENEMY_TIERS[tier]) continue;
      for (const [k, v] of Object.entries(cfg)) setEnemyTierField(tier, k, v);
    }
  }
  if (patch.spawns) {
    for (const [k, v] of Object.entries(patch.spawns)) setSpawnField(k, v);
  }
  if (patch.economy) {
    for (const [k, v] of Object.entries(patch.economy)) setEconomyField(k, v);
  }
  if (patch.weapons) {
    for (const [id, cfg] of Object.entries(patch.weapons)) {
      if (!WEAPONS[id]) continue;
      for (const [k, v] of Object.entries(cfg)) setWeaponField(id, k, v);
    }
  }
  if (patch.upgrades) {
    if (patch.upgrades.effects) {
      for (const [cat, levels] of Object.entries(patch.upgrades.effects)) {
        for (const [lvl, v] of Object.entries(levels)) setUpgradeEffect(cat, lvl, v);
      }
    }
    if (patch.upgrades.prices) {
      for (const [id, levels] of Object.entries(patch.upgrades.prices)) {
        for (const [lvl, v] of Object.entries(levels)) setUpgradePrice(id, lvl, v);
      }
    }
  }
  if (patch.stages) {
    if (patch.stages.composition) {
      for (const [stage, cfg] of Object.entries(patch.stages.composition)) {
        setStageCompositionField(stage, 'maxAlive', cfg.maxAlive);
        for (const [tier, v] of Object.entries(cfg.counts || {})) setStageCompositionCount(stage, tier, v);
      }
    }
    for (const key of ['entryApproachWidth', 'exitApproachWidth', 'rooftopChanceBase', 'rooftopChancePerStage', 'rooftopChanceCap', 'obstacleChance', 'unitCountBase', 'unitCountPerStage', 'unitCountCap']) {
      if (patch.stages[key] !== undefined) setStageGenField(key, patch.stages[key]);
    }
  }
  if (patch.debug) {
    for (const [k, v] of Object.entries(patch.debug)) setDebugFlag(k, v);
  }
}

export function resetToDefaults() {
  applyBalancePatch(JSON.parse(JSON.stringify(PRODUCTION_DEFAULTS)));
}

export function resetSection(section) {
  applyBalancePatch({ [section]: JSON.parse(JSON.stringify(PRODUCTION_DEFAULTS[section])) });
}

// --- Presets (dev-only, kept entirely separate from the player's own save
// under jerusalemFighter.save.v1 — never touches coins/weapons/progress). ---

const PRESET_KEY = 'jerusalemFighter.devPresets.v1';

function loadPresetStore() {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY)) || {};
  } catch {
    return {};
  }
}

function savePresetStore(store) {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(store));
  } catch {
    // ignore — dev tooling only, never blocks real gameplay
  }
}

export function listPresets() {
  return Object.keys(loadPresetStore());
}

export function savePreset(name) {
  const store = loadPresetStore();
  store[name] = getBalanceSnapshot();
  savePresetStore(store);
}

export function loadPreset(name) {
  const store = loadPresetStore();
  if (!store[name]) return false;
  applyBalancePatch(store[name]);
  return true;
}

export function deletePreset(name) {
  const store = loadPresetStore();
  delete store[name];
  savePresetStore(store);
}

export function exportBalanceJSON() {
  return JSON.stringify({ label: 'PRODUCTION BALANCE CANDIDATE', generatedAt: new Date().toISOString(), balance: getBalanceSnapshot() }, null, 2);
}
