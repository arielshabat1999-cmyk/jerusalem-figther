const MAX_TRAVEL = 1800;
const BULLET_H = 5;

function segCrossesRect(prevX, newX, y, h, rect) {
  const lo = Math.min(prevX, newX);
  const hi = Math.max(prevX, newX);
  return rect.x < hi && rect.x + rect.w > lo && rect.y < y + h && rect.y + rect.h > y;
}

// Owns bullet/rocket movement and collision (spec sections 7, 8, 25). Kept
// independent of who fired the shot — player and enemy projectiles share
// the exact same resolution so cover and tunneling rules can't drift apart.
export class ProjectileSystem {
  constructor(world) {
    this.world = world;
    this.projectiles = [];
  }

  spawn(spec) {
    this.projectiles.push({
      x: spec.x,
      startX: spec.x,
      y: spec.y,
      vx: spec.vx,
      damage: spec.damage,
      isExplosive: !!spec.isExplosive,
      blastRadius: spec.blastRadius || 0,
      faction: spec.faction,
      dead: false,
    });
  }

  update(dt, { player, enemies, crates, onExplosion, onActorHit, onCrateHit }) {
    const blockers = this.world.bulletBlockers();
    for (const b of this.projectiles) {
      if (b.dead) continue;
      const prevX = b.x;
      b.x += b.vx * dt;

      if (Math.abs(b.x - b.startX) > MAX_TRAVEL) {
        b.dead = true;
        continue;
      }

      let hitPoint = null;

      for (const s of blockers) {
        if (segCrossesRect(prevX, b.x, b.y, BULLET_H, s)) {
          hitPoint = { x: b.x };
          break;
        }
      }

      if (!hitPoint) {
        for (const crate of crates) {
          if (crate.destroyed) continue;
          if (segCrossesRect(prevX, b.x, b.y, BULLET_H, crate)) {
            hitPoint = { x: b.x, crate };
            break;
          }
        }
      }

      if (!hitPoint && b.faction === 'player') {
        for (const e of enemies) {
          if (e.dead) continue;
          if (segCrossesRect(prevX, b.x, b.y, BULLET_H, e)) {
            hitPoint = { x: b.x, actor: e };
            break;
          }
        }
      } else if (!hitPoint && b.faction === 'enemy' && player.alive) {
        if (segCrossesRect(prevX, b.x, b.y, BULLET_H, player)) {
          hitPoint = { x: b.x, actor: player };
        }
      }

      if (hitPoint) {
        b.dead = true;
        if (b.isExplosive) {
          onExplosion(hitPoint.x, b.y, b.blastRadius, b.damage, b.faction);
        } else if (hitPoint.actor) {
          onActorHit(hitPoint.actor, b.damage, b.faction, prevX < b.x ? 1 : -1);
        } else if (hitPoint.crate) {
          onCrateHit(hitPoint.crate, b.damage);
        }
      }
    }
    this.projectiles = this.projectiles.filter((b) => !b.dead);
  }
}
