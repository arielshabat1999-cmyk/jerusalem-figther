import { WORLD, PLAYER, LEVEL } from '../config/GameConfig.js';
import { buildStageLayout } from './StageBuilder.js';
import { SpawnDoor } from '../entities/SpawnDoor.js';
import { Crate } from '../entities/Crate.js';
import { Enemy } from '../entities/Enemy.js';
import { elevationY } from './ChunkLibrary.js';

const CRATE_SIZE = 40;
const ENEMY_SIZE = { ranged: { w: 30, h: 60 }, melee: { w: 30, h: 58 } };
const EXIT_TRIGGER_WIDTH = 70;

// Owns everything about "the current stage as a place": its geometry, its
// entry/exit doors, its crates, its enemy roster, and the clear/complete
// state machine (spec sections 3, 4, 23, 24, 26).
export class StageSystem {
  constructor(world) {
    this.world = world;
    this.stageNumber = 1;
    this.layout = null;
    this.doors = [];
    this.crates = [];
    this.enemies = [];
    this.cleared = false;
    this.exitOpen = false;
    this.exitTriggered = false;
    this.backtrackLimit = PLAYER.backtrackDistanceMeters * WORLD.pixelsPerMeter;
  }

  loadStage(stageNumber) {
    this.stageNumber = stageNumber;
    this.layout = buildStageLayout(stageNumber);
    this.world.setStaticGeometry(this.layout.solids, this.layout.stairs);

    this.crates = this.layout.crateSpecs.map(
      (c) => new Crate(c.x - CRATE_SIZE / 2, LEVEL.groundY - CRATE_SIZE, CRATE_SIZE, CRATE_SIZE, c.type)
    );
    this.doors = this.layout.doorSpecs.map((d) => new SpawnDoor(d.x, elevationY(d.elevation), d.enemySpecs));
    this.enemies = [];
    this.cleared = false;
    this.exitOpen = false;
    this.exitTriggered = false;

    this._syncDynamicSolids();
  }

  playerSpawn() {
    return { x: this.layout.entryX, y: elevationY(0) - PLAYER.standHeight };
  }

  getActiveEnemyCount() {
    return this.enemies.filter((e) => !e.dead).length;
  }

  spawnEnemy(kind, strong, x, floorY) {
    const size = ENEMY_SIZE[kind];
    const enemy = new Enemy(kind, x - size.w / 2, floorY - size.h, size.w, size.h, { strong, statScale: this.layout.statScale });
    this.enemies.push(enemy);
    return enemy;
  }

  // Removes long-dead bodies for performance (spec section 22) and prunes
  // fully-consumed coins/crates the renderer no longer needs to iterate.
  update(dt, spawnDoorSystem, player) {
    for (const e of this.enemies) {
      if (e.dead) e.deathTimer -= dt;
    }
    this.enemies = this.enemies.filter((e) => !e.dead || e.deathTimer > 0);

    spawnDoorSystem.update(dt, this.doors, {
      progressionFrontier: player.progressionX,
      backtrackLimit: this.backtrackLimit,
      getActiveEnemyCount: () => this.getActiveEnemyCount(),
      activeEnemyLimit: this.layout.activeEnemyLimit,
      spawnEnemy: (kind, strong, x, floorY) => this.spawnEnemy(kind, strong, x, floorY),
    });

    if (!this.cleared) {
      const noActiveEnemies = this.enemies.every((e) => e.dead);
      const noPendingDoors = this.doors.every((d) => !d.hasPendingEnemies());
      if (noActiveEnemies && noPendingDoors) {
        this.cleared = true;
        this.exitOpen = true;
      }
    }

    // Backtracking is limited to a fixed distance behind the progression
    // frontier (spec section 26) — clamp here so it holds regardless of
    // input source or physics edge cases.
    const minX = player.progressionX - this.backtrackLimit;
    if (player.x < minX) {
      player.x = minX;
      if (player.vx < 0) player.vx = 0;
    }

    // The exit stays locked until the stage is cleared (spec section 4) —
    // enforce that as a physical barrier too, otherwise nothing stops the
    // player from running straight past a locked door and off the end of
    // the authored level geometry.
    if (!this.exitOpen) {
      const maxX = this.layout.exitX - player.w;
      if (player.x > maxX) {
        player.x = maxX;
        if (player.vx > 0) player.vx = 0;
      }
    }

    this._syncDynamicSolids();

    if (this.exitOpen && !this.exitTriggered && player.x + player.w >= this.layout.exitX) {
      this.exitTriggered = true;
      return 'exit';
    }
    return null;
  }

  _syncDynamicSolids() {
    this.world.setDynamicSolids(this.crates.filter((c) => !c.destroyed));
  }

  isExitZone(x) {
    return x >= this.layout.exitX && x <= this.layout.exitX + EXIT_TRIGGER_WIDTH;
  }
}
