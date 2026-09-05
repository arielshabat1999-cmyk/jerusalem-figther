// Central place damage is ever applied from, so "shield before health",
// knockback, and explosion radius rules (spec sections 8, 11, 13, 25) can't
// drift between the different callers that need them (bullets, melee,
// RPG blasts).
export function hitActor(actor, damage, faction, dirSign, isPlayer) {
  if (isPlayer) {
    actor.applyDamage(damage);
    actor.applyKnockback(dirSign > 0 ? actor.x - 1 : actor.x + 1);
  } else {
    actor.applyDamage(damage, dirSign);
  }
}

export function applyMeleeHit(player, damage, fromX) {
  player.applyDamage(damage);
  player.applyKnockback(fromX);
}

// RPG-style area damage. Player never damages themselves with their own
// explosion (spec section 8); enemy-sourced explosions symmetrically never
// hurt other enemies (spec section 21, no friendly fire).
export function applyExplosion(x, y, radius, damage, faction, { player, enemies, crates }) {
  const r2 = radius * radius;
  const within = (cx, cy) => {
    const dx = cx - x;
    const dy = cy - y;
    return dx * dx + dy * dy <= r2;
  };

  if (faction === 'enemy' && player.alive && within(player.x + player.w / 2, player.y + player.h / 2)) {
    player.applyDamage(damage);
    player.applyKnockback(x);
  }

  if (faction === 'player') {
    for (const e of enemies) {
      if (e.dead) continue;
      if (within(e.x + e.w / 2, e.y + e.h / 2)) {
        e.applyDamage(damage, e.x < x ? 1 : -1);
      }
    }
  }

  for (const crate of crates) {
    if (crate.destroyed) continue;
    if (within(crate.x + crate.w / 2, crate.y + crate.h / 2)) {
      crate.applyDamage(damage);
    }
  }
}
