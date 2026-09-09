import { WEAPONS, UPGRADE_CATEGORIES, MAX_UPGRADE_LEVEL, UPGRADE_EFFECTS } from '../config/EconomyConfig.js';
import { getEffectiveWeaponStats } from '../systems/WeaponSystem.js';

const CATEGORY_LABEL = { damage: 'DAMAGE', fireRate: 'FIRE RATE', magazine: 'MAGAZINE' };

function effectLabel(category, level) {
  if (!level) return 'None';
  const mult = UPGRADE_EFFECTS[category][level];
  return `+${Math.round((mult - 1) * 100)}%`;
}

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
    for (const id of Object.keys(WEAPONS)) this.weaponListEl.appendChild(this._buildWeaponCard(id));

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

  // One weapon card: name/price/owned/equipped/base+effective damage/
  // magazine/levels, BUY/EQUIP buttons, and (once owned) 3 upgrade rows
  // (economy spec sections 11/12).
  _buildWeaponCard(id) {
    const def = WEAPONS[id];
    const owned = !!this.save.data.ownedWeapons[id];
    const equipped = this.player.activeWeaponId === id;
    const coins = this.save.data.totalCoins;

    const card = document.createElement('div');
    card.className = 'weaponCard';

    const head = document.createElement('div');
    head.className = 'weaponHead';
    head.innerHTML = `<span>${def.name}</span><span>${owned ? (equipped ? 'EQUIPPED' : 'OWNED') : `$${def.price}`}</span>`;
    card.appendChild(head);

    const upgradeLevels = owned ? (this.save.data.weaponUpgradeLevels[id] || { damage: 0, fireRate: 0, magazine: 0 }) : { damage: 0, fireRate: 0, magazine: 0 };
    const effective = getEffectiveWeaponStats(id, upgradeLevels);
    const stats = document.createElement('div');
    stats.className = 'weaponStats';
    stats.textContent = owned
      ? `Damage ${def.damage} -> ${Math.round(effective.damage)} | Magazine ${def.magSize} -> ${effective.magSize} | Lv ${upgradeLevels.damage}/${upgradeLevels.fireRate}/${upgradeLevels.magazine}`
      : `Base damage ${def.damage} | Magazine ${def.magSize}`;
    card.appendChild(stats);

    const btnRow = document.createElement('div');
    btnRow.className = 'weaponBtns';
    if (!owned) {
      const buy = document.createElement('button');
      const canAfford = this.inventory.canAffordWeapon(id);
      buy.textContent = canAfford ? `BUY $${def.price}` : `Need $${def.price}`;
      buy.disabled = !canAfford;
      buy.addEventListener('click', () => { this.inventory.purchaseWeapon(id); this.render(); });
      btnRow.appendChild(buy);
    } else {
      const equipBtn = document.createElement('button');
      equipBtn.textContent = equipped ? 'EQUIPPED' : 'EQUIP';
      if (equipped) equipBtn.classList.add('active');
      equipBtn.disabled = equipped;
      equipBtn.addEventListener('click', () => { this.inventory.switchWeapon(id); this.render(); });
      btnRow.appendChild(equipBtn);
    }
    card.appendChild(btnRow);

    if (owned) {
      for (const category of UPGRADE_CATEGORIES) card.appendChild(this._buildUpgradeRow(id, category, upgradeLevels, coins));
    }

    return card;
  }

  _buildUpgradeRow(id, category, upgradeLevels, coins) {
    const level = upgradeLevels[category] || 0;
    const nextPrice = this.inventory.weaponUpgradeNextPrice(id, category);
    const maxed = nextPrice === null;

    const row = document.createElement('div');
    row.className = 'invRow upgradeRow';
    const currentEffect = effectLabel(category, level);
    const nextEffect = maxed ? '-' : effectLabel(category, level + 1);
    row.innerHTML = `<span>${CATEGORY_LABEL[category]} Lv${level}/${MAX_UPGRADE_LEVEL} · Current: ${currentEffect} · Next: ${nextEffect}</span>`;

    const btn = document.createElement('button');
    if (maxed) {
      btn.textContent = 'MAX';
      btn.disabled = true;
    } else {
      const canAfford = coins >= nextPrice;
      btn.textContent = canAfford ? `UPGRADE $${nextPrice}` : `Need $${nextPrice}`;
      btn.disabled = !canAfford;
      btn.addEventListener('click', () => { this.inventory.purchaseWeaponUpgrade(id, category); this.render(); });
    }
    row.appendChild(btn);
    return row;
  }
}
