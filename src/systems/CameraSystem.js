import { CAMERA } from '../config/GameConfig.js';

// Camera follows forward progression, smooths vertical changes when the
// player moves between floors, and never itself decides the backtrack
// boundary — that clamp is applied to the player directly by StageSystem so
// it holds even before the camera has caught up (spec section 26/31).
export class CameraSystem {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  update(dt, player, stageLength) {
    const lookAhead = CAMERA.lookAheadX * player.facingDir;
    const targetX = clamp(player.x + player.w / 2 - this.viewportWidth / 2 + lookAhead, 0, Math.max(0, stageLength - this.viewportWidth));
    const targetY = player.y + player.h / 2 - this.viewportHeight * 0.6;

    this.x += (targetX - this.x) * Math.min(1, CAMERA.followLerp * dt);
    this.y += (targetY - this.y) * Math.min(1, CAMERA.verticalLerp * dt);
  }

  worldToScreen(x, y) {
    return { x: x - this.x, y: y - this.y };
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
