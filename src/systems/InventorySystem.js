import { WEAPONS, MAX_UPGRADE_LEVEL, upgradePrice, defaultUpgradeLevels } from '../config/EconomyConfig.js';
import { SHIELD_UPGRADES, HEALING } from '../config/GameConfig.js';

// "Inventory" per spec section 27 — deliberately not named Shop anywhere.
// It never pauses the simulation; it only mutates save data and the live
// Player instance while everything else keeps ticking around it.
//
// Every purchase/upgrade here follows the same transaction shape (economy
// spec section 16): verify eligibility -> deduct coins exactly once (via
// SaveSystem.spendCoins, which itself re-checks balance and refuses to go
// negative) -> unlock/apply -> persist. Because these are plain synchronous
// calls, a double-tap can never double-charge: each call fully completes
// (including bumping the stored level) before the next click's handler can
// run, so a second call always sees the already-updated state.
export class InventorySystem {
  constructor(save, player) {
    this.save = save;
    this.player = player;
    this.healCooldownRemaining = 0;
  }

  update(dt) {
    if (this.healCooldownRemaining > 0) this.healCooldownRemaining -= dt;
  }

  ownedWeaponIds() {
    return Object.keys(this.save.data.ownedWeapons).filter((id) => this.save.data.ownedWeapons[id]);
  }

  canAffordWeapon(id) {
    return !this.save.data.ownedWeapons[id] && this.save.data.totalCoins >= WEAPONS[id].price;
  }

  purchaseWeapon(id) {
    if (this.save.data.ownedWeapons[id]) return false; // never charge for an already-owned weapon
    if (!this.save.spendCoins(WEAPONS[id].price)) return false; // insufficient balance -> no-op
    this.save.buyWeapon(id);
    this.player.ownWeapon(id, defaultUpgradeLevels());
    return true;
  }

  // `category` is one of 'damage' | 'fireRate' | 'magazine'.
  weaponUpgradeLevel(id, category) {
    return this.save.data.weaponUpgradeLevels[id]?.[category] || 0;
  }

  // Level N+1 requires level N already purchased in the SAME category —
  // upgrades cannot skip levels (spec section 3/16).
  weaponUpgradeNextPrice(id, category) {
    const level = this.weaponUpgradeLevel(id, category);
    if (level >= MAX_UPGRADE_LEVEL) return null; // MAX
    return upgradePrice(id, category, level + 1);
  }

  canPurchaseWeaponUpgrade(id, category) {
    if (!this.save.data.ownedWeapons[id]) return false;
    const price = this.weaponUpgradeNextPrice(id, category);
    return price !== null && this.save.data.totalCoins >= price;
  }

  purchaseWeaponUpgrade(id, category) {
    if (!this.save.data.ownedWeapons[id]) return false;
    const level = this.weaponUpgradeLevel(id, category);
    if (level >= MAX_UPGRADE_LEVEL) return false;
    const price = upgradePrice(id, category, level + 1);
    if (!this.save.spendCoins(price)) return false;
    const newLevel = level + 1;
    this.save.setWeaponUpgradeLevel(id, category, newLevel);
    this.player.weapons[id]?.setUpgradeLevel(category, newLevel);
    return true;
  }

  switchWeapon(id) {
    if (!this.save.data.ownedWeapons[id]) return false;
    this.player.activeWeaponId = id;
    this.save.setActiveWeapon(id);
    return true;
  }

  shieldUpgradePrice() {
    const level = this.save.data.shieldUpgradeLevel || 0;
    if (level >= SHIELD_UPGRADES.maxLevel) return null;
    return SHIELD_UPGRADES.priceForLevel(level + 1);
  }

  purchaseShieldUpgrade() {
    const price = this.shieldUpgradePrice();
    if (price === null || !this.save.spendCoins(price)) return false;
    const newLevel = (this.save.data.shieldUpgradeLevel || 0) + 1;
    this.save.setShieldUpgradeLevel(newLevel);
    this.player.setShieldCapacity(newLevel * SHIELD_UPGRADES.capacityPerLevel);
    return true;
  }

  canPurchaseHealing() {
    return this.healCooldownRemaining <= 0 && this.save.data.totalCoins >= HEALING.price && this.player.health < this.player.maxHealth;
  }

  purchaseHealing() {
    if (!this.canPurchaseHealing()) return false;
    if (!this.save.spendCoins(HEALING.price)) return false;
    this.player.heal(HEALING.restorePercent);
    this.healCooldownRemaining = HEALING.cooldownSec;
    return true;
  }

  applySavedShieldCapacity() {
    this.player.setShieldCapacity((this.save.data.shieldUpgradeLevel || 0) * SHIELD_UPGRADES.capacityPerLevel);
    this.player.shield = this.player.maxShield;
  }
}
