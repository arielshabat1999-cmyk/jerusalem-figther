// Thin DOM binding — reads game state each frame and writes it into the
// existing markup in index.html. No gameplay decisions happen here.
export class HUD {
  constructor() {
    this.healthFill = document.getElementById('healthFill');
    this.shieldFill = document.getElementById('shieldFill');
    this.stageLabel = document.getElementById('stageLabel');
    this.scoreLabel = document.getElementById('scoreLabel');
    this.coinsLabel = document.getElementById('coinsLabel');
    this.weaponName = document.getElementById('weaponName');
    this.ammoCount = document.getElementById('ammoCount');
    this.reloadingLabel = document.getElementById('reloadingLabel');
    this.toast = document.getElementById('toast');
    this._toastTimer = null;
  }

  update({ player, save, stageNumber }) {
    this.healthFill.style.transform = `scaleX(${Math.max(0, player.health / player.maxHealth)})`;
    const shieldPct = player.maxShield > 0 ? player.shield / player.maxShield : 0;
    this.shieldFill.style.transform = `scaleX(${shieldPct})`;
    this.shieldFill.parentElement.style.display = player.maxShield > 0 ? 'block' : 'none';

    this.stageLabel.textContent = `STAGE ${stageNumber}`;
    this.scoreLabel.textContent = `SCORE ${save.data.score}`;
    this.coinsLabel.textContent = `COINS ${save.data.totalCoins}`;

    const weapon = player.activeWeapon;
    if (weapon) {
      this.weaponName.textContent = weapon.stats.name;
      this.ammoCount.textContent = `${weapon.ammoInMag}/${weapon.stats.magSize}`;
      this.reloadingLabel.hidden = !weapon.reloading;
    }
  }

  showToast(text, durationMs = 2200) {
    this.toast.textContent = text;
    this.toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toast.classList.remove('show'), durationMs);
  }
}
