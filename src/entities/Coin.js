export class Coin {
  constructor(x, y, value, popVelocity, popDuration) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.vx = (Math.random() - 0.5) * 80; // pop-phase horizontal drift only
    this.vy = popVelocity;
    this.collected = false;
    this.age = 0;
    this.popDuration = popDuration; // sec — how long the pop/bounce lasts before homing takes over
    this.homing = false;
    this.homingSpeed = 0; // ramps 0 -> COINS.homingMaxSpeed once homing begins
  }
}
