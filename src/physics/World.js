import { WORLD } from '../config/GameConfig.js';

// The single authoritative collision system (spec section 32). Every actor
// (player or enemy) moves through here so there is exactly one place that
// understands solids, stairs, and head collision.
//
// Solids are full AABB rectangles (building mass, walls, floors, rooftops):
// landing on top, blocked by sides, and blocked from below (head collision
// against balconies/ceilings) all fall out of one rectangle-vs-rectangle
// resolution — no separate one-way-platform special case is needed for the
// placeholder geometry this foundation ships with.
//
// Stairs are ramps that bridge two elevations that are not otherwise
// walkable between. While an actor's x is inside a stair's span:
//   - normal (not holding crouch): y is interpolated along the ramp, so
//     walking across auto-ascends/descends (spec section 6/35.5).
//   - crouch/down held: y is pinned to whichever elevation the actor
//     entered the stair span at, so the actor does not ascend (spec
//     section 6/35.6).
export class World {
  constructor() {
    this.solids = []; // {x,y,w,h, blocksBullets}
    this.stairs = []; // {x, w, yAtX0, yAtX1} — feet elevation at the span's left/right edge
    this.dynamicSolids = []; // populated per-frame by StageSystem (alive crates)
  }

  setStaticGeometry(solids, stairs) {
    this.solids = solids;
    this.stairs = stairs;
  }

  setDynamicSolids(list) {
    this.dynamicSolids = list;
  }

  allSolids() {
    return this.dynamicSolids.length ? this.solids.concat(this.dynamicSolids) : this.solids;
  }

  bulletBlockers() {
    return this.allSolids().filter((s) => s.blocksBullets !== false);
  }

  findStairAt(x) {
    return this.stairs.find((s) => x >= s.x && x <= s.x + s.w);
  }

  // Moves `actor` (an object with x,y,vx,vy,w,h,onGround,onStair,stairEntryY)
  // by one fixed step, resolving collisions against solids and stairs.
  step(actor, dt, { crouchHeld = false } = {}) {
    actor.vy = Math.min(WORLD.terminalFallSpeed, actor.vy + WORLD.gravity * dt);

    const stair = this.findStairAt(actor.x + actor.w / 2);
    if (stair) {
      if (actor.onStair !== stair) {
        actor.onStair = stair;
        actor.stairEntryY = actor.y + actor.h; // feet elevation at entry
      }
    } else {
      actor.onStair = null;
    }

    // Horizontal movement + wall collision (includes destructible crates).
    const prevX = actor.x;
    actor.x += actor.vx * dt;
    for (const s of this.allSolids()) {
      if (this._overlaps(actor, s)) {
        // Only treat as a wall block if the actor isn't mostly above it
        // (i.e. not simply standing/landing on top of the solid).
        const feet = actor.y + actor.h;
        if (feet > s.y + 4) {
          actor.x = prevX;
          actor.vx = 0;
          break;
        }
      }
    }

    if (actor.onStair) {
      const t = Math.max(0, Math.min(1, (actor.x + actor.w / 2 - actor.onStair.x) / actor.onStair.w));
      const rampFeetY = actor.onStair.yAtX0 + (actor.onStair.yAtX1 - actor.onStair.yAtX0) * t;
      const targetFeetY = crouchHeld ? actor.stairEntryY : rampFeetY;
      actor.y = targetFeetY - actor.h;
      actor.vy = 0;
      actor.onGround = true;
      return;
    }

    // Vertical movement + floor/ceiling collision. Solids can legitimately
    // stack (a rooftop block sits above the street-level ground strip), so
    // resolution must pick the NEAREST surface crossed by this step's sweep
    // rather than whichever solid happens to be last in the array.
    const prevY = actor.y;
    const rawNewY = actor.y + actor.vy * dt;
    actor.onGround = false;

    if (actor.vy >= 0) {
      let landOnY = null;
      for (const s of this.allSolids()) {
        if (!(actor.x < s.x + s.w && actor.x + actor.w > s.x)) continue;
        const feetPrev = prevY + actor.h;
        const feetNew = rawNewY + actor.h;
        if (feetPrev <= s.y + 0.5 && feetNew >= s.y) {
          if (landOnY === null || s.y < landOnY) landOnY = s.y;
        }
      }
      if (landOnY !== null) {
        actor.y = landOnY - actor.h;
        actor.vy = 0;
        actor.onGround = true;
      } else {
        actor.y = rawNewY;
      }
    } else {
      let ceilingBottomY = null;
      for (const s of this.allSolids()) {
        if (!(actor.x < s.x + s.w && actor.x + actor.w > s.x)) continue;
        const bottom = s.y + s.h;
        if (prevY >= bottom - 0.5 && rawNewY <= bottom) {
          // Head collision against the underside (spec section 5/6).
          if (ceilingBottomY === null || bottom > ceilingBottomY) ceilingBottomY = bottom;
        }
      }
      if (ceilingBottomY !== null) {
        actor.y = ceilingBottomY;
        actor.vy = 0;
      } else {
        actor.y = rawNewY;
      }
    }
  }

  isGroundedAt(x, y, w, h) {
    const probe = { x, y: y + 1, w, h };
    return this.allSolids().some((s) => this._overlaps(probe, s));
  }

  // Horizontal ray test used by ranged AI to know if its line of fire to the
  // target is blocked by solid/destructible cover (spec section 21/25).
  lineOfSightBlocked(fromX, toX, y, ignore = null) {
    const lo = Math.min(fromX, toX);
    const hi = Math.max(fromX, toX);
    for (const s of this.bulletBlockers()) {
      if (s === ignore) continue;
      if (y >= s.y && y <= s.y + s.h && s.x < hi && s.x + s.w > lo) return true;
    }
    return false;
  }

  _overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
