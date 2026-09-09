import { PlaceholderAdapter } from './PlaceholderAdapter.js';
import { DEV_RUNTIME } from '../dev/GameBalance.js';

// Render-only: reads entity state, draws it, mutates nothing. Swapping
// `adapter` for a future sprite-based one is the only change needed to move
// off placeholder visuals (spec section 33/36).
export class Renderer {
  constructor(canvas, adapter = PlaceholderAdapter) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.adapter = adapter;
    this._lastFrameTime = 0;
    this._fps = 0;
  }

  resize(cssWidth, cssHeight) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  render(state) {
    const { ctx, adapter } = this;
    const { camera, stage, player, world, projectiles, coins, explosions, viewportWidth, viewportHeight } = state;
    // The canvas is cleared to fully transparent and left that way — the
    // fixed image in #bgLayer (index.html/style.css) is now the current
    // global backdrop, rendered behind the canvas via DOM stacking, so it
    // shows through wherever nothing else is drawn. The old parallax
    // sky/haze background (adapter.drawBackground) is temporarily not
    // called; it's untouched in ArtAdapter/PlaceholderAdapter so it can be
    // re-enabled later without rewriting it.
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    for (const s of stage.layout.solids) adapter.drawSolid(ctx, s, camera);
    for (const st of stage.layout.stairs) adapter.drawStair(ctx, st, camera);

    adapter.drawMarkerDoor(ctx, stage.layout.entryX, stage.layout.solids[0].y, camera, 'ENTRY', '#3a5f3a');
    adapter.drawMarkerDoor(ctx, stage.layout.exitX, stage.layout.solids[0].y, camera, stage.exitOpen ? 'EXIT' : 'LOCKED', stage.exitOpen ? '#2f6f4f' : '#6a2a2a');

    for (const door of stage.doors) {
      if (door.state === 'idle' || door.state === 'resolved') continue;
      adapter.drawDoor(ctx, door, camera, door.state);
    }

    for (const crate of stage.crates) if (!crate.destroyed) adapter.drawCrate(ctx, crate, camera);
    for (const coin of coins) if (!coin.collected) adapter.drawCoin(ctx, coin, camera);
    for (const enemy of stage.enemies) adapter.drawEnemy(ctx, enemy, camera);
    for (const p of projectiles) adapter.drawProjectile(ctx, p, camera);
    for (const ex of explosions) adapter.drawExplosion(ctx, ex.x, ex.y, ex.radius * (ex.t / ex.maxT), camera, ex.kind);

    if (player.alive) adapter.drawPlayer(ctx, player, camera);

    this._renderDebugOverlays(ctx, { camera, stage, player, world, projectiles });
  }

  // DEV-only diagnostic draws, gated per-flag by DEV_RUNTIME.debug (see
  // src/dev/GameBalance.js / DevPanel's "Debug" tab). Purely additive on top
  // of the normal render above — never replaces or alters it, and reads the
  // exact same live entity/world state so what's drawn always matches what's
  // actually simulated (never a fabricated debug-only value).
  _renderDebugOverlays(ctx, { camera, stage, player, world, projectiles }) {
    const d = DEV_RUNTIME.debug;
    if (!(d.showCollision || d.showHitboxes || d.showSpawnDoors || d.showEnemyHP || d.showProjectileHitboxes || d.showCameraCoords || d.showFPS)) {
      this._trackFps();
      return;
    }

    if (d.showCollision && world) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      for (const s of world.allSolids()) ctx.strokeRect(s.x - camera.x, s.y - camera.y, s.w, s.h);
      ctx.lineWidth = 1;
    }

    if (d.showHitboxes) {
      ctx.strokeStyle = '#ff2ee0';
      if (player.alive) ctx.strokeRect(player.x - camera.x, player.y - camera.y, player.w, player.h);
      for (const e of stage.enemies) if (!e.dead) ctx.strokeRect(e.x - camera.x, e.y - camera.y, e.w, e.h);
    }

    if (d.showSpawnDoors) {
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      for (const door of stage.doors) {
        const x = door.x - camera.x;
        const y = door.floorY - camera.y;
        ctx.strokeStyle = door.state === 'idle' ? '#666' : '#ffd23f';
        ctx.strokeRect(x - 20, y - 90, 40, 90);
        ctx.fillStyle = '#ffd23f';
        ctx.fillText(door.state, x, y - 94);
      }
    }

    if (d.showEnemyHP) {
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff5e5e';
      for (const e of stage.enemies) {
        if (e.dead) continue;
        ctx.fillText(`${Math.ceil(e.hp)}/${e.maxHp}`, e.x - camera.x + e.w / 2, e.y - camera.y - 6);
      }
    }

    if (d.showProjectileHitboxes) {
      ctx.strokeStyle = '#7dff5e';
      for (const p of projectiles) ctx.strokeRect(p.x - camera.x - 4, p.y - camera.y - 2, p.isExplosive ? 10 : 8, 5);
    }

    this._trackFps();

    // Both text readouts share the canvas's top-left corner (row-by-row) —
    // the HUD's own DOM box occupies the top-right, so that's the one spot
    // guaranteed not to be painted over by it.
    let debugTextY = 46; // below the HUD's own health/shield bars, above the ammo pill (top: 68px)
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    if (d.showFPS) { ctx.fillText(`${this._fps} fps`, 8, debugTextY); debugTextY += 14; }
    if (d.showCameraCoords) {
      ctx.fillText(`cam ${Math.round(camera.x)},${Math.round(camera.y)} player ${Math.round(player.x)},${Math.round(player.y)}`, 8, debugTextY);
    }
  }

  _trackFps() {
    const now = performance.now();
    if (this._lastFrameTime) {
      const dt = now - this._lastFrameTime;
      if (dt > 0) this._fps = Math.round(0.9 * this._fps + 0.1 * (1000 / dt));
    }
    this._lastFrameTime = now;
  }
}
