import { COINS, WORLD } from '../config/GameConfig.js';
import { Coin } from '../entities/Coin.js';

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Coins pop, settle under gravity, then magnet toward the player and
// auto-collect within a radius (spec section 18) — deliberately forgiving
// so pickup feels good on a touchscreen without pixel-perfect contact.
export class CoinSystem {
  constructor() {
    this.coins = [];
  }

  spawnFromRange(x, y, [min, max]) {
    const value = randInt(min, max);
    this.coins.push(new Coin(x, y, value, COINS.popVelocity));
  }

  update(dt, player, world, onCollect) {
    for (const coin of this.coins) {
      if (coin.collected) continue;
      coin.age += dt;

      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      const dx = cx - coin.x;
      const dy = cy - coin.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= COINS.collectRadius) {
        coin.collected = true;
        onCollect(coin.value);
        continue;
      }

      if (dist <= COINS.magnetRadius) {
        coin.x += (dx / dist) * COINS.magnetSpeed * dt;
        coin.y += (dy / dist) * COINS.magnetSpeed * dt;
      } else {
        coin.vy = Math.min(400, coin.vy + WORLD.gravity * dt);
        coin.x += coin.vx * dt;
        coin.y += coin.vy * dt;
        if (world.isGroundedAt(coin.x, coin.y, 4, 4)) coin.vy = 0;
      }
    }
    this.coins = this.coins.filter((c) => !c.collected);
  }
}
