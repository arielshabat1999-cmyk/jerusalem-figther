import { ENEMY_TIER_ORDER } from '../config/EconomyConfig.js';
import { elevationY, ELEVATION_GROUND, ELEVATION_FLOOR2, ELEVATION_ROOF } from '../systems/ChunkLibrary.js';
import * as GB from './GameBalance.js';

const TABS = ['Player', 'Game Feel', 'Enemies', 'Spawns', 'Economy', 'Weapons', 'Upgrades', 'Stage', 'Debug'];
const ENEMY_SIZE = { ranged: { w: 30, h: 60 }, melee: { w: 30, h: 58 } };
const TIER_LABEL = { enemy1: 'Enemy 1', enemy2: 'Enemy 2', enemy3: 'Enemy 3', heavy: 'Heavy', elite: 'Elite' };

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Builds/mounts the DEV dashboard DOM and wires every field to GameBalance
// (the SAME live config objects the real game reads) plus a handful of
// direct actions (spawn/kill/restart/teleport) against the real running
// instances passed in — never a second, parallel enemy/stage system.
export class DevPanel {
  constructor(bridge) {
    this.bridge = bridge; // { stage, player, world, save, coinSystem, projectileSystem, loop, camera, inventory, restartStage, advanceStage, respawnPlayerAt }
    this.overlay = document.getElementById('devOverlay');
    this.tabsEl = document.getElementById('devTabs');
    this.contentEl = document.getElementById('devTabContent');
    this.activeTab = 'Player';
    document.getElementById('closeDevBtn').addEventListener('click', () => this.hide());

    this.tabsEl.innerHTML = '';
    for (const tab of TABS) {
      const btn = el('button', null, tab);
      btn.addEventListener('click', () => { this.activeTab = tab; this.render(); });
      this.tabsEl.appendChild(btn);
    }
  }

  toggle() {
    if (this.overlay.hidden) this.show(); else this.hide();
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
    for (const btn of this.tabsEl.children) btn.classList.toggle('active', btn.textContent === this.activeTab);
    this.contentEl.innerHTML = '';
    const renderers = {
      Player: () => this._renderPlayer(),
      'Game Feel': () => this._renderGameFeel(),
      Enemies: () => this._renderEnemies(),
      Spawns: () => this._renderSpawns(),
      Economy: () => this._renderEconomy(),
      Weapons: () => this._renderWeapons(),
      Upgrades: () => this._renderUpgrades(),
      Stage: () => this._renderStage(),
      Debug: () => this._renderDebug(),
    };
    (renderers[this.activeTab] || renderers.Player)();
  }

  // --- generic row builders -------------------------------------------------

  _section(title, onReset) {
    const s = el('div', 'devSection');
    const h = el('h2');
    h.appendChild(el('span', null, title));
    if (onReset) {
      const btn = el('button', null, 'Reset');
      btn.addEventListener('click', () => { onReset(); this.render(); });
      h.appendChild(btn);
    }
    s.appendChild(h);
    this.contentEl.appendChild(s);
    return s;
  }

  _numRow(parent, label, value, onSet, { step = 1, decimals = 0, dirty = false } = {}) {
    const row = el('div', `devRow${dirty ? ' dirty' : ''}`);
    const lab = el('div', 'devLabel');
    if (dirty) lab.appendChild(el('span', 'dot'));
    lab.appendChild(document.createTextNode(label));
    row.appendChild(lab);

    const field = el('div', 'devNumField');
    const minus = el('button', null, '-');
    const input = el('input');
    input.type = 'number';
    input.step = step;
    input.value = decimals ? Number(value).toFixed(decimals) : value;
    const plus = el('button', null, '+');

    const commit = (v) => { onSet(v); this.render(); };
    minus.addEventListener('click', () => commit(Number((Number(input.value) - step).toFixed(6))));
    plus.addEventListener('click', () => commit(Number((Number(input.value) + step).toFixed(6))));
    input.addEventListener('change', () => commit(Number(input.value)));

    field.appendChild(minus);
    field.appendChild(input);
    field.appendChild(plus);
    row.appendChild(field);
    parent.appendChild(row);
  }

