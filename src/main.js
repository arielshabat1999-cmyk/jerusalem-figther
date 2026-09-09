import { SaveSystem } from './core/SaveSystem.js';
import { GameLoop } from './core/GameLoop.js';
import { InputManager, attachTouchControls } from './core/InputManager.js';
import { World } from './physics/World.js';
import { Player } from './entities/Player.js';
import { StageSystem } from './systems/StageSystem.js';
import { SpawnDoorSystem } from './systems/SpawnDoorSystem.js';
import { ProjectileSystem } from './systems/ProjectileSystem.js';
import { CoinSystem } from './systems/CoinSystem.js';
import { CameraSystem } from './systems/CameraSystem.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { updateRangedAI, updateMeleeAI } from './systems/EnemyAI.js';
import { applyExplosion, applyMeleeHit } from './systems/DamageSystem.js';
import { Renderer } from './render/Renderer.js';
import { AssetRegistry } from './render/AssetRegistry.js';
import { createArtAdapter } from './render/ArtAdapter.js';
import { PlaceholderAdapter } from './render/PlaceholderAdapter.js';
import { HUD } from './ui/HUD.js';
import { InventoryUI } from './ui/InventoryUI.js';

const save = new SaveSystem();
const world = new World();
const stage = new StageSystem(world);
const spawnDoorSystem = new SpawnDoorSystem();
const projectileSystem = new ProjectileSystem(world);
const coinSystem = new CoinSystem();

stage.loadStage(save.data.currentStage);
const spawn = stage.playerSpawn();
const player = new Player(spawn.x, spawn.y, save);

const inventory = new InventorySystem(save, player);
inventory.applySavedShieldCapacity();

const canvas = document.getElementById('gameCanvas');
const assets = new AssetRegistry();
await assets.loadManifest('assets/art/manifest.json');
const renderer = new Renderer(canvas, createArtAdapter(assets, PlaceholderAdapter));
const camera = new CameraSystem(window.innerWidth, window.innerHeight);
const hud = new HUD();
const inventoryUI = new InventoryUI(inventory, save, player);

const input = new InputManager();
let explosions = [];

const appEl = document.getElementById('app');
let _lastResizeW = -1;
let _lastResizeH = -1;

// The actual gameplay resize - reads the #app container's own rendered
// box (not window.innerWidth/innerHeight directly) so JS sizing always
// matches whatever CSS actually settled on, and skips the whole
// renderer/camera recompute when the size hasn't materially changed (a
// sub-pixel/no-op resize should never re-trigger anything downstream).
function applyResize() {
  const rect = appEl.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w === _lastResizeW && h === _lastResizeH) return;
  _lastResizeW = w;
  _lastResizeH = h;
  renderer.resize(w, h);
  camera.resize(w, h);
}

// Mobile browser chrome (address bar, nav bar) hiding/showing fires a
// burst of `resize` events in quick succession while it animates, each
// carrying a transient in-between size - reacting to every one of them
// snapped the canvas/camera to a different visible world area on every
// frame of that animation, which read as the game suddenly "zooming".
// Debouncing collapses a burst into a single recompute using the final,
// settled size once things stop changing for a short quiet period; a
// genuine one-off resize/orientation change is unaffected since 250ms is
// imperceptible for that.
let _resizeDebounce = null;
function resize() {
  if (_resizeDebounce) clearTimeout(_resizeDebounce);
  _resizeDebounce = setTimeout(applyResize, 250);
}
window.addEventListener('resize', resize);
applyResize();

const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverStageEl = document.getElementById('gameOverStage');
const pauseOverlay = document.getElementById('pauseOverlay');

