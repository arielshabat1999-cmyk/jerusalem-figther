import { PLAYER, WEAPONS, CHARACTER_SCALE, MUZZLE } from '../config/GameConfig.js';
import { WeaponRuntime, shouldFire } from '../systems/WeaponSystem.js';

const SHOOT_POSE_SEC = 0.12; // how long the "shoot" animation state reads as active after a shot

// Logical collision bounds only — no visual/sprite sizing lives here so a
// future art pass can mount different sprite dimensions without touching
// movement or collision code (spec section 33).
export class Player {
  constructor(x, y, save) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = PLAYER.standWidth;
    this.h = PLAYER.standHeight;
    this.facingDir = 1;
    this.onGround = false;
    this.onStair = null;
    this.stairEntryY = 0;
    this.gaitPhase = 0; // distance-based walk/run animation frame index — see PLAYER.gaitPxPerFrame

    this.crouching = false;
    this.wantsCrouch = false;

    this.maxHealth = PLAYER.maxHealth;
    this.health = this.maxHealth;
    this.maxShield = PLAYER.maxShield;
    this.shield = 0;
    this.timeSinceDamage = 999;
    this.hitStunTimer = 0;
    this.invulnTimer = 0;
    this.alive = true;

    this.progressionX = x;
    this.gender = save.data.characterGender === 'female' ? 'female' : 'male';
    this.lastFireTimer = 0;

    this.weapons = {};
    for (const id of Object.keys(WEAPONS)) {
      if (save.data.ownedWeapons[id]) {
        this.weapons[id] = new WeaponRuntime(id, save.data.weaponUpgradeLevels[id] || 0);
      }
    }
    this.activeWeaponId = save.data.activeWeaponId in this.weapons ? save.data.activeWeaponId : 'pistol';
    this._prevFireHeld = false;
  }

  get activeWeapon() {
    return this.weapons[this.activeWeaponId];
  }

  ownWeapon(id, upgradeLevel = 0) {
    this.weapons[id] = new WeaponRuntime(id, upgradeLevel);
  }

  setShieldCapacity(cap) {
    this.maxShield = cap;
    this.shield = Math.min(this.shield, cap);
  }

  update(dt, input, world, { spawnProjectile }) {
    this.timeSinceDamage += dt;
    if (this.hitStunTimer > 0) this.hitStunTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.lastFireTimer > 0) this.lastFireTimer -= dt;

    const stunned = this.hitStunTimer > 0;

    if (!stunned) {
      this._applyCrouchState(input.crouchHeld, world);
      const speed = this.crouching ? PLAYER.crouchMoveSpeed : PLAYER.moveSpeed;
      this.vx = input.axisX * speed;
      if (input.axisX !== 0) this.facingDir = Math.sign(input.axisX);

      if (input.consumeJump() && this.onGround) {
        this.vy = PLAYER.jumpVelocity;
        this.onGround = false;
      }
    } else {
      // Hit-stun: knockback continues decaying, no player-directed input.
      this.vx *= 0.9;
      input.consumeJump();
    }

    world.step(this, dt, { crouchHeld: this.crouching });
    this.progressionX = Math.max(this.progressionX, this.x);

    // Distance-based gait phase: only advances on the ground, so airborne
    // time never "banks" steps that play back instantly on landing, and
    // cadence naturally scales with actual horizontal speed rather than
    // wall-clock time.
    if (this.onGround) {
      this.gaitPhase += Math.abs(this.vx) * dt / PLAYER.gaitPxPerFrame;
    }

    // Weapon handling stays live even mid-stun so an equipped auto weapon
    // doesn't desync, but firing itself is suppressed while stunned.
    const weapon = this.activeWeapon;
    if (weapon) {
      weapon.update(dt);
      const pressedEdge = input.fireHeld && !this._prevFireHeld;
      if (!stunned && shouldFire(weapon, input.fireHeld, pressedEdge)) {
        weapon.consumeShot();
        spawnProjectile(this._muzzleSpawn(weapon));
        this.lastFireTimer = SHOOT_POSE_SEC;
      }
    }
    this._prevFireHeld = input.fireHeld;

    this._regenHealth(dt);
  }

  // Muzzle position is derived from the visible rifle, not the collision
  // box: same feet anchor ArtAdapter draws the sprite from, plus a
  // per-pose offset (spec: "add/use a muzzle anchor for every relevant
  // player animation state"). onGround+crouching is the one pose where the
  // rendered sprite is 'crouch_shoot' rather than 'shoot' while firing (see
  // AnimationState.getPlayerAnimState) — mirrored here so the anchor always
  // matches whatever pose is actually on screen this frame.
  _muzzleSpawn(weapon) {
    const state = this.onGround && this.crouching ? 'crouch_shoot' : 'shoot';
    const anchor = MUZZLE[state];
    const feetX = this.x + this.w / 2;
    const feetY = this.y + this.h;
    return {
      x: feetX + this.facingDir * anchor.forwardPx,
      y: feetY - anchor.heightFraction * CHARACTER_SCALE.targetHeightPx,
      vx: weapon.stats.projectileSpeed * this.facingDir,
      damage: weapon.stats.damage,
      isExplosive: !!weapon.stats.isExplosive,
      blastRadius: weapon.stats.blastRadius || 0,
      faction: 'player',
    };
  }

  _applyCrouchState(crouchHeld, world) {
    this.wantsCrouch = crouchHeld;
    if (crouchHeld && !this.crouching) {
      const feet = this.y + this.h;
      this.h = PLAYER.crouchHeight;
      this.y = feet - this.h;
      this.crouching = true;
    } else if (!crouchHeld && this.crouching) {
      const feet = this.y + this.h;
      const newY = feet - PLAYER.standHeight;
      const headroomProbe = { x: this.x, y: newY, w: this.w, h: PLAYER.standHeight };
      const blocked = world.solids.some(
        (s) => headroomProbe.x < s.x + s.w && headroomProbe.x + headroomProbe.w > s.x &&
          headroomProbe.y < s.y + s.h && headroomProbe.y + headroomProbe.h > s.y
      );
      if (!blocked) {
        this.h = PLAYER.standHeight;
        this.y = newY;
        this.crouching = false;
      }
      // Not enough headroom: stay crouched until it clears (spec 6/35.6).
    }
  }

  applyDamage(amount) {
    if (this.invulnTimer > 0 || !this.alive) return;
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    this.health -= remaining;
    this.timeSinceDamage = 0;
    this.hitStunTimer = PLAYER.hitReaction.hitStunSec;
    this.invulnTimer = PLAYER.hitReaction.hitStunSec + PLAYER.hitReaction.invulnSec;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  applyKnockback(fromX) {
    const dir = this.x < fromX ? -1 : 1;
    this.vx = dir * PLAYER.hitReaction.knockbackSpeed;
  }

  _regenHealth(dt) {
    if (this.timeSinceDamage < PLAYER.healthRegen.delaySec) return;
    const cap = this.maxHealth * PLAYER.healthRegen.capPercent;
    if (this.health < cap) {
      this.health = Math.min(cap, this.health + PLAYER.healthRegen.ratePerSec * dt);
    }
  }

  heal(percentOfMax) {
    this.health = Math.min(this.maxHealth, this.health + this.maxHealth * percentOfMax);
  }

  respawnAt(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.shield = this.maxShield;
    this.alive = true;
    this.hitStunTimer = 0;
    this.invulnTimer = 0;
    this.crouching = false;
    this.h = PLAYER.standHeight;
    this.progressionX = x;
  }
}
