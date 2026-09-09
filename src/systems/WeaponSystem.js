import { WEAPONS, UPGRADE_EFFECTS, defaultUpgradeLevels } from '../config/EconomyConfig.js';

// Applies the 3 independent upgrade categories on top of a base weapon
// definition. Each category's level value is the FINAL multiplier for that
// level (never stacked/compounded across levels — see EconomyConfig.js).
// Fire rate is a multiplier on the underlying RATE (shots/sec), so it
// divides the cooldown rather than multiplying it. Kept as a pure function
// so balance changes stay entirely data-driven in EconomyConfig.js.
export function getEffectiveWeaponStats(weaponId, upgradeLevels = defaultUpgradeLevels()) {
  const base = WEAPONS[weaponId];
  const damageMult = UPGRADE_EFFECTS.damage[upgradeLevels.damage] ?? 1;
  const fireRateMult = UPGRADE_EFFECTS.fireRate[upgradeLevels.fireRate] ?? 1;
  const magazineMult = UPGRADE_EFFECTS.magazine[upgradeLevels.magazine] ?? 1;
  return {
    ...base,
    damage: base.damage * damageMult,
    fireCooldownSec: base.fireCooldownSec / fireRateMult,
    magSize: Math.round(base.magSize * magazineMult),
  };
}

// Per-actor runtime state for one weapon. Enemies and the player share this
// so "reload matters" and "automatic reload" behave identically everywhere.
export class WeaponRuntime {
  constructor(weaponId, upgradeLevels = defaultUpgradeLevels()) {
    this.weaponId = weaponId;
    this.upgradeLevels = { ...upgradeLevels };
    this.stats = getEffectiveWeaponStats(weaponId, this.upgradeLevels);
    this.ammoInMag = this.stats.magSize;
    this.cooldownTimer = 0;
    this.reloadTimer = 0;
    this.reloading = false;
  }

  // `category` is one of 'damage' | 'fireRate' | 'magazine'.
  setUpgradeLevel(category, level) {
    this.upgradeLevels[category] = level;
    this.stats = getEffectiveWeaponStats(this.weaponId, this.upgradeLevels);
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