  _toggleRow(parent, label, value, onSet) {
    const row = el('div', 'devRow devToggleRow');
    row.appendChild(el('div', 'devLabel', label));
    const btn = el('button', value ? 'on' : '', value ? 'ON' : 'OFF');
    btn.addEventListener('click', () => { onSet(!value); this.render(); });
    row.appendChild(btn);
    parent.appendChild(row);
  }

  _actions(labels) {
    const grid = el('div', 'devActionGrid');
    for (const [label, onClick, cls] of labels) {
      const btn = el('button', cls || null, label);
      btn.addEventListener('click', () => { onClick(); this.render(); });
      grid.appendChild(btn);
    }
    this.contentEl.appendChild(grid);
  }

  // --- tabs ------------------------------------------------------------------

  _renderPlayer() {
    const { player } = this.bridge;
    const b = GB.getBalanceSnapshot();
    const s = this._section('Player', () => GB.resetSection('player'));
    this._numRow(s, 'Max HP', b.player.maxHealth, (v) => GB.setPlayerField('maxHealth', v), { dirty: GB.isDirty('player', 'maxHealth') });
    this._numRow(s, 'Current HP', Math.round(player.health), (v) => { player.health = Math.max(0, Math.min(player.maxHealth, v)); });
    this._numRow(s, 'Damage Taken Mult', b.player.damageTakenMult, (v) => GB.setPlayerField('damageTakenMult', v), { step: 0.1, decimals: 2, dirty: GB.isDirty('player', 'damageTakenMult') });
    this._numRow(s, 'Move Speed', b.player.moveSpeed, (v) => GB.setPlayerField('moveSpeed', v), { dirty: GB.isDirty('player', 'moveSpeed') });
    this._numRow(s, 'Crouch Move Speed', b.player.crouchMoveSpeed, (v) => GB.setPlayerField('crouchMoveSpeed', v), { dirty: GB.isDirty('player', 'crouchMoveSpeed') });
    this._numRow(s, 'Jump Velocity', b.player.jumpVelocity, (v) => GB.setPlayerField('jumpVelocity', v), { dirty: GB.isDirty('player', 'jumpVelocity') });
    this._numRow(s, 'Gravity', b.player.gravity, (v) => GB.setPlayerField('gravity', v), { dirty: GB.isDirty('player', 'gravity') });
    this._numRow(s, 'Hit-Stun (s)', b.player.hitStunSec, (v) => GB.setPlayerField('hitStunSec', v), { step: 0.05, decimals: 2, dirty: GB.isDirty('player', 'hitStunSec') });
    this._numRow(s, 'Invulnerability (s)', b.player.invulnSec, (v) => GB.setPlayerField('invulnSec', v), { step: 0.05, decimals: 2, dirty: GB.isDirty('player', 'invulnSec') });
    this._numRow(s, 'Regen Delay (s)', b.player.regenDelaySec, (v) => GB.setPlayerField('regenDelaySec', v), { step: 0.5, decimals: 1, dirty: GB.isDirty('player', 'regenDelaySec') });
    this._numRow(s, 'Regen Rate /s', b.player.regenRatePerSec, (v) => GB.setPlayerField('regenRatePerSec', v), { dirty: GB.isDirty('player', 'regenRatePerSec') });
    this._numRow(s, 'Max Regen %', Math.round(b.player.regenCapPercent * 100), (v) => GB.setPlayerField('regenCapPercent', v / 100), { dirty: GB.isDirty('player', 'regenCapPercent') });

    this._actions([
      ['HEAL FULL', () => { player.health = player.maxHealth; }],
      ['DAMAGE PLAYER', () => player.applyDamage(10), 'warn'],
      ['KILL PLAYER', () => { player.health = 0; player.alive = false; }, 'danger'],
    ]);

    const t = this._section('Toggles');
    this._toggleRow(t, 'GOD MODE', b.player.godMode, (v) => GB.setPlayerField('godMode', v));
    this._toggleRow(t, 'INFINITE AMMO', b.player.infiniteAmmo, (v) => GB.setPlayerField('infiniteAmmo', v));
    this._toggleRow(t, 'NO RELOAD', b.player.noReload, (v) => GB.setPlayerField('noReload', v));
  }

