import { WEAPONS, WEAPON_UPGRADES } from '../config/GameConfig.js';

// Applies an upgrade level on top of a base weapon definition. Kept as a
// pure function so balance changes stay data-driven (spec section 9/34).
export function getEffectiveWeaponStats(weaponId, upgradeLevel = 0) {
  const base = WEAPONS[weaponId];
  const level = Math.min(WEAPON_UPGRADES.maxLevel, upgradeLevel);
  const { damageMult, fireRateMult, reloadMult } = WEAPON_UPGRADES.perLevel;
  return {
    ...base,
    damage: base.damage * (1 + damageMult * level),
    fireCooldownSec: base.fireCooldownSec * (1 - fireRateMult * level),
    reloadSec: base.reloadSec * (1 - reloadMult * level),
  };
}

// Per-actor runtime state for one weapon. Enemies and the player share this
// so "reload matters" and "automatic reload" behave identically everywhere.
export class WeaponRuntime {
  constructor(weaponId, upgradeLevel = 0) {
    this.weaponId = weaponId;
    this.upgradeLevel = upgradeLevel;
    this.stats = getEffectiveWeaponStats(weaponId, upgradeLevel);
    this.ammoInMag = this.stats.magSize;
    this.cooldownTimer = 0;
    this.reloadTimer = 0;
    this.reloading = false;
  }

  setUpgradeLevel(level) {
    this.upgradeLevel = level;
    this.stats = getEffectiveWeaponStats(this.weaponId, level);
    this.ammoInMag = Math.min(this.ammoInMag, this.stats.magSize);
  }

  update(dt) {
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.reloading = false;
        this.ammoInMag = this.stats.magSize;
      }
    } else if (this.ammoInMag <= 0) {
      this.startReload();
    }
  }

  startReload() {
    if (this.reloading) return;
    this.reloading = true;
    this.reloadTimer = this.stats.reloadSec;
  }

  // `fireHeld` / `firePressedEdge` let single-shot weapons require a fresh
  // press while automatic weapons keep firing on hold (spec section 10).
  canFireNow() {
    return !this.reloading && this.ammoInMag > 0 && this.cooldownTimer <= 0;
  }

  consumeShot() {
    this.ammoInMag -= 1;
    this.cooldownTimer = this.stats.fireCooldownSec;
    if (this.ammoInMag <= 0) this.startReload();
  }
}

// Decides, for one simulation step, whether a shot fires. `pressedEdge` must
// be true only on the frame FIRE transitions from released to held.
export function shouldFire(weaponRuntime, fireHeld, pressedEdge) {
  if (!weaponRuntime.canFireNow()) return false;
  if (weaponRuntime.stats.fireMode === 'auto') return fireHeld;
  return pressedEdge;
}
