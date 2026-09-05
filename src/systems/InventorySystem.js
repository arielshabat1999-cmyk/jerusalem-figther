import { WEAPONS, WEAPON_UPGRADES, SHIELD_UPGRADES, HEALING } from '../config/GameConfig.js';

// "Inventory" per spec section 27 — deliberately not named Shop anywhere.
// It never pauses the simulation; it only mutates save data and the live
// Player instance while everything else keeps ticking around it.
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
    return this.save.data.totalCoins >= WEAPONS[id].price && !this.save.data.ownedWeapons[id];
  }

  purchaseWeapon(id) {
    if (!this.canAffordWeapon(id)) return false;
    if (!this.save.spendCoins(WEAPONS[id].price)) return false;
    this.save.buyWeapon(id);
    this.player.ownWeapon(id, 0);
    return true;
  }

  weaponUpgradePrice(id) {
    const level = this.save.data.weaponUpgradeLevels[id] || 0;
    if (level >= WEAPON_UPGRADES.maxLevel) return null;
    return WEAPON_UPGRADES.priceForLevel(id, level + 1);
  }

  purchaseWeaponUpgrade(id) {
    if (!this.save.data.ownedWeapons[id]) return false;
    const price = this.weaponUpgradePrice(id);
    if (price === null || !this.save.spendCoins(price)) return false;
    const newLevel = (this.save.data.weaponUpgradeLevels[id] || 0) + 1;
    this.save.setWeaponUpgradeLevel(id, newLevel);
    this.player.weapons[id]?.setUpgradeLevel(newLevel);
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