  _renderGameFeel() {
    const b = GB.getBalanceSnapshot();
    const s = this._section('Game Feel', () => GB.resetSection('gameFeel'));
    this._numRow(s, 'Global Game Speed', b.gameFeel.timeScale, (v) => GB.setGameFeelField('timeScale', v), { step: 0.05, decimals: 2, dirty: GB.isDirty('gameFeel', 'timeScale') });
    this._numRow(s, 'Enemy Speed Mult', b.gameFeel.enemySpeedMult, (v) => GB.setGameFeelField('enemySpeedMult', v), { step: 0.05, decimals: 2, dirty: GB.isDirty('gameFeel', 'enemySpeedMult') });
    this._numRow(s, 'Projectile Speed Mult', b.gameFeel.projectileSpeedMult, (v) => GB.setGameFeelField('projectileSpeedMult', v), { step: 0.05, decimals: 2, dirty: GB.isDirty('gameFeel', 'projectileSpeedMult') });
    this._numRow(s, 'Camera Follow Smoothing', b.gameFeel.cameraFollowLerp, (v) => GB.setGameFeelField('cameraFollowLerp', v), { step: 0.5, decimals: 1, dirty: GB.isDirty('gameFeel', 'cameraFollowLerp') });
    this._numRow(s, 'Camera Vertical Smoothing', b.gameFeel.cameraVerticalLerp, (v) => GB.setGameFeelField('cameraVerticalLerp', v), { step: 0.5, decimals: 1, dirty: GB.isDirty('gameFeel', 'cameraVerticalLerp') });

    const q = el('div', 'devActionGrid');
    for (const speed of [0.5, 0.75, 1.0, 1.25, 1.5]) {
      const btn = el('button', speed === b.gameFeel.timeScale ? 'on' : null, `${speed}x`);
      btn.addEventListener('click', () => { GB.setGameFeelField('timeScale', speed); this.render(); });
      q.appendChild(btn);
    }
    this.contentEl.appendChild(q);

    const note = el('div', 'devLiveStats');
    note.textContent = 'Note: Animation Speed / Screen Shake / Hit Stop from the reference mockup have no real system in this build yet (no screen-shake or hit-stop effect exists) — omitted rather than faked. See final report.';
    this.contentEl.appendChild(note);
  }

  _renderEnemies() {
    const b = GB.getBalanceSnapshot();
    const s = this._section('Enemies', () => GB.resetSection('enemies'));
    for (const tier of ENEMY_TIER_ORDER) {
      const sub = el('div', 'devRow');
      sub.style.display = 'block';
      sub.appendChild(el('div', 'devLabel', TIER_LABEL[tier]));
      s.appendChild(sub);
      this._numRow(s, '  HP', b.enemies[tier].hp, (v) => GB.setEnemyTierField(tier, 'hp', v), { dirty: GB.isDirty('enemies', tier) });
      this._numRow(s, '  Damage Mult', b.enemies[tier].damageMult, (v) => GB.setEnemyTierField(tier, 'damageMult', v), { step: 0.1, decimals: 2 });
      this._numRow(s, '  Speed Mult', b.enemies[tier].speedMult, (v) => GB.setEnemyTierField(tier, 'speedMult', v), { step: 0.05, decimals: 2 });
    }
    this._numRow(s, 'Ranged Fire Cooldown (s, shared)', b.enemies._rangedFireCooldownSec, (v) => GB.setEnemyBehaviorField('_rangedFireCooldownSec', v), { step: 0.05, decimals: 2 });
    this._numRow(s, 'Melee Cooldown (s, shared)', b.enemies._meleeCooldownSec, (v) => GB.setEnemyBehaviorField('_meleeCooldownSec', v), { step: 0.05, decimals: 2 });

    this._actions([
      ['SPAWN ENEMY 1', () => this._spawnTier('enemy1')],
      ['SPAWN ENEMY 2', () => this._spawnTier('enemy2')],
      ['SPAWN ENEMY 3', () => this._spawnTier('enemy3')],
      ['SPAWN HEAVY', () => this._spawnTier('heavy')],
      ['SPAWN ELITE', () => this._spawnTier('elite')],
    ]);
    this._actions([
      ['KILL ALL ENEMIES', () => this._killAll(), 'danger'],
      [this._isFrozen() ? 'RESUME ENEMIES' : 'FREEZE ENEMIES', () => GB.setDebugFlag('frozen', !this._isFrozen())],
    ]);
  }

