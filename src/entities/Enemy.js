import { ENEMIES, ENEMY_TIERS } from '../config/GameConfig.js';

const HIT_POSE_SEC = 0.18;
let nextId = 1;

// One shared entity shape for both enemy classes (spec section 20/21) — the
// only thing that differs between a ranged and a melee enemy is which AI
// function drives its vx/vy/attacks each frame (see systems/EnemyAI.js).
// `tier` (Spawn Director spec section 1) is a second, independent axis: it
// only ever changes HP/damage/speed/coin-reward, layered on top of whichever
// base kind ('ranged'|'melee') this enemy is — it never introduces new AI
// behavior. HP and coin reward are fixed per tier, not scaled by stage.
export class Enemy {
  constructor(kind, x, y, w, h, { tier = 'enemy1' } = {}) {
    this.id = nextId++;
    this.kind = kind; // 'ranged' | 'melee'
    this.tier = tier; // 'enemy1' | 'enemy2' | 'enemy3' | 'heavy' | 'elite'
    const tierCfg = ENEMY_TIERS[tier];
    this.strong = tierCfg.visualStrong; // reuses the existing enemy_*_strong sprite family/scale, unchanged consumers
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
    this.maxHp = tierCfg.hp;
    this.hp = this.maxHp;
    this.moveSpeed = base.moveSpeed * tierCfg.speedMult;
    this.damage = base.damage * tierCfg.damageMult;
    this.scoreValue = tierCfg.scoreValue;
    this.coinDrop = tierCfg.coinDrop;

    this.dead = false;
    this.deathTimer = 0;
    this.knockbackTimer = 0;
    this.crouching = false;
    this.lastHitTimer = 0; // drives the 'hit' animation state, independent of melee knockback physics
    this.lastFireTimer = 0; // drives the 'shoot' animation state (ranged only)

    // AI scratch state, populated/used by systems/EnemyAI.js. Timing values
    // come only from the base kind — tiers never change AI reaction speed.
    this.ai = {
      fireCooldown: Math.random() * (base.fireCooldownSec || 1),
      meleeCooldown: 0,
      evadeTimer: (base.evadeIntervalSec || 2) * Math.random(),
      reactionTimer: base.reactionDelaySec,
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
