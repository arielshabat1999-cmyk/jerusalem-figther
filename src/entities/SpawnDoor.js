let nextId = 1;

// A spawn door never itself contains live enemies — it holds a queue of
// specs ('ranged' | 'melee', optionally strong) that are turned into real
// Enemy instances one at a time as the door releases them (spec section 23).
// An empty `enemySpecs` array is a deliberate empty door.
export class SpawnDoor {
  constructor(x, floorY, enemySpecs) {
    this.id = nextId++;
    this.x = x;
    this.floorY = floorY; // world y of the floor the door sits on (feet level)
    this.enemySpecs = enemySpecs;
    this.state = 'idle'; // idle -> opening -> releasing -> closing -> resolved
    this.timer = 0;
    this.releaseIndex = 0;
    this.open = false;
  }

  hasPendingEnemies() {
    return this.state !== 'resolved' && this.releaseIndex < this.enemySpecs.length;
  }
}
