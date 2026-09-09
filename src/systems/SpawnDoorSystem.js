import { SPAWN_DOOR } from '../config/GameConfig.js';

// Pure door-animation executor ("door becomes active -> optional door
// animation -> enemy appears inside/behind doorway -> enemy enters playable
// area"). It owns none of the WHAT/WHERE/WHEN decisions — SpawnDirector.js
// decides those and calls `door.activate(specs)` before a door ever appears
// in the `activeDoors` list this is handed. Enemies only ever enter the
// world here — nothing else in the codebase is allowed to push a new Enemy
// into the stage's enemy list.
//
// Performance: this only ever iterates the small list of currently-active
// doors the Director maintains (usually 1-2, rarely 3), never the stage's
// full door list.
export class SpawnDoorSystem {
  // `getActiveEnemyCount` and `spawnEnemy(kind, tier, x, floorY)` are
  // injected so this system stays ignorant of Enemy's constructor shape.
  update(dt, activeDoors, { getActiveEnemyCount, maxAlive, spawnEnemy }) {
    for (const door of activeDoors) {
      if (door.state === 'opening') {
        door.timer -= dt;
        if (door.timer <= 0) {
          door.state = door.enemySpecs.length ? 'releasing' : 'closing';
          door.timer = SPAWN_DOOR.enemyExitDelaySec;
        }
        continue;
      }

      if (door.state === 'releasing') {
        if (getActiveEnemyCount() >= maxAlive) {
          // Respect the active-enemy cap: hold the release rather than
          // creating an unfair swarm.
          continue;
        }
        door.timer -= dt;
        if (door.timer <= 0) {
          const spec = door.enemySpecs[door.releaseIndex];
          spawnEnemy(spec.kind, spec.tier, door.x, door.floorY);
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
          door.state = 'idle'; // available for the Director to reuse for a later wave
        }
      }
    }
  }
}
