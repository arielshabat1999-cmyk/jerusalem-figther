// A spawn door is a pure position/floor anchor — it never decides WHAT or
// WHEN to spawn (that is entirely the Spawn Director's job, see
// systems/SpawnDirector.js). `activate(enemySpecs)` is the only way a door
// ever gets enemies to release; SpawnDoorSystem then just animates the
// open/release/close sequence. A door returns to 'idle' once fully closed
// so the Director may reuse the same doorway for a later wave within the
// same encounter zone — doors are anchors, not one-shot spawners.
export class SpawnDoor {
  constructor(id, x, floorY, floorIndex) {
    this.id = id;
    this.x = x;
    this.floorY = floorY; // world y of the floor the door sits on (feet level)
    this.floorIndex = floorIndex; // 0/1/2 elevation index — the floor this door belongs to
    this.enemySpecs = [];
    this.state = 'idle'; // idle -> opening -> releasing -> closing -> idle
    this.timer = 0;
    this.releaseIndex = 0;
    this.open = false;
  }

  activate(enemySpecs, doorOpenCloseSec) {
    if (this.state !== 'idle') return false;
    this.enemySpecs = enemySpecs;
    this.releaseIndex = 0;
    this.state = 'opening';
    this.timer = doorOpenCloseSec;
    this.open = true;
    return true;
  }
}
