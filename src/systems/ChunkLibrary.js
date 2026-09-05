import { LEVEL } from '../config/GameConfig.js';

// Reusable stage segments (spec section 30). Each chunk factory returns
// geometry relative to x=0 plus connection metadata (entryElevation /
// exitElevation) so the assembler in StageBuilder.js can refuse to place
// two chunks next to each other whose elevations don't match — that is
// what keeps every generated layout traversable.
export const ELEVATION_GROUND = 0;
export const ELEVATION_FLOOR2 = 1;
export const ELEVATION_ROOF = 2;

export function elevationY(elevation) {
  return LEVEL.groundY - elevation * LEVEL.floorHeight;
}

function buildingSolid(x, elevation, w) {
  const y = elevationY(elevation);
  return { x, y, w, h: LEVEL.groundY - y + 400, blocksBullets: true };
}

// Flat segment at a fixed elevation. Optionally carries one spawn door
// and/or crates. Safe to use for entry/exit approaches by passing no door
// and no crates (spec section 4 clear-approach requirement).
export function streetChunk(width, elevation, { door = null, crateOffsets = [] } = {}) {
  const solids = elevation > 0 ? [buildingSolid(0, elevation, width)] : [];
  const doors = door ? [{ xOffset: width * 0.5, elevation, enemySpecs: door }] : [];
  const crates = crateOffsets.map((xOffset) => ({ xOffset, type: 'crate' }));
  return { width, entryElevation: elevation, exitElevation: elevation, solids, stairs: [], doors, crates };
}

// Connects `fromElevation` (chunk's left edge) to `toElevation` (right
// edge) via a ramp plus, on whichever side is elevated, the building mass
// that floor sits on (spec section 5: stairs work consistently, head
// collision against overhead building mass elsewhere in the level).
export function stairsChunk(width, fromElevation, toElevation) {
  const stairSpan = LEVEL.stairSpan;
  const buildingWidth = width - stairSpan;
  const ascending = toElevation > fromElevation;
  const upperElevation = Math.max(fromElevation, toElevation);
  const solids = [];
  let stairX;
  if (ascending) {
    stairX = 0;
    if (upperElevation > 0) solids.push(buildingSolid(stairSpan, upperElevation, buildingWidth));
  } else {
    stairX = buildingWidth;
    if (upperElevation > 0) solids.push(buildingSolid(0, upperElevation, buildingWidth));
  }
  const stairs = [{ x: stairX, w: stairSpan, yAtX0: elevationY(fromElevation), yAtX1: elevationY(toElevation) }];
  return { width, entryElevation: fromElevation, exitElevation: toElevation, solids, stairs, doors: [], crates: [] };
}

// A rooftop/upper-floor combat segment (spec: "rooftops may be short or
// long and can support substantial combat sequences").
export function elevatedCombatChunk(width, elevation, { door = null, crateOffsets = [] } = {}) {
  return streetChunk(width, elevation, { door, crateOffsets });
}

export function obstacleChunk(width, elevation, crateOffsets) {
  return streetChunk(width, elevation, { crateOffsets });
}
