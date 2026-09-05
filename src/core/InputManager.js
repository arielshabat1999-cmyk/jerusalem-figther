// Single source of truth for player intent. Touch is the real input;
// keyboard exists only as an optional dev/debug convenience (spec section 2)
// and feeds the exact same intent object so it can never diverge in behavior.
export class InputManager {
  constructor() {
    this.axisX = 0; // -1..1
    this.jumpPressed = false; // edge-triggered, consumed by PlayerController
    this.crouchHeld = false;
    this.fireHeld = false;
    this._jumpQueued = false;
  }

  setAxisX(v) {
    this.axisX = Math.max(-1, Math.min(1, v));
  }

  queueJump() {
    this._jumpQueued = true;
  }

  setCrouch(held) {
    this.crouchHeld = held;
  }

  setFire(held) {
    this.fireHeld = held;
  }

  // Called once per fixed simulation step; returns whether a jump should
  // start this step, and clears the queued flag (edge behavior).
  consumeJump() {
    const j = this._jumpQueued;
    this._jumpQueued = false;
    return j;
  }
}

export function attachTouchControls(input, { joystickEl, knobEl, fireBtn, pauseBtn, inventoryBtn }, callbacks) {
  const JOY_RADIUS = 45;
  let joyPointerId = null;

  function updateJoystick(clientX, clientY) {
    const rect = joystickEl.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const mag = Math.hypot(dx, dy);
    const clampedMag = Math.min(JOY_RADIUS, mag);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clampedMag;
    const ky = Math.sin(angle) * clampedMag;
    knobEl.style.transform = `translate(${kx}px, ${ky}px)`;

    const deadzone = 10;
    input.setAxisX(Math.abs(dx) > deadzone ? dx / JOY_RADIUS : 0);
    input.setCrouch(ky > 22);
    if (ky < -30) input.queueJump();
  }

  function resetJoystick() {
    knobEl.style.transform = 'translate(0px, 0px)';
    input.setAxisX(0);
    input.setCrouch(false);
  }

  joystickEl.addEventListener('pointerdown', (e) => {
    joyPointerId = e.pointerId;
    try { joystickEl.setPointerCapture(e.pointerId); } catch { /* no-op */ }
    updateJoystick(e.clientX, e.clientY);
  });
  joystickEl.addEventListener('pointermove', (e) => {
    if (e.pointerId === joyPointerId) updateJoystick(e.clientX, e.clientY);
  });
  const endJoystick = (e) => {
    if (e.pointerId !== joyPointerId) return;
    joyPointerId = null;
    resetJoystick();
  };
  joystickEl.addEventListener('pointerup', endJoystick);
  joystickEl.addEventListener('pointercancel', endJoystick);

  fireBtn.addEventListener('pointerdown', (e) => {
    try { fireBtn.setPointerCapture(e.pointerId); } catch { /* no-op */ }
    input.setFire(true);
  });
  const endFire = () => input.setFire(false);
  fireBtn.addEventListener('pointerup', endFire);
  fireBtn.addEventListener('pointercancel', endFire);

  pauseBtn.addEventListener('pointerdown', () => callbacks.onPause?.());
  inventoryBtn.addEventListener('pointerdown', () => callbacks.onInventory?.());

  // Debug-only keyboard mapping. Never the primary gameplay path.
  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    if (keys.has(e.code)) return;
    keys.add(e.code);
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') input.queueJump();
    if (e.code === 'KeyP') callbacks.onPause?.();
    if (e.code === 'KeyI') callbacks.onInventory?.();
    recomputeKeyboardAxis();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    recomputeKeyboardAxis();
  });
  function recomputeKeyboardAxis() {
    let ax = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) ax -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) ax += 1;
    input.setAxisX(ax);
    input.setCrouch(keys.has('ArrowDown') || keys.has('KeyS'));
    input.setFire(keys.has('KeyJ') || keys.has('ControlLeft') || keys.has('ControlRight'));
  }
}
