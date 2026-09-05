import { ENEMIES } from '../config/GameConfig.js';

const GUN_HEIGHT_FRACTION = 0.32;
const JUMP_VELOCITY = -700;
const OBSTACLE_PROBE_DIST = 26;
const OBSTACLE_MAX_CLEAR_HEIGHT = 70;

function distanceToPlayer(enemy, player) {
  return player.x + player.w / 2 - (enemy.x + enemy.w / 2);
}

// True when a solid rectangle blocks the enemy's path within a short probe
// ahead of it and low enough to jump over — used by melee pursuit and,
// loosely, by ranged repositioning (spec: "enemies may jump over suitable
// obstacles", "must not teleport to solve navigation problems").
function obstacleAheadIsJumpable(enemy, world, dirSign) {
  const probeX = dirSign > 0 ? enemy.x + enemy.w + 1 : enemy.x - OBSTACLE_PROBE_DIST - 1;
  const probe = { x: probeX, y: enemy.y - 4, w: OBSTACLE_PROBE_DIST, h: enemy.h + 4 };
  for (const s of world.allSolids()) {
    const overlaps = probe.x < s.x + s.w && probe.x + probe.w > s.x && probe.y < s.y + s.h && probe.y + probe.h > s.y;
    if (overlaps) {
      const obstacleHeightAboveFeet = enemy.y + enemy.h - s.y;
      return obstacleHeightAboveFeet <= OBSTACLE_MAX_CLEAR_HEIGHT;
    }
  }
  return false;
}

function tickCommon(enemy, dt) {
  if (enemy.knockbackTimer > 0) enemy.knockbackTimer -= dt;
  if (enemy.ai.jumpCooldown > 0) enemy.ai.jumpCooldown -= dt;
  if (enemy.ai.reactionTimer > 0) {
    enemy.ai.reactionTimer -= dt;
    return true; // still reacting to activation, no decisions yet
  }
  return false;
}

export function updateRangedAI(enemy, dt, { player, world, spawnProjectile }) {
  const stats = ENEMIES.ranged;
  const reacting = tickCommon(enemy, dt);
  if (enemy.knockbackTimer > 0) return;
  if (reacting) {
    enemy.vx = 0;
    return;
  }

  const delta = distanceToPlayer(enemy, player);
  const absDist = Math.abs(delta);
  if (absDist > 4) enemy.facingDir = Math.sign(delta);

  const gunY = enemy.y + enemy.h * GUN_HEIGHT_FRACTION;
  const blocked = world.lineOfSightBlocked(enemy.x, player.x, gunY, enemy);

  enemy.ai.fireCooldown -= dt;
  enemy.ai.evadeTimer -= dt;

  let desiredVx = 0;
  if (blocked) {
    // Cover is in the way: reposition rather than firing into a wall.
    const dirSign = Math.sign(delta) || 1;
    if (enemy.onGround && enemy.ai.jumpCooldown <= 0 && obstacleAheadIsJumpable(enemy, world, dirSign)) {
      enemy.vy = JUMP_VELOCITY;
      enemy.ai.jumpCooldown = 1.2;
    }
    desiredVx = dirSign * enemy.moveSpeed;
  } else if (absDist < stats.preferredMinDist) {
    desiredVx = -Math.sign(delta) * enemy.moveSpeed * 0.8;
  } else if (absDist > stats.preferredMaxDist) {
    desiredVx = Math.sign(delta) * enemy.moveSpeed;
  } else {
    desiredVx = 0;
    if (enemy.ai.evadeTimer <= 0) {
      enemy.ai.evadeTimer = stats.evadeIntervalSec * (0.6 + Math.random() * 0.8);
      if (enemy.onGround) {
        if (Math.random() < 0.5) {
          enemy.vy = JUMP_VELOCITY * 0.85;
        } else {
          enemy.crouching = true;
          enemy._crouchTimer = 0.5;
        }
      }
    }
  }
  enemy.vx = desiredVx;

  if (enemy.crouching) {
    enemy._crouchTimer -= dt;
    if (enemy._crouchTimer <= 0) enemy.crouching = false;
  }

  if (!blocked && absDist <= stats.preferredMaxDist && enemy.ai.fireCooldown <= 0) {
    enemy.ai.fireCooldown = stats.fireCooldownSec;
    spawnProjectile({
      x: enemy.facingDir > 0 ? enemy.x + enemy.w : enemy.x,
      y: gunY,
      vx: 480 * enemy.facingDir,
      damage: enemy.damage,
      isExplosive: false,
      faction: 'enemy',
    });
  }
}

export function updateMeleeAI(enemy, dt, { player, world, onMeleeHit }) {
  const stats = ENEMIES.melee;
  const reacting = tickCommon(enemy, dt);
  if (enemy.knockbackTimer > 0) return;
  if (reacting) {
    enemy.vx = 0;
    return;
  }

  const delta = distanceToPlayer(enemy, player);
  const absDist = Math.abs(delta);
  if (absDist > 4) enemy.facingDir = Math.sign(delta);

  enemy.ai.meleeCooldown -= dt;

  if (absDist <= stats.meleeRange) {
    enemy.vx = 0;
    if (enemy.ai.meleeCooldown <= 0) {
      enemy.ai.meleeCooldown = stats.meleeCooldownSec;
      onMeleeHit(player, enemy.damage, enemy.x);
    }
    return;
  }

  const dirSign = Math.sign(delta) || enemy.facingDir;
  if (enemy.onGround && enemy.ai.jumpCooldown <= 0 && obstacleAheadIsJumpable(enemy, world, dirSign)) {
    enemy.vy = JUMP_VELOCITY;
    enemy.ai.jumpCooldown = 0.8;
  }
  enemy.vx = dirSign * enemy.moveSpeed;
}
