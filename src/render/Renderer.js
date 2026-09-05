import { PlaceholderAdapter } from './PlaceholderAdapter.js';
import { lightingStateForStage } from '../config/GameConfig.js';

// Render-only: reads entity state, draws it, mutates nothing. Swapping
// `adapter` for a future sprite-based one is the only change needed to move
// off placeholder visuals (spec section 33/36).
export class Renderer {
  constructor(canvas, adapter = PlaceholderAdapter) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.adapter = adapter;
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
    const { camera, stage, player, projectiles, coins, explosions, viewportWidth, viewportHeight } = state;
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    adapter.drawBackground(ctx, camera, viewportWidth, viewportHeight, lightingStateForStage(stage.stageNumber));

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
  }
}
