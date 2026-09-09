import { SAVE } from '../config/GameConfig.js';
import { WEAPONS, defaultUpgradeLevels } from '../config/EconomyConfig.js';

// Versioned localStorage schema (spec section 15/16/34). Add a migration
// branch in `migrate()` whenever schemaVersion increments — never mutate
// old saves in place without a migration path.
function defaultOwnedWeapons() {
  const owned = {};
  for (const id of Object.keys(WEAPONS)) owned[id] = !!WEAPONS[id].ownedByDefault;
  return owned;
}

function defaultWeaponUpgradeLevels() {
  const levels = {};
  for (const id of Object.keys(WEAPONS)) levels[id] = defaultUpgradeLevels();
  return levels;
}

function defaultSave() {
  return {
    schemaVersion: SAVE.schemaVersion,
    currentStage: 1,
    highestStage: 1,
    totalCoins: 0,
    score: 0,
    ownedWeapons: defaultOwnedWeapons(),
    weaponUpgradeLevels: defaultWeaponUpgradeLevels(),
    activeWeaponId: 'pistol',
    shieldUpgradeLevel: 0,
    characterGender: 'male', // art-pack: male/female are both selectable, no gameplay difference
  };
}

// v1 -> v2 (economy reset): weaponUpgradeLevels[id] used to be a single
// 0-5 number under the OLD economy. That shape cannot be mapped onto the
// new 3 independent 0-3 categories (damage/fireRate/magazine), so upgrades
// reset to 0 under the new economy going forward — but ownership, equipped
// weapon, coins, score, and stage progression are all preserved exactly
// (economy spec section 15: "preserve ownership and progression where
// possible, but use NEW economy values going forward").
function migrateV1ToV2(data) {
  return {
    schemaVersion: SAVE.schemaVersion,
    currentStage: data.currentStage ?? 1,
    highestStage: data.highestStage ?? 1,
    totalCoins: data.totalCoins ?? 0,
    score: data.score ?? 0,
    ownedWeapons: { ...defaultOwnedWeapons(), ...data.ownedWeapons },
    weaponUpgradeLevels: defaultWeaponUpgradeLevels(),
    activeWeaponId: data.activeWeaponId in defaultOwnedWeapons() ? data.activeWeaponId : 'pistol',
    shieldUpgradeLevel: data.shieldUpgradeLevel ?? 0,
    characterGender: data.characterGender === 'female' ? 'female' : 'male',
  };
}

function migrate(data) {
  if (!data || typeof data.schemaVersion !== 'number') return defaultSave();
  if (data.schemaVersion === SAVE.schemaVersion) return data;
  if (data.schemaVersion === 1) return migrateV1ToV2(data);
  // Unknown/future version this build doesn't understand — safest to reset
  // rather than risk loading a shape that silently breaks the new economy.
  return defaultSave();
}

export class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE.storageKey);
      if (!raw) return defaultSave();
      return migrate(JSON.parse(raw));
    } catch {
      return defaultSave();
    }
  }

  persist() {
    try {
      localStorage.setItem(SAVE.storageKey, JSON.stringify(this.data));
    } catch {
      // Storage unavailable (private mode, quota) — progression stays in
      // memory for this session rather than crashing gameplay.
    }
  }

  setStage(stage) {
    this.data.currentStage = stage;
    this.data.highestStage = Math.max(this.data.highestStage, stage);
    this.persist();
  }

  addCoins(n) {
    this.data.totalCoins += n;
    this.persist();
  }

  spendCoins(n) {
    if (this.data.totalCoins < n) return false;
    this.data.totalCoins -= n;
    this.persist();
    return true;
  }

  addScore(n) {
    this.data.score += n;
    this.persist();
  }

  buyWeapon(id) {
    this.data.ownedWeapons[id] = true;
    this.persist();
  }

  setWeaponUpgradeLevel(id, category, level) {
    if (!this.data.weaponUpgradeLevels[id]) this.data.weaponUpgradeLevels[id] = defaultUpgradeLevels();
    this.data.weaponUpgradeLevels[id][category] = level;
    this.persist();
  }

  setActiveWeapon(id) {
    this.data.activeWeaponId = id;
    this.persist();
  }

  setShieldUpgradeLevel(level) {
    this.data.shieldUpgradeLevel = level;
    this.persist();
  }

  setCharacterGender(gender) {
    this.data.characterGender = gender === 'female' ? 'female' : 'male';
    this.persist();
  }
}
