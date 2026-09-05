import { CRATE } from '../config/GameConfig.js';

// Solid cover prop (spec section 19/25). `destructible` distinguishes
// breakable cover (crates/barrels/sacks — blocks until shot down) from
// solid-cover obstacles (carts/obstacles — permanent blocking, never
// destroyed) per the art-pack's decorative/solid-cover/breakable/traversal
// prop categories. Either kind participates in World as a normal solid, so
// it's already climbable/standable (the "traversal" case needs no special
// handling beyond that).
export class Crate {
  constructor(x, y, w, h, type = 'crate', destructible = true) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.destructible = destructible;
    this.hp = CRATE.hp;
    this.destroyed = false;
    this.blocksBullets = true;
  }

  applyDamage(amount) {
    if (this.destroyed || !this.destructible) return;
    this.hp -= amount;
    if (this.hp <= 0) this.destroyed = true;
  }
}
