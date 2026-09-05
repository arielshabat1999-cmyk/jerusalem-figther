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
const renderer = new Renderer(canvas);
const camera = new CameraSystem(window.innerWidth, window.innerHeight);
const hud = new HUD();
const inventoryUI = new InventoryUI(inventory, save, player);

const input = new InputManager();
let explosions = [];

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.resize(w, h);
  camera.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

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
    spawnProjectile: (spec) => projectileSystem.spawn(spec),
  });

  for (const enemy of stage.enemies) {
    if (enemy.dead) continue;
    if (enemy.kind === 'ranged') {
      updateRangedAI(enemy, dt, { player, world, spawnProjectile: (spec) => projectileSystem.spawn(spec) });
    } else {
      updateMeleeAI(enemy, dt, {
        player,
        world,
        onMeleeHit: (target, damage, fromX) => applyMeleeHit(target, damage, fromX),
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
      explosions.push({ x, y, radius, t: 0, maxT: 0.3 });
      awardEnemyDeaths();
    },
    onActorHit: (actor, damage, faction, dirSign) => {
      if (actor === player) {
        player.applyDamage(damage);
        player.applyKnockback(dirSign > 0 ? player.x - 1 : player.x + 1);
      } else {
        actor.applyDamage(damage, dirSign);
        awardEnemyDeaths();
      }
    },
    onCrateHit: (crate, damage) => {
      crate.applyDamage(damage);
      if (crate.destroyed) coinSystem.spawnFromRange(crate.x + crate.w / 2, crate.y, [1, 4]);
    },
  });

  coinSystem.update(dt, player, world, (value) => save.addCoins(value));

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
