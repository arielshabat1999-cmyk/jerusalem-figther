import { getPlayerAnimState, getEnemyAnimState, playerActorId, enemyActorId } from './AnimationState.js';

// Wraps PlaceholderAdapter with a real-art lookup per entity, per the
// art-pack rule: "If an asset cannot be cleanly extracted ... keep the
// closest existing runtime placeholder for that ONE asset ... and continue
// with the rest rather than blocking the build." Every draw* method here
// checks the AssetRegistry first and falls back to the placeholder shape
// individually — so partial art (e.g. characters done, environment not yet)
// renders correctly with no missing/blank entities.
//
// Sprites are drawn at their own authored size, anchored at (anchorX,
// anchorY) of that sprite — NEVER stretched to the entity's logical hitbox
// (art-pack rule: collision bounds stay independent of visible sprite
// bounds). The anchor point is aligned to the entity's feet-center in world
// space, which is what "bottom-center/feet anchors" means for a
// side-scrolling character.
export function createArtAdapter(assets, placeholder) {
  const clockStart = performance.now();
  const clock = () => (performance.now() - clockStart) / 1000;

  function drawAnchoredSprite(ctx, sprite, footX, footY, cam, facingDir = 1) {
    const w = sprite.w;
    const h = sprite.h;
    const drawX = footX - cam.x - sprite.anchorX * w;
    const drawY = footY - cam.y - sprite.anchorY * h;
    ctx.save();
    if (facingDir < 0) {
      ctx.translate(footX - cam.x, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite.image, sprite.x, sprite.y, w, h, -sprite.anchorX * w, drawY, w, h);
    } else {
      ctx.drawImage(sprite.image, sprite.x, sprite.y, w, h, drawX, drawY, w, h);
    }
    ctx.restore();
  }

  function actorFrame(actorId, animState) {
    const animKey = `${actorId}.${animState}`;
    return assets.hasAnimation(animKey) ? assets.getAnimationFrame(animKey, clock()) : null;
  }

  return {
    drawSolid: (ctx, s, cam) => placeholder.drawSolid(ctx, s, cam),
    drawStair: (ctx, stair, cam) => placeholder.drawStair(ctx, stair, cam),
    drawDoor: (ctx, door, cam, label) => placeholder.drawDoor(ctx, door, cam, label),
    drawMarkerDoor: (ctx, x, floorY, cam, label, color) => placeholder.drawMarkerDoor(ctx, x, floorY, cam, label, color),

    drawCrate: (ctx, crate, cam) => {
      const sprite = assets.getSprite(`prop.${crate.type}.idle`);
      if (!sprite) return placeholder.drawCrate(ctx, crate, cam);
      drawAnchoredSprite(ctx, sprite, crate.x + crate.w / 2 - cam.x, crate.y + crate.h - cam.y, { x: 0, y: 0 });
    },

    drawCoin: (ctx, coin, cam) => {
      const sprite = actorFrame('fx.coin', 'idle');
      if (!sprite) return placeholder.drawCoin(ctx, coin, cam);
      drawAnchoredSprite(ctx, sprite, coin.x, coin.y, cam);
    },

    drawProjectile: (ctx, p, cam) => {
      const sprite = assets.getSprite(`fx.bullet_${p.faction}`);
      if (!sprite) return placeholder.drawProjectile(ctx, p, cam);
      drawAnchoredSprite(ctx, sprite, p.x, p.y, cam, p.vx < 0 ? -1 : 1);
    },

    drawPlayer: (ctx, player, cam) => {
      const actorId = playerActorId(player);
      const state = getPlayerAnimState(player);
      const sprite = actorFrame(actorId, state) || actorFrame(actorId, 'idle');
      if (!sprite) return placeholder.drawPlayer(ctx, player, cam);
      const footX = player.x + player.w / 2;
      const footY = player.y + player.h;
      drawAnchoredSprite(ctx, sprite, footX, footY, cam, player.facingDir);
    },

    drawEnemy: (ctx, enemy, cam) => {
      const actorId = enemyActorId(enemy);
      const state = getEnemyAnimState(enemy);
      const sprite = actorFrame(actorId, state) || actorFrame(actorId, 'idle');
      if (!sprite) return placeholder.drawEnemy(ctx, enemy, cam);
      const footX = enemy.x + enemy.w / 2;
      const footY = enemy.y + enemy.h;
      drawAnchoredSprite(ctx, sprite, footX, footY, cam, enemy.facingDir);
    },

    drawExplosion: (ctx, x, y, radius, cam) => {
      const sprite = actorFrame('fx.explosion', 'idle');
      if (!sprite) return placeholder.drawExplosion(ctx, x, y, radius, cam);
      drawAnchoredSprite(ctx, sprite, x, y, cam);
    },
  };
}
