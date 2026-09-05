// Fixed-timestep game loop with a hard pause switch. Pause must freeze every
// simulated system in one place (spec section 28) — nothing outside this
// loop is allowed to keep ticking while paused.
const STEP = 1 / 60;
const MAX_FRAME = 0.25; // clamp to avoid spiral-of-death after tab throttling

export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.paused = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this._raf = null;
    this._running = false;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.lastTime = performance.now();
    const tick = (now) => {
      if (!this._running) return;
      const frameSec = Math.min(MAX_FRAME, (now - this.lastTime) / 1000);
      this.lastTime = now;
      if (!this.paused) {
        this.accumulator += frameSec;
        while (this.accumulator >= STEP) {
          this.update(STEP);
          this.accumulator -= STEP;
        }
      }
      this.render(this.paused ? 0 : this.accumulator / STEP);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  setPaused(paused) {
    this.paused = paused;
    if (!paused) {
      // Resume without a time jump: drop any accumulated backlog.
      this.lastTime = performance.now();
      this.accumulator = 0;
    }
  }

  togglePause() {
    this.setPaused(!this.paused);
  }
}
