import { WEAPONS } from '../config/GameConfig.js';

// Renders the Inventory overlay (spec section 27). This overlay is shown
// while the simulation keeps running underneath — it never calls setPaused.
export class InventoryUI {
  constructor(inventory, save, player) {
    this.inventory = inventory;
    this.save = save;
    this.player = player;
    this.overlay = document.getElementById('inventoryOverlay');
    this.coinsEl = document.getElementById('inventoryCoins');
    this.characterRowEl = document.getElementById('characterRow');
    this.weaponListEl = document.getElementById('weaponList');
    this.shieldRowEl = document.getElementById('shieldRow');
    this.healRowEl = document.getElementById('healRow');

    document.getElementById('closeInventoryBtn').addEventListener('click', () => this.hide());
  }

  show() {
    this.overlay.hidden = false;
    this.render();
  }

  hide() {
    this.overlay.hidden = true;
  }

  get isOpen() {
    return !this.overlay.hidden;
  }

  render() {
    this.coinsEl.textContent = `Coins: ${this.save.data.totalCoins}`;

    this.characterRowEl.innerHTML = '';
    const charRow = document.createElement('div');
    charRow.className = 'invRow';
    charRow.innerHTML = '<span>Character</span>';
    for (const gender of ['male', 'female']) {
      const btn = document.createElement('button');
      btn.textContent = gender === 'male' ? 'Male' : 'Female';
      if (this.player.gender === gender) btn.classList.add('active');
      btn.addEventListener('click', () => {
        this.save.setCharacterGender(gender);
        this.player.gender = gender;
        this.render();
      });
      charRow.appendChild(btn);
    }
    this.characterRowEl.appendChild(charRow);

    this.weaponListEl.innerHTML = '';

    for (const id of Object.keys(WEAPONS)) {
      const def = WEAPONS[id];
      const owned = this.save.data.ownedWeapons[id];
      const row = document.createElement('div');
      row.className = 'invRow';

      if (!owned) {
        row.innerHTML = `<span>${def.name} (locked)</span>`;
        const buy = document.createElement('button');
        buy.textContent = `Buy $${def.price}`;
        buy.disabled = !this.inventory.canAffordWeapon(id);
        buy.addEventListener('click', () => { this.inventory.purchaseWeapon(id); this.render(); });
        row.appendChild(buy);
      } else {
        const level = this.save.data.weaponUpgradeLevels[id] || 0;
        row.innerHTML = `<span>${def.name} Lv.${level}</span>`;
        const equipBtn = document.createElement('button');
        equipBtn.textContent = this.player.activeWeaponId === id ? 'Equipped' : 'Equip';
        if (this.player.activeWeaponId === id) equipBtn.classList.add('active');
        equipBtn.addEventListener('click', () => { this.inventory.switchWeapon(id); this.render(); });
        row.appendChild(equipBtn);

        const price = this.inventory.weaponUpgradePrice(id);
        const upgradeBtn = document.createElement('button');
        upgradeBtn.textContent = price === null ? 'MAX' : `Upgrade $${price}`;
        upgradeBtn.disabled = price === null || this.save.data.totalCoins < price;
        upgradeBtn.addEventListener('click', () => { this.inventory.purchaseWeaponUpgrade(id); this.render(); });
        row.appendChild(upgradeBtn);
      }
      this.weaponListEl.appendChild(row);
    }

    this.shieldRowEl.innerHTML = '';
    const shieldPrice = this.inventory.shieldUpgradePrice();
    const shieldRow = document.createElement('div');
    shieldRow.className = 'invRow';
    shieldRow.innerHTML = `<span>Shield Lv.${this.save.data.shieldUpgradeLevel || 0}</span>`;
    const shieldBtn = document.createElement('button');
    shieldBtn.textContent = shieldPrice === null ? 'MAX' : `Upgrade $${shieldPrice}`;
    shieldBtn.disabled = shieldPrice === null || this.save.data.totalCoins < shieldPrice;
    shieldBtn.addEventListener('click', () => { this.inventory.purchaseShieldUpgrade(); this.render(); });
    shieldRow.appendChild(shieldBtn);
    this.shieldRowEl.appendChild(shieldRow);

    this.healRowEl.innerHTML = '';
    const healRow = document.createElement('div');
    healRow.className = 'invRow';
    healRow.innerHTML = `<span>Heal ${Math.round(this.inventory.player.maxHealth * 0.35)} HP</span>`;
    const healBtn = document.createElement('button');
    const onCooldown = this.inventory.healCooldownRemaining > 0;
    healBtn.textContent = onCooldown ? `Wait ${Math.ceil(this.inventory.healCooldownRemaining)}s` : 'Buy Heal';
    healBtn.disabled = !this.inventory.canPurchaseHealing();
    healBtn.addEventListener('click', () => { this.inventory.purchaseHealing(); this.render(); });
    healRow.appendChild(healBtn);
    this.healRowEl.appendChild(healRow);
  }
}
