import { CRATE } from '../config/GameConfig.js';

// Destructible cover (spec section 19/25). Participates in the world as a
// solid, bullet-blocking rectangle until its hp reaches zero.
export class Crate {
  constructor(x, y, w, h, type = 'crate') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.hp = CRATE.hp;
    this.destroyed = false;
    this.blocksBullets = true;
  }

  applyDamage(amount) {
    if (this.destroyed) return;
    this.hp -= amount;
    if (this.hp <= 0) this.destroyed = true;
  }
}