  _isFrozen() {
    return GB.getBalanceSnapshot().debug.frozen;
  }

  _spawnTier(tier) {
    const { stage, player } = this.bridge;
    const kind = Math.random() < 0.55 ? 'ranged' : 'melee';
    const size = ENEMY_SIZE[kind];
    const x = player.x + (player.facingDir >= 0 ? 260 : -260);
    const floorY = player.y + player.h; // spawn on the player's current floor/Y
    stage.spawnEnemy(kind, tier, x, floorY);
  }

  _killAll() {
    for (const e of this.bridge.stage.enemies) {
      if (!e.dead) { e.hp = 0; e.dead = true; e.deathTimer = 0.01; }
    }
  }

  _renderSpawns() {
    const { stage } = this.bridge;
    const b = GB.getBalanceSnapshot();
    const director = stage.spawnDirector;

    const stats = el('div', 'devLiveStats');
    stats.innerHTML = `Current Stage: ${stage.stageNumber}<br>Current Floor: ${stage.currentFloor}<br>Alive Enemies: ${stage.getActiveEnemyCount()}<br>` +
      `Active Spawn Doors: ${director.activeDoors.length} / ${stage.doors.length} total<br>` +
      `Max Alive (this stage): ${director.effectiveMaxAlive}<br>` +
      `Encounter Zone: ${director.zones[director._zoneCursor]?.id ?? 'none remaining'}`;
    this.contentEl.appendChild(stats);

    const s = this._section('Spawn Pacing', () => GB.resetSection('spawns'));
    this._numRow(s, 'Max Enemies Alive (override, 0=stage default)', b.spawns.maxAliveOverride ?? 0, (v) => GB.setSpawnField('maxAliveOverride', v > 0 ? v : null));
    this._numRow(s, 'Door Safe Distance (px from player)', b.spawns.doorSafeDistance, (v) => GB.setSpawnField('doorSafeDistance', v), { step: 10, dirty: GB.isDirty('spawns', 'doorSafeDistance') });
    this._numRow(s, 'Enemy Exit Delay (s)', b.spawns.enemyExitDelaySec, (v) => GB.setSpawnField('enemyExitDelaySec', v), { step: 0.05, decimals: 2, dirty: GB.isDirty('spawns', 'enemyExitDelaySec') });
    this._numRow(s, 'Door Open/Close (s)', b.spawns.doorOpenCloseSec, (v) => GB.setSpawnField('doorOpenCloseSec', v), { step: 0.05, decimals: 2, dirty: GB.isDirty('spawns', 'doorOpenCloseSec') });
    this._numRow(s, 'Empty Door Chance', b.spawns.emptyDoorChance, (v) => GB.setSpawnField('emptyDoorChance', v), { step: 0.02, decimals: 2, dirty: GB.isDirty('spawns', 'emptyDoorChance') });
    this._numRow(s, 'Max Concurrent Open Doors', b.spawns.maxConcurrentOpenDoors, (v) => GB.setSpawnField('maxConcurrentOpenDoors', v), { dirty: GB.isDirty('spawns', 'maxConcurrentOpenDoors') });
    this._numRow(s, 'Peak Max Concurrent Open Doors', b.spawns.peakMaxConcurrentOpenDoors, (v) => GB.setSpawnField('peakMaxConcurrentOpenDoors', v), { dirty: GB.isDirty('spawns', 'peakMaxConcurrentOpenDoors') });

    this._actions([
      [b.spawns.paused ? 'RESUME SPAWNS' : 'PAUSE SPAWNS', () => GB.setSpawnField('paused', !b.spawns.paused)],
      ['KILL ALL ENEMIES', () => this._killAll(), 'danger'],
    ]);

    const note = el('div', 'devLiveStats');
    note.textContent = "The Spawn Director decides WHAT/WHERE/WHEN live each tick (this tab's pacing knobs above apply immediately). 'Enemies per encounter' / per-tier weights are decided once when a stage is generated (StageBuilder) — edit them in the Stage tab's composition table, then use RESTART STAGE to regenerate with the new values.";
    this.contentEl.appendChild(note);
  }

