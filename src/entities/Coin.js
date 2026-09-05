export class Coin {
  constructor(x, y, value, popVelocity) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.vx = (Math.random() - 0.5) * 80;
    this.vy = popVelocity;
    this.collected = false;
    this.age = 0;
  }
}
