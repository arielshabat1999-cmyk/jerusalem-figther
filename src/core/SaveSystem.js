import { SAVE, WEAPONS } from '../config/GameConfig.js';

// Versioned localStorage schema (spec section 16/34). Add a migration branch
// in `load()` whenever schemaVersion increments — never mutate old saves in
// place without a migration path.
function defaultSave() {
  const ownedWeapons = {};
  const weaponUpgradeLevels = {};
  for (const id of Object.keys(WEAPONS)) {
    ownedWeapons[id] = !!WEAPONS[id].ownedByDefault;
    weaponUpgradeLevels[id] = 0;
  }
  return {
    schemaVersion: SAVE.schemaVersion,
    currentStage: 1,
    highestStage: 1,
    totalCoins: 0,
    score: 0,
    ownedWeapons,
    weaponUpgradeLevels,
    activeWeaponId: 'pistol',
    shieldUpgradeLevel: 0,
  };
}

function migrate(data) {
  // No prior versions exist yet; fall through to defaults on any mismatch.
  if (!data || data.schemaVersion !== SAVE.schemaVersion) return defaultSave();
  return data;
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

  setWeaponUpgradeLevel(id, level) {
    this.data.weaponUpgradeLevels[id] = level;
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
}