  _renderEconomy() {
    const { save } = this.bridge;
    const b = GB.getBalanceSnapshot();
    const s = this._section('Economy', () => GB.resetSection('economy'));
    this._numRow(s, 'Player Coins', save.data.totalCoins, (v) => { save.data.totalCoins = Math.max(0, Math.round(v)); save.persist(); });
    this._numRow(s, 'Player Score', save.data.score, (v) => { save.data.score = Math.max(0, Math.round(v)); save.persist(); });
    this._numRow(s, 'Coin Multiplier', b.economy.coinMultiplier, (v) => GB.setEconomyField('coinMultiplier', v), { step: 0.1, decimals: 2, dirty: GB.isDirty('economy', 'coinMultiplier') });
    this._numRow(s, 'Score Multiplier', b.economy.scoreMultiplier, (v) => GB.setEconomyField('scoreMultiplier', v), { step: 0.1, decimals: 2, dirty: GB.isDirty('economy', 'scoreMultiplier') });
    this._numRow(s, 'Stage Bonus (coins on clear)', b.economy.stageBonus, (v) => GB.setEconomyField('stageBonus', v), { step: 50, dirty: GB.isDirty('economy', 'stageBonus') });

    this._actions([
      ['+100 Coins', () => { save.addCoins(100); }],
      ['+1000 Coins', () => { save.addCoins(1000); }],
      ['+10000 Coins', () => { save.addCoins(10000); }],
      ['RESET COINS', () => { save.data.totalCoins = 0; save.persist(); }, 'danger'],
      ['RESET SCORE', () => { save.data.score = 0; save.persist(); }, 'danger'],
    ]);

    const r = this._section('Enemy Reward Ranges');
    for (const tier of ENEMY_TIER_ORDER) {
      this._numRow(r, `${TIER_LABEL[tier]} Min`, b.enemies[tier].coinMin, (v) => GB.setEnemyTierField(tier, 'coinMin', v));
      this._numRow(r, `${TIER_LABEL[tier]} Max`, b.enemies[tier].coinMax, (v) => GB.setEnemyTierField(tier, 'coinMax', v));
    }
  }

  _renderWeapons() {
    const { player, save, inventory } = this.bridge;
    const b = GB.getBalanceSnapshot();
    const s = this._section('Weapons', () => GB.resetSection('weapons'));
    for (const id of Object.keys(b.weapons)) {
      const w = b.weapons[id];
      const head = el('div', 'devRow');
      head.style.display = 'block';
      const owned = !!save.data.ownedWeapons[id];
      const equipped = player.activeWeaponId === id;
      head.appendChild(el('div', 'devLabel', `${w.name} ${owned ? (equipped ? '(EQUIPPED)' : '(OWNED)') : '(LOCKED)'}`));
      s.appendChild(head);
      this._numRow(s, '  Price', w.price, (v) => GB.setWeaponField(id, 'price', v));
      this._numRow(s, '  Damage', w.damage, (v) => GB.setWeaponField(id, 'damage', v));
      this._numRow(s, '  Fire Cooldown (s)', w.fireCooldownSec, (v) => GB.setWeaponField(id, 'fireCooldownSec', v), { step: 0.01, decimals: 2 });
      this._numRow(s, '  Magazine', w.magSize, (v) => GB.setWeaponField(id, 'magSize', v));
      this._numRow(s, '  Reload (s)', w.reloadSec, (v) => GB.setWeaponField(id, 'reloadSec', v), { step: 0.1, decimals: 1 });
      this._numRow(s, '  Projectile Speed', w.projectileSpeed, (v) => GB.setWeaponField(id, 'projectileSpeed', v), { step: 10 });

      const row = el('div', 'devActionGrid');
      const unlockBtn = el('button', null, owned ? 'OWNED' : 'UNLOCK');
      unlockBtn.disabled = owned;
      unlockBtn.addEventListener('click', () => { save.buyWeapon(id); player.ownWeapon(id, save.data.weaponUpgradeLevels[id]); this.render(); });
      const equipBtn = el('button', equipped ? 'on' : null, equipped ? 'EQUIPPED' : 'EQUIP');
      equipBtn.disabled = !owned || equipped;
      equipBtn.addEventListener('click', () => { inventory.switchWeapon(id); this.render(); });
      row.appendChild(unlockBtn);
      row.appendChild(equipBtn);
      s.appendChild(row);
    }

    this._actions([
      ['UNLOCK ALL', () => {
        for (const id of Object.keys(b.weapons)) {
          if (!save.data.ownedWeapons[id]) { save.buyWeapon(id); player.ownWeapon(id, save.data.weaponUpgradeLevels[id]); }
        }
      }],
    ]);
  }

