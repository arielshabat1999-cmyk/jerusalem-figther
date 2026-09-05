import { getPlayerAnimState, getEnemyAnimState, playerActorId, enemyActorId } from './AnimationState.js';
import { CHARACTER_SCALE } from '../config/GameConfig.js';

// Wraps PlaceholderAdapter with a real-art lookup per entity, per the
// art-pack rule: "If an asset cannot be cleanly extracted ... keep the
// closest existing runtime placeholder for that ONE asset ... and continue
// with the rest rather than blocking the build." Every draw* method here
// checks the AssetRegistry first and falls back to the placeholder shape
// individually — so partial art (e.g. one enemy family with no clean
// extraction) renders correctly with no missing/blank entities.
//
// Character/prop/FX sprites are drawn at their own authored size, anchored
// at (anchorX, anchorY) of that sprite — NEVER stretched to the entity's
// logical hitbox (art-pack rule: collision bounds stay independent of
// visible sprite bounds). Environment tiles (walls/stairs/doors) are the
// one exception: they're tiled/fit to the solid's own geometry, because a
// wall's on-screen size IS its collision size by design in this engine.
export function createArtAdapter(assets, placeholder) {
  const clockStart = performance.now();
  const clock = () => (performance.now() - clockStart) / 1000;

  // `scale` resizes only the DESTINATION rect — the source crop (sprite.x/
  // y/w/h) is always read at its native pixel size, so this never stretches
  // or distorts a sprite based on its own source dimensions; it only
  // normalizes how big that already-correct crop reads on screen.
  function drawAnchoredSprite(ctx, sprite, footX, footY, cam, facingDir = 1, scale = 1) {
    const w = sprite.w * scale;
    const h = sprite.h * scale;
    const drawY = footY - cam.y - sprite.anchorY * h;
    ctx.save();
    if (facingDir < 0) {
      ctx.translate(footX - cam.x, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h, -sprite.anchorX * w, drawY, w, h);
    } else {
      const drawX = footX - cam.x - sprite.anchorX * w;
      ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h, drawX, drawY, w, h);
    }
    ctx.restore();
  }

  // Per-actor visual scale cache: normalizes every actor to the same
  // on-screen height (CHARACTER_SCALE.targetHeightPx) using that actor's OWN
  // idle frame as the reference, regardless of how big it was authored/
  // extracted at natively — this is the fix for player/enemy sprites that
  // came from different source sheets at different native pixel scales.
  // "Heavy" (strong) enemy variants get an extra multiplier on top so they
  // still read as intentionally larger, not just a differently-scaled copy.
  const scaleCache = new Map();
  function getActorScale(actorId, heavy) {
    if (scaleCache.has(actorId)) return scaleCache.get(actorId);
    const idleSprite = actorFrame(actorId, 'idle');
    // `refH` (set by AssetRegistry from an optional manifest field) is the
    // true character height when the sprite is a padded fixed-size canvas
    // (e.g. a 256x256 production frame) rather than a tight crop — falls
    // back to the sprite's own pixel height for tightly-cropped art.
    const nativeH = idleSprite ? idleSprite.refH || idleSprite.h : CHARACTER_SCALE.targetHeightPx;
    let scale = CHARACTER_SCALE.targetHeightPx / nativeH;
    if (heavy) scale *= CHARACTER_SCALE.heavyMultiplier;
    scaleCache.set(actorId, scale);
    return scale;
  }

  function actorFrame(actorId, animState) {
    const animKey = `${actorId}.${animState}`;
    return assets.hasAnimation(animKey) ? assets.getAnimationFrame(animKey, clock()) : null;
  }

  // Static (non-animated) art — props, env tiles, FX icons — is registered
  // as a single-frame "animation" by build time, so the same lookup works.
  function staticSprite(key) {
    return assets.hasAnimation(key) ? assets.getAnimationFrame(key, 0) : null;
  }

  function tileTexture(ctx, sprite, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const tw = sprite.w;
    const th = sprite.h;
    for (let ty = y; ty < y + h; ty += th) {
      for (let tx = x; tx < x + w; tx += tw) {
        ctx.drawImage(sprite.image, sprite.x, sprite.y, tw, th, tx, ty, tw, th);
      }
    }
    ctx.restore();
  }

  // Cinematic parallax (spec: 6-7 layer target, Temple Mount skyline kept
  // visible, day->sunset->night). Only one full composited skyline photo
  // was cleanly extractable per lighting state (see status doc), so this
  // draws that as a slow-scrolling far layer plus a closer, faster haze
  // gradient layer — two layers, not a single flattened background, with
  // room to insert more layers later without touching call sites.
  function drawBackground(ctx, camera, viewportWidth, viewportHeight, lightingState) {
    const sprite = assets.getSprite(`bg.${lightingState}`);
    if (!sprite) return placeholder.drawBackground(ctx, camera, viewportWidth, viewportHeight, lightingState);

    const scale = viewportHeight / sprite.h;
    const scaledW = sprite.w * scale;
    const farParallax = 0.12;
    const offset = ((camera.x * farParallax) % scaledW + scaledW) % scaledW;
    for (let x = -offset - scaledW; x < viewportWidth + scaledW; x += scaledW) {
      ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h, x, 0, scaledW, viewportHeight);
    }

    const hazeColors = {
      day: 'rgba(255,244,214,0.10)',
      sunset: 'rgba(255,140,90,0.16)',
      night: 'rgba(20,30,70,0.30)',
    };
    const haze = ctx.createLinearGradient(0, viewportHeight * 0.5, 0, viewportHeight);
    haze.addColorStop(0, 'rgba(0,0,0,0)');
    haze.addColorStop(1, hazeColors[lightingState] || hazeColors.day);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }

  return {
    drawBackground,
    drawSolid: (ctx, s, cam) => {
      const sprite = assets.getSprite(`env.${s.texture || 'wall'}`) || assets.getSprite('env.wall');
      if (!sprite) return placeholder.drawSolid(ctx, s, cam);
      tileTexture(ctx, sprite, s.x - cam.x, s.y - cam.y, s.w, Math.min(s.h, 900));
    },

    drawStair: (ctx, stair, cam) => {
      const sprite = assets.getSprite('env.stairs');
      if (!sprite) return placeholder.drawStair(ctx, stair, cam);
      const x = stair.x - cam.x;
      const yTop = Math.min(stair.yAtX0, stair.yAtX1) - cam.y;
      const yBottom = Math.max(stair.yAtX0, stair.yAtX1) - cam.y + 16;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, stair.yAtX0 - cam.y);
      ctx.lineTo(x + stair.w, stair.yAtX1 - cam.y);
      ctx.lineTo(x + stair.w, stair.yAtX1 - cam.y + 16);
      ctx.lineTo(x, stair.yAtX0 - cam.y + 16);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h, x, yTop, stair.w, yBottom - yTop);
      ctx.restore();
    },

    drawDoor: (ctx, door, cam, label) => {
      const sprite = assets.getSprite('env.door');
      if (!sprite) return placeholder.drawDoor(ctx, door, cam, label);
      const w = 40;
      const h = 90;
      const x = door.x - w / 2 - cam.x;
      const y = door.floorY - h - cam.y;
      ctx.globalAlpha = door.open ? 0.55 : 1;
      ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, w, h);
      ctx.globalAlpha = 1;
    },

    drawMarkerDoor: (ctx, x, floorY, cam, label, color) => {
      const sprite = assets.getSprite('env.door');
      if (!sprite) return placeholder.drawMarkerDoor(ctx, x, floorY, cam, label, color);
      const w = 40;
      const h = 90;
      const dx = x - w / 2 - cam.x;
      const dy = floorY - h - cam.y;
      ctx.globalAlpha = label === 'LOCKED' ? 0.6 : 1;
      ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h, dx, dy, w, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f2e6c8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x - cam.x, dy - 4);
    },

    drawCrate: (ctx, crate, cam) => {
      const sprite = staticSprite(`prop.${crate.type}.idle`);
      if (!sprite) return placeholder.drawCrate(ctx, crate, cam);
      drawAnchoredSprite(ctx, sprite, crate.x + crate.w / 2, crate.y + crate.h, cam);
    },

    drawCoin: (ctx, coin, cam) => {
      const sprite = staticSprite('fx.coin.idle');
      if (!sprite) return placeholder.drawCoin(ctx, coin, cam);
      drawAnchoredSprite(ctx, sprite, coin.x, coin.y, cam);
    },

    drawProjectile: (ctx, p, cam) => {
      const sprite = staticSprite('fx.bullet.idle');
      if (!sprite) return placeholder.drawProjectile(ctx, p, cam);
      drawAnchoredSprite(ctx, sprite, p.x, p.y, cam, p.vx < 0 ? -1 : 1);
    },

    drawPlayer: (ctx, player, cam) => {
      const actorId = playerActorId(player);
      const state = getPlayerAnimState(player);
      // Walk/run play a real extracted multi-frame cycle, advanced by
      // distance travelled (player.gaitPhase) rather than wall-clock time,
      // so leg cadence tracks actual speed and freezes solid when idle.
      // Every other state (idle/jump/fall/crouch/shoot/hit/death) uses the
      // normal clock-driven animation lookup.
      const isGaited = state === 'walk' || state === 'run';
      const sprite = isGaited
        ? assets.getAnimationFrameAtPhase(`${actorId}.${state}`, player.gaitPhase) || actorFrame(actorId, 'idle')
        : actorFrame(actorId, state) || actorFrame(actorId, 'idle');
      if (!sprite) return placeholder.drawPlayer(ctx, player, cam);
      const footX = player.x + player.w / 2;
      const footY = player.y + player.h;
      drawAnchoredSprite(ctx, sprite, footX, footY, cam, player.facingDir, getActorScale(actorId, false));
    },

    drawEnemy: (ctx, enemy, cam) => {
      const actorId = enemyActorId(enemy);
      const state = getEnemyAnimState(enemy);
      const sprite = actorFrame(actorId, state) || actorFrame(actorId, 'idle');
      if (!sprite) return placeholder.drawEnemy(ctx, enemy, cam);
      const footX = enemy.x + enemy.w / 2;
      const footY = enemy.y + enemy.h;
      drawAnchoredSprite(ctx, sprite, footX, footY, cam, enemy.facingDir, getActorScale(actorId, !!enemy.strong));
    },

    drawExplosion: (ctx, x, y, radius, cam, kind = 'explosion') => {
      const sprite = staticSprite(`fx.${kind}.idle`) || staticSprite('fx.explosion.idle');
      if (!sprite) return placeholder.drawExplosion(ctx, x, y, radius, cam);
      drawAnchoredSprite(ctx, sprite, x, y, cam);
    },
  };
}
