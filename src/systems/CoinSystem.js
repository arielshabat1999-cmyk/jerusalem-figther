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
    this.debug = false; // temporary diagnostic logging — see update()
  }

  spawnFromRange(x, y, [min, max]) {
    const value = randInt(min, max);
    const popDuration = randRange(COINS.popDurationRange);
    const coin = new Coin(x, y, value, COINS.popVelocity, popDuration);
    this.coins.push(coin);
    if (this.debug) console.log(`[coin ${coin.id}] DROP value=${value} at (${x.toFixed(0)},${y.toFixed(0)}) popDuration=${popDuration.toFixed(2)}s`);
    return coin;
  }

  // `world` is accepted but unused — homing coins deliberately ignore all
  // level geometry (spec: never trapped by a wall or a floor).
  update(dt, player, world, onCollect) {
    for (const coin of this.coins) {
      if (coin.collected) continue;
      coin.age += dt;

      const targetX = player.x + player.w / 2;
      const targetY = player.y + player.h / 2;
      const dx = targetX - coin.x;
      const dy = targetY - coin.y;
      const dist = Math.hypot(dx, dy);

      if (!coin.homing) {
        if (coin.age >= coin.popDuration) {
          coin.homing = true;
          if (this.debug) console.log(`[coin ${coin.id}] DROP -> HOMING dist=${dist.toFixed(0)}`);
        } else {
          // Brief cosmetic pop/bounce only — no world collision, so it can
          // never get stuck on geometry even during this short window.
          coin.vy += WORLD.gravity * dt;
          coin.x += coin.vx * dt;
          coin.y += coin.vy * dt;
          if (this.debug) {
            console.log(`[coin ${coin.id}] state=drop dist=${dist.toFixed(0)} vel=(${coin.vx.toFixed(0)},${coin.vy.toFixed(0)}) gravity=on`);
          }
          continue;
        }
      }

      if (dist <= COINS.collectRadius) {
        coin.collected = true;
        if (this.debug) console.log(`[coin ${coin.id}] HOMING -> COLLECTED value=${coin.value}`);
        onCollect(coin.value);
        continue;
      }

      coin.homingSpeed = Math.min(COINS.homingMaxSpeed, coin.homingSpeed + COINS.homingAccelPerSec * dt);
      const vx = (dx / dist) * coin.homingSpeed;
      const vy = (dy / dist) * coin.homingSpeed;
      coin.x += vx * dt;
      coin.y += vy * dt;
      if (this.debug) {
        console.log(`[coin ${coin.id}] state=homing dist=${dist.toFixed(0)} vel=(${vx.toFixed(0)},${vy.toFixed(0)}) gravity=off`);
      }
    }
    this.coins = this.coins.filter((c) => !c.collected);
  }
}
