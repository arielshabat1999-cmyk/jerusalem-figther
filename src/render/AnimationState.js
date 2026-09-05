// Maps live gameplay state to one of the required animation states (art-pack
// manifest: idle, walk, run, jump, fall, shoot, crouch, hit, death). Pure
// functions, no rendering or asset knowledge — ArtAdapter looks up
// "<actorId>.<state>" in the AssetRegistry using whatever this returns, and
// PlaceholderAdapter can ignore it entirely. Keeping this separate means the
// mapping is identical whether or not real art is loaded yet.
const RUN_SPEED_THRESHOLD = 140; // px/s above this counts as "run" rather than "walk"

export function getPlayerAnimState(player) {
  if (!player.alive) return 'death';
  if (player.hitStunTimer > 0) return 'hit';
  if (player.lastFireTimer > 0 && player.onGround && !player.crouching) return 'shoot';
  if (!player.onGround) {
    if (player.lastFireTimer > 0) return 'shoot'; // shooting while airborne still reads as shoot
    return player.vy < 0 ? 'jump' : 'fall';
  }
  if (player.crouching) {
    if (player.lastFireTimer > 0) return 'crouch_shoot';
    return Math.abs(player.vx) > 1 ? 'crouch_walk' : 'crouch_idle';
  }
  if (Math.abs(player.vx) > RUN_SPEED_THRESHOLD) return 'run';
  if (Math.abs(player.vx) > 1) return 'walk';
  return 'idle';
}

export function getEnemyAnimState(enemy) {
  if (enemy.dead) return 'death';
  if (enemy.lastHitTimer > 0) return 'hit';
  if (!enemy.onGround) return enemy.vy < 0 ? 'jump' : 'fall';
  if (enemy.lastFireTimer > 0) return 'shoot';
  if (enemy.crouching) return 'crouch';
  if (Math.abs(enemy.vx) > RUN_SPEED_THRESHOLD) return 'run';
  if (Math.abs(enemy.vx) > 1) return 'walk';
  return 'idle';
}

// Player/enemy actorId used as the sprite-key prefix (e.g. "player_male",
// "enemy_ranged", "enemy_melee_strong").
export function playerActorId(player) {
  return `player_${player.gender === 'female' ? 'female' : 'male'}`;
}

// Enemy art ships as 4 headwear/look variants per family rather than a
// per-instance animation set (see ART_INTEGRATION_STATUS.md) — picking the
// variant from the entity's stable id gives visual variety across
// simultaneously active enemies of the same family without any extra state.
export function enemyActorId(enemy) {
  const family = `enemy_${enemy.kind}${enemy.strong ? '_strong' : ''}`;
  const variant = enemy.id % 4;
  return `${family}_v${variant}`;
}
