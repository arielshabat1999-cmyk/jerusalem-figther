import { COINS, WORLD } from '../config/GameConfig.js';
import { Coin } from '../entities/Coin.js';

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randRange([min, max]) {
  return min + Math.random() * (max - min);
}

// Every dropped coin does a brief pop/bounce, then homes straight toward
// the player's current position unconditionally — no magnet radius, no
// distance cutoff. Homing ignores gravity and all level geometry (a coin
// dropped on another floor, above/below the player, or across the block
// still gets there — it is never trapped by a wall or a floor solid), and
// continuously re-targets the player every frame so it keeps following if
// the player moves mid-flight. Collection happens exactly once, right
// here, the instant a coin gets within COINS.collectRadius.
export class CoinSystem {
  constructor() {
    this.coins = [];
  }

  spawnFromRange(x, y, [min, max]) {
    const value = randInt(min, max);
    const popDuration = randRange(COINS.popDurationRange);
    this.coins.push(new Coin(x, y, value, COINS.popVelocity, popDuration));
  }

  update(dt, player, onCollect) {
    for (const coin of this.coins) {
      if (coin.collected) continue;
      coin.age += dt;

      if (!coin.homing) {
        if (coin.age >= coin.popDuration) {
          coin.homing = true;
        } else {
          // Brief cosmetic pop/bounce only — no world collision, so it can
          // never get stuck on geometry even during this short window.
          coin.vy += WORLD.gravity * dt;
          coin.x += coin.vx * dt;
          coin.y += coin.vy * dt;
          continue;
        }
      }

      const targetX = player.x + player.w / 2;
      const targetY = player.y + player.h / 2;
      const dx = targetX - coin.x;
      const dy = targetY - coin.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= COINS.collectRadius) {
        coin.collected = true;
        onCollect(coin.value);
        continue;
      }

      coin.homingSpeed = Math.min(COINS.homingMaxSpeed, coin.homingSpeed + COINS.homingAccelPerSec * dt);
      coin.x += (dx / dist) * coin.homingSpeed * dt;
      coin.y += (dy / dist) * coin.homingSpeed * dt;
    }
    this.coins = this.coins.filter((c) => !c.collected);
  }
}
