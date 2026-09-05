import { SPAWN_DOOR } from '../config/GameConfig.js';

// First-class spawn door system (spec section 23/24). Enemies only ever
// enter the world here — nothing else in the codebase is allowed to push a
// new Enemy into the stage's enemy list.
export class SpawnDoorSystem {
  // `getActiveEnemyCount` and `spawnEnemy(kind, strong, x, floorY)` are
  // injected so this system stays ignorant of Enemy's constructor shape.
  update(dt, doors, { progressionFrontier, backtrackLimit, getActiveEnemyCount, activeEnemyLimit, spawnEnemy }) {
    for (const door of doors) {
      if (door.state === 'resolved') continue;

      if (door.state === 'idle') {
        const behindBoundary = door.x < progressionFrontier - backtrackLimit;
        if (behindBoundary) {
          // Forward-only spawning: a door permanently passed behind the
          // player is cancelled safely instead of ever spawning (spec
          // section 23 "Forward-Only Spawning").
          door.state = 'resolved';
          continue;
        }
        if (door.x <= progressionFrontier + SPAWN_DOOR.activationAheadDistance) {
          door.state = 'opening';
          door.timer = SPAWN_DOOR.doorOpenCloseSec;
          door.open = true;
        }
        continue;
      }

      if (door.state === 'opening') {
        door.timer -= dt;
        if (door.timer <= 0) {
          door.state = door.enemySpecs.length ? 'releasing' : 'closing';
          door.timer = SPAWN_DOOR.enemyExitDelaySec;
        }
        continue;
      }

      if (door.state === 'releasing') {
        if (getActiveEnemyCount() >= activeEnemyLimit) {
          // Respect the active-enemy cap: hold the release rather than
          // creating an unfair swarm (spec section 24).
          continue;
        }
        door.timer -= dt;
        if (door.timer <= 0) {
          const spec = door.enemySpecs[door.releaseIndex];
          spawnEnemy(spec.kind, !!spec.strong, door.x, door.floorY);
          door.releaseIndex += 1;
          if (door.releaseIndex >= door.enemySpecs.length) {
            door.state = 'closing';
            door.timer = SPAWN_DOOR.doorOpenCloseSec;
          } else {
            door.timer = SPAWN_DOOR.enemyExitDelaySec;
          }
        }
        continue;
      }

      if (door.state === 'closing') {
        door.timer -= dt;
        if (door.timer <= 0) {
          door.open = false;
          door.state = 'resolved';
        }
      }
    }
  }
}