  _renderUpgrades() {
    const { save } = this.bridge;
    const b = GB.getBalanceSnapshot();
    const s = this._section('Upgrade Effects (% for level 1/2/3)', () => GB.resetSection('upgrades'));
    for (const category of ['damage', 'fireRate', 'magazine']) {
      const sub = el('div', 'devRow');
      sub.style.display = 'block';
      sub.appendChild(el('div', 'devLabel', category.toUpperCase()));
      s.appendChild(sub);
      for (const level of [1, 2, 3]) {
        const pct = Math.round((b.upgrades.effects[category][level] - 1) * 100);
        this._numRow(s, `  Lv${level} effect %`, pct, (v) => GB.setUpgradeEffect(category, level, 1 + v / 100));
      }
    }

    const p = this._section('Upgrade Prices');
    for (const id of Object.keys(b.weapons)) {
      const sub = el('div', 'devRow');
      sub.style.display = 'block';
      sub.appendChild(el('div', 'devLabel', b.weapons[id].name));
      p.appendChild(sub);
      for (const level of [1, 2, 3]) {
        this._numRow(p, `  Lv${level} price (all 3 categories)`, b.upgrades.prices[id][level], (v) => GB.setUpgradePrice(id, level, v), { step: 50 });
      }
    }

    const c = this._section('Current Levels (dev-set, bypasses purchase)');
    for (const id of Object.keys(b.weapons)) {
      const levels = save.data.weaponUpgradeLevels[id] || { damage: 0, fireRate: 0, magazine: 0 };
      const sub = el('div', 'devRow');
      sub.style.display = 'block';
      sub.appendChild(el('div', 'devLabel', b.weapons[id].name));
      c.appendChild(sub);
      for (const category of ['damage', 'fireRate', 'magazine']) {
        this._numRow(c, `  ${category} Lv (0-3)`, levels[category] || 0, (v) => {
          const clamped = Math.max(0, Math.min(3, Math.round(v)));
          save.setWeaponUpgradeLevel(id, category, clamped);
          this.bridge.player.weapons[id]?.setUpgradeLevel(category, clamped);
        });
      }
    }
    const note = el('div', 'devLiveStats');
    note.textContent = 'Normal purchase flow (Inventory) still enforces Lv2-needs-Lv1/Lv3-needs-Lv2 — this dev-only "current level" control intentionally bypasses that so you can jump straight to any level for testing.';
    this.contentEl.appendChild(note);
  }