attachTouchControls(
  input,
  {
    joystickEl: document.getElementById('joystick'),
    knobEl: document.getElementById('joyKnob'),
    fireBtn: document.getElementById('fireBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    inventoryBtn: document.getElementById('inventoryBtn'),
  },
  {
    onPause: () => togglePause(),
    onInventory: () => toggleInventory(),
  }
);
document.getElementById('resumeBtn').addEventListener('click', () => togglePause(false));
document.getElementById('restartBtn').addEventListener('click', () => restartStage());

function togglePause(force) {
  if (inventoryUI.isOpen) return; // Inventory is a non-pausing overlay; Pause is separate.
  const next = typeof force === 'boolean' ? force : !loop.paused;
  loop.setPaused(next);
  pauseOverlay.hidden = !next;
}

function toggleInventory() {
  if (loop.paused) return; // Spec: Inventory never pauses; keep it out of Pause's frozen state.
  if (inventoryUI.isOpen) inventoryUI.hide();
  else inventoryUI.show();
}

function restartStage() {
  gameOverOverlay.hidden = true;
  loop.setPaused(false);
  stage.loadStage(stage.stageNumber);
  const s = stage.playerSpawn();
  player.respawnAt(s.x, s.y);
  explosions = [];
  projectileSystem.projectiles = [];
  coinSystem.coins = [];
}

function advanceStage() {
  const next = stage.stageNumber + 1;
  stage.loadStage(next);
  save.setStage(next);
  const s = stage.playerSpawn();
  player.respawnAt(s.x, s.y);
  explosions = [];
  projectileSystem.projectiles = [];
  coinSystem.coins = [];
  hud.showToast(`STAGE ${next}`);
}

function awardEnemyDeaths() {
  for (const e of stage.enemies) {
    if (e.dead && !e._awarded) {
      e._awarded = true;
      save.addScore(e.scoreValue);
      coinSystem.spawnFromRange(e.x + e.w / 2, e.y + e.h / 2, e.coinDrop);
    }
  }
}

function update(dt) {
  const wasCleared = stage.cleared;

  player.update(dt, input, world, {
    spawnProjectile: (spec) => {
      projectileSystem.spawn(spec);
      explosions.push({ x: spec.x, y: spec.y, radius: 10, t: 0, maxT: 0.08, kind: 'muzzle_flash' });
    },
  });

  for (const enemy of stage.enemies) {
    enemy.tickTimers(dt);
    if (enemy.dead) continue;
    if (enemy.kind === 'ranged') {
      updateRangedAI(enemy, dt, {
        player,
        world,
        spawnProjectile: (spec) => {
          projectileSystem.spawn(spec);
          enemy.lastFireTimer = 0.12;
          explosions.push({ x: spec.x, y: spec.y, radius: 10, t: 0, maxT: 0.08, kind: 'muzzle_flash' });
        },
      });
    } else {
      updateMeleeAI(enemy, dt, {
        player,
        world,
        onMeleeHit: (target, damage, fromX) => {
          applyMeleeHit(target, damage, fromX);
          explosions.push({ x: target.x + target.w / 2, y: target.y + target.h / 2, radius: 14, t: 0, maxT: 0.15, kind: 'hit_effect' });
        },
      });
    }
    world.step(enemy, dt, { crouchHeld: enemy.crouching });
  }

  projectileSystem.update(dt, {
    player,
    enemies: stage.enemies,
    crates: stage.crates,
    onExplosion: (x, y, radius, damage, faction) => {
      applyExplosion(x, y, radius, damage, faction, { player, enemies: stage.enemies, crates: stage.crates });
      explosions.push({ x, y, radius, t: 0, maxT: 0.3, kind: 'explosion' });
      awardEnemyDeaths();
    },
    onActorHit: (actor, damage, faction, dirSign) => {
      explosions.push({ x: actor.x + actor.w / 2, y: actor.y + actor.h / 2, radius: 14, t: 0, maxT: 0.15, kind: 'hit_effect' });
      if (actor === player) {
        player.applyDamage(damage);
        player.applyKnockback(dirSign > 0 ? player.x - 1 : player.x + 1);
      } else {
        actor.applyDamage(damage, dirSign);
        awardEnemyDeaths();
      }
    },
    onCrateHit: (crate, damage) => {
      const wasDestroyed = crate.destroyed;
      crate.applyDamage(damage);
      if (crate.destroyed && !wasDestroyed) {
        coinSystem.spawnFromRange(crate.x + crate.w / 2, crate.y, [1, 4]);
        explosions.push({ x: crate.x + crate.w / 2, y: crate.y + crate.h / 2, radius: 20, t: 0, maxT: 0.25, kind: 'crate_break' });
      }
    },
  });

  coinSystem.update(dt, player, (value) => save.addCoins(value));

  for (const ex of explosions) ex.t += dt;
  explosions = explosions.filter((ex) => ex.t < ex.maxT);

  inventory.update(dt);

  const result = stage.update(dt, spawnDoorSystem, player);
  if (!wasCleared && stage.cleared) {
    hud.showToast('AREA CLEAR — reach the exit');
  }
  if (result === 'exit') {
    advanceStage();
  }

  camera.update(dt, player, stage.layout.length);

  if (!player.alive && gameOverOverlay.hidden) {
    gameOverStageEl.textContent = `Stage ${stage.stageNumber}`;
    gameOverOverlay.hidden = false;
    loop.setPaused(true);
  }
}

function render() {
  renderer.render({
    camera,
    stage,
    player,
    projectiles: projectileSystem.projectiles,
    coins: coinSystem.coins,
    explosions,
    viewportWidth: camera.viewportWidth,
    viewportHeight: camera.viewportHeight,
  });
  hud.update({ player, save, stageNumber: stage.stageNumber });
  if (inventoryUI.isOpen) inventoryUI.render();
}

const loop = new GameLoop({ update, render });
loop.start();
