import { ENEMIES } from '../config/GameConfig.js';

const HIT_POSE_SEC = 0.18;
let nextId = 1;

// One shared entity shape for both enemy classes (spec section 20/21) — the
// only thing that differs between a ranged and a melee enemy is which AI
// function drives its vx/vy/attacks each frame (see systems/EnemyAI.js).
export class Enemy {
  constructor(kind, x, y, w, h, { strong = false, statScale = 1 } = {}) {
    this.id = nextId++;
    this.kind = kind; // 'ranged' | 'melee'
    this.strong = strong;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = w;
    this.h = h;
    this.facingDir = -1;
    this.onGround = false;
    this.onStair = null;
    this.stairEntryY = 0;

    const base = ENEMIES[kind];
    const strongMult = strong ? ENEMIES.strong : null;
    this.maxHp = base.hp * statScale * (strong ? ENEMIES.strong.hpMult : 1);
    this.hp = this.maxHp;
    this.moveSpeed = base.moveSpeed * (strong ? ENEMIES.strong.speedMult : 1);
    this.damage = base.damage * statScale * (strong ? ENEMIES.strong.damageMult : 1);
    this.scoreValue = base.scoreValue;
    this.coinDrop = base.coinDrop;

    this.dead = false;
    this.deathTimer = 0;
    this.knockbackTimer = 0;
    this.crouching = false;
    this.lastHitTimer = 0; // drives the 'hit' animation state, independent of melee knockback physics
    this.lastFireTimer = 0; // drives the 'shoot' animation state (ranged only)

    // AI scratch state, populated/used by systems/EnemyAI.js.
    this.ai = {
      fireCooldown: Math.random() * (base.fireCooldownSec || 1),
      meleeCooldown: 0,
      evadeTimer: (base.evadeIntervalSec || 2) * Math.random(),
      reactionTimer: base.reactionDelaySec * (strong ? ENEMIES.strong.reactionDelayMult : 1),
      jumpCooldown: 0,
      activated: false,
    };
  }

  applyDamage(amount, fromDirSign) {
    if (this.dead) return;
    this.hp -= amount;
    this.lastHitTimer = HIT_POSE_SEC;
    if (this.kind === 'melee') {
      this.vx = -fromDirSign * ENEMIES.melee.knockbackOnHitSpeed;
      this.knockbackTimer = 0.22;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deathTimer = ENEMIES.deathLingerSec;
    }
  }

  tickTimers(dt) {
    if (this.lastHitTimer > 0) this.lastHitTimer -= dt;
    if (this.lastFireTimer > 0) this.lastFireTimer -= dt;
  }
}