  _renderStage() {
    const { stage, player } = this.bridge;
    const b = GB.getBalanceSnapshot();

    const stats = el('div', 'devLiveStats');
    stats.innerHTML = `Current Stage: ${stage.stageNumber}<br>Current Floor: ${stage.currentFloor} of 2 (0=ground, 1=floor2, 2=roof)<br>` +
      `Stage Length: ${Math.round(stage.layout.length)}px<br>Blocks: ${stage.layout.blocks.map((m) => m.type).join(' -> ')}`;
    this.contentEl.appendChild(stats);

    const s = this._section('Stage Generation', () => GB.resetSection('stages'));
    this._numRow(s, 'Middle Blocks Base', b.stages.unitCountBase, (v) => GB.setStageGenField('unitCountBase', v));
    this._numRow(s, 'Middle Blocks Per Stage', b.stages.unitCountPerStage, (v) => GB.setStageGenField('unitCountPerStage', v), { step: 0.1, decimals: 1 });
    this._numRow(s, 'Middle Blocks Cap', b.stages.unitCountCap, (v) => GB.setStageGenField('unitCountCap', v));
    this._numRow(s, 'Stair Chance Base', b.stages.stairChanceBase, (v) => GB.setStageGenField('stairChanceBase', v), { step: 0.02, decimals: 2 });
    this._numRow(s, 'Stair Chance / Stage', b.stages.stairChancePerStage, (v) => GB.setStageGenField('stairChancePerStage', v), { step: 0.01, decimals: 2 });
    this._numRow(s, 'Stair Chance Cap', b.stages.stairChanceCap, (v) => GB.setStageGenField('stairChanceCap', v), { step: 0.02, decimals: 2 });
    this._numRow(s, 'Obstacle Chance', b.stages.obstacleChance, (v) => GB.setStageGenField('obstacleChance', v), { step: 0.02, decimals: 2 });
    this._numRow(s, 'Entrance Width Min', b.stages.entranceWidthMin, (v) => GB.setStageGenField('entranceWidthMin', v), { step: 10 });
    this._numRow(s, 'Entrance Width Max', b.stages.entranceWidthMax, (v) => GB.setStageGenField('entranceWidthMax', v), { step: 10 });
    this._numRow(s, 'Exit Width Min', b.stages.exitWidthMin, (v) => GB.setStageGenField('exitWidthMin', v), { step: 10 });
    this._numRow(s, 'Exit Width Max', b.stages.exitWidthMax, (v) => GB.setStageGenField('exitWidthMax', v), { step: 10 });
    this._numRow(s, 'Stair Gap Min (px between stairs)', b.stages.stairGapMin, (v) => GB.setStageGenField('stairGapMin', v), { step: 10 });
    this._numRow(s, 'Stair Gap Max', b.stages.stairGapMax, (v) => GB.setStageGenField('stairGapMax', v), { step: 10 });

    const comp = this._section(`Stage ${stage.stageNumber} Composition`);
    const compData = b.stages.composition[String(stage.stageNumber)] || b.stages.composition[stage.stageNumber];
    if (compData) {
      this._numRow(comp, 'Max Alive', compData.maxAlive, (v) => GB.setStageCompositionField(stage.stageNumber, 'maxAlive', v));
      for (const tier of ENEMY_TIER_ORDER) {
        if (compData.counts[tier] === undefined) continue;
        this._numRow(comp, `${TIER_LABEL[tier]} Count`, compData.counts[tier], (v) => GB.setStageCompositionCount(stage.stageNumber, tier, v));
      }
    }

    this._actions([
      ['PREVIOUS STAGE', () => this._goToStage(Math.max(1, stage.stageNumber - 1))],
      ['NEXT STAGE', () => this._goToStage(stage.stageNumber + 1)],
      ['RESTART STAGE', () => this.bridge.restartStage()],
      ['GO TO FLOOR 1', () => { player.y = elevationY(ELEVATION_GROUND) - player.h; player.vy = 0; }],
      ['GO TO FLOOR 2', () => { player.y = elevationY(ELEVATION_FLOOR2) - player.h; player.vy = 0; }],
      ['GO TO FLOOR 3', () => { player.y = elevationY(ELEVATION_ROOF) - player.h; player.vy = 0; }],
    ]);
    const note = el('div', 'devLiveStats');
    note.textContent = "Stage-generation knobs above apply on the NEXT stage load (RESTART STAGE or NEXT/PREVIOUS), matching how StageBuilder actually generates a stage. 'GO TO FLOOR' teleports the player directly — it does not spawn a stair block at that spot, so use it to preview a floor's art/combat rather than to test the stair transition itself.";
    this.contentEl.appendChild(note);
  }

