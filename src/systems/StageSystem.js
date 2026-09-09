import { WORLD, PLAYER, LEVEL } from '../config/GameConfig.js';
import { buildStageLayout } from './StageBuilder.js';
import { SpawnDirector } from './SpawnDirector.js';
import { SpawnDoor } from '../entities/SpawnDoor.js';
import { Crate } from '../entities/Crate.js';
import { Enemy } from '../entities/Enemy.js';
import { elevationY, ELEVATION_GROUND, ELEVATION_FLOOR2, ELEVATION_ROOF } from './ChunkLibrary.js';

const FLOOR_LEVELS = [ELEVATION_GROUND, ELEVATION_FLOOR2, ELEVATION_ROOF];
const FLOOR_LAND_TOLERANCE = 2; // px — must be an exact/near-exact landing, never a mid-air/mid-ramp overlap

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
    this.currentFloor = ELEVATION_GROUND;
  }

  loadStage(stageNumber) {
    this.stageNumber = stageNumber;
    this.layout = buildStageLayout(stageNumber);
    this.world.setStaticGeometry(this.layout.solids, this.layout.stairs);

    this.crates = this.layout.crateSpecs.map(
      (c) => new Crate(c.x - CRATE_SIZE / 2, LEVEL.groundY - CRATE_SIZE, CRATE_SIZE, CRATE_SIZE, c.type, c.destructible)
    );
    this.doors = this.layout.doorSpecs.map((d) => new SpawnDoor(d.id, d.x, elevationY(d.elevation), d.elevation));
    this.spawnDirector = new SpawnDirector(stageNumber, this.doors, this.layout.encounterZones);
    this.enemies = [];
    this.cleared = false;
    this.exitOpen = false;
    this.exitTriggered = false;
    this.currentFloor = ELEVATION_GROUND;

    this._syncDynamicSolids();
  }

  playerSpawn() {
    return { x: this.layout.entryX, y: elevationY(0) - PLAYER.standHeight };
  }

  getActiveEnemyCount() {
    return this.enemies.filter((e) => !e.dead).length;
  }

  spawnEnemy(kind, tier, x, floorY) {
    const size = ENEMY_SIZE[kind];
    const enemy = new Enemy(kind, x - size.w / 2, floorY - size.h, size.w, size.h, { tier });
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

    this._updateCurrentFloor(player);

    this.spawnDirector.tick(dt, spawnDoorSystem, {
      player,
      currentFloor: this.currentFloor,
      getAliveCount: () => this.getActiveEnemyCount(),
      spawnEnemy: (kind, tier, x, floorY) => this.spawnEnemy(kind, tier, x, floorY),
    });

    if (!this.cleared) {
      const noActiveEnemies = this.enemies.every((e) => e.dead);
      const noPendingSpawns = this.spawnDirector.isExhausted();
      if (noActiveEnemies && noPendingSpawns) {
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

  // Tracks the player's active floor (stage-generation spec section 14):
  // only updates on a genuine stable landing — `player.onGround` this frame
  // AND the feet sitting within a couple px of one of the three known floor
  // Ys — never merely because a jump's arc briefly overlapped another
  // elevation, and never mid-ramp (a stair ramp's intermediate Y values
  // don't match any floor's exact Y, so walking across one leaves
  // `currentFloor` untouched until the player actually lands on the floor
  // at the far end).
  _updateCurrentFloor(player) {
    if (!player.onGround) return;
    const feetY = player.y + player.h;
    for (const floor of FLOOR_LEVELS) {
      if (Math.abs(feetY - elevationY(floor)) <= FLOOR_LAND_TOLERANCE) {
        this.currentFloor = floor;
        return;
      }
    }
  }

  _syncDynamicSolids() {
    this.world.setDynamicSolids(this.crates.filter((c) => !c.destroyed));
  }

  isExitZone(x) {
    return x >= this.layout.exitX && x <= this.layout.exitX + EXIT_TRIGGER_WIDTH;
  }
}