  _goToStage(n) {
    const { stage, save, player, respawnPlayerAt } = this.bridge;
    stage.loadStage(n);
    save.setStage(n);
    const s = stage.playerSpawn();
    respawnPlayerAt(s.x, s.y);
  }

  _renderDebug() {
    const b = GB.getBalanceSnapshot();
    const { loop } = this.bridge;
    const s = this._section('Debug / Visual Toggles', () => GB.resetSection('debug'));
    this._toggleRow(s, 'SHOW COLLISION', b.debug.showCollision, (v) => GB.setDebugFlag('showCollision', v));
    this._toggleRow(s, 'SHOW SPAWN DOORS', b.debug.showSpawnDoors, (v) => GB.setDebugFlag('showSpawnDoors', v));
    this._toggleRow(s, 'SHOW ENEMY HP', b.debug.showEnemyHP, (v) => GB.setDebugFlag('showEnemyHP', v));
    this._toggleRow(s, 'SHOW HITBOXES', b.debug.showHitboxes, (v) => GB.setDebugFlag('showHitboxes', v));
    this._toggleRow(s, 'SHOW FPS', b.debug.showFPS, (v) => GB.setDebugFlag('showFPS', v));
    this._toggleRow(s, 'SHOW CAMERA COORDS', b.debug.showCameraCoords, (v) => GB.setDebugFlag('showCameraCoords', v));
    this._toggleRow(s, 'SHOW PROJECTILE HITBOXES', b.debug.showProjectileHitboxes, (v) => GB.setDebugFlag('showProjectileHitboxes', v));
    this._toggleRow(s, 'FREEZE GAME', loop.paused, (v) => loop.setPaused(v));
    this._toggleRow(s, 'ONE HIT KILL', b.debug.oneHitKill, (v) => GB.setDebugFlag('oneHitKill', v));
    this._toggleRow(s, 'SLOW MOTION (0.5x)', b.gameFeel.timeScale === 0.5, (v) => GB.setGameFeelField('timeScale', v ? 0.5 : 1));

    const preset = this._section('Presets & Export');
    const row = el('div', 'devPresetRow');
    const nameInput = el('input');
    nameInput.placeholder = 'preset name';
    nameInput.value = 'my-preset';
    const saveBtn = el('button', null, 'SAVE PRESET');
    saveBtn.addEventListener('click', () => { GB.savePreset(nameInput.value || 'preset'); this.render(); });
    row.appendChild(nameInput);
    row.appendChild(saveBtn);
    preset.appendChild(row);

    for (const name of GB.listPresets()) {
      const r = el('div', 'devRow');
      r.appendChild(el('div', 'devLabel', name));
      const loadBtn = el('button', null, 'LOAD');
      loadBtn.addEventListener('click', () => { GB.loadPreset(name); this.render(); });
      const delBtn = el('button', null, 'DELETE');
      delBtn.addEventListener('click', () => { GB.deletePreset(name); this.render(); });
      const grp = el('div', 'devActionGrid');
      grp.appendChild(loadBtn);
      grp.appendChild(delBtn);
      r.appendChild(grp);
      preset.appendChild(r);
    }

    this._actions([
      ['RESET TO PRODUCTION DEFAULTS', () => GB.resetToDefaults(), 'danger'],
    ]);

    const jsonSection = this._section('Export / Apply as Production Defaults');
    const jsonBox = el('textarea', 'devJsonBox');
    jsonBox.readOnly = true;
    jsonBox.value = GB.exportBalanceJSON();
    jsonSection.appendChild(jsonBox);
    const exportBtn = el('button', null, 'REFRESH EXPORT JSON');
    exportBtn.addEventListener('click', () => { jsonBox.value = GB.exportBalanceJSON(); });
    jsonSection.appendChild(exportBtn);
    const applyNote = el('div', 'devLiveStats');
    applyNote.textContent = 'The JSON above is labeled "PRODUCTION BALANCE CANDIDATE" — copy it and send it back for approval. This never rewrites source files from the browser; the actual EconomyConfig.js/GameConfig.js update happens deliberately, after review, using this JSON as the spec.';
    jsonSection.appendChild(applyNote);
  }
}
