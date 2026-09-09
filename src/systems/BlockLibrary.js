import { LEVEL } from '../config/GameConfig.js';
import { streetChunk, stairsChunk, elevatedCombatChunk, obstacleChunk, ELEVATION_GROUND, ELEVATION_FLOOR2, ELEVATION_ROOF } from './ChunkLibrary.js';

// The three-floor gameplay ceiling: FLOOR1 = street, FLOOR2 = upper
// floor/balcony, FLOOR3 = rooftop. These are plain aliases of
// ChunkLibrary's elevation constants — "floor" and "elevation" are the same
// index throughout this codebase, there is no separate 1-based numbering to
// keep in sync.
export const FLOOR_MIN = ELEVATION_GROUND;
export const FLOOR_MAX = ELEVATION_ROOF;
export const FLOORS = [ELEVATION_GROUND, ELEVATION_FLOOR2, ELEVATION_ROOF];

export function randRange(rng, [min, max]) {
  return min + rng() * (max - min);
}

// Every block factory below returns { chunk, meta }. `chunk` is the plain
// geometry shape StageBuilder's assembler already knows how to stitch
// together (width/entryElevation/exitElevation/solids/stairs/doors/crates) —
// doors are pure position/floor anchors now, never carrying enemy specs;
// what comes out of a door is entirely SpawnDirector.js's runtime decision
// ("the Spawn Director only decides WHAT spawns, WHERE, and WHEN"). `meta`
// is the explicit, human-readable block-metadata record
// (id/type/entryFloor/exitFloor/floorsVisible/stairs/enemyDoors) plus, for
// combat blocks, an `encounterZone` record that StageBuilder turns into an
// absolute-coordinate zone for the Director.
let nextBlockSeq = 1;
let nextDoorSeq = 1;

function makeMeta({ type, entryFloor, exitFloor, stairsMeta = [], doorFloors = {}, encounterZone = null }) {
  return {
    id: `${type}_${nextBlockSeq++}`,
    type,
    entryFloor,
    exitFloor,
    floorsVisible: Array.from(new Set([entryFloor, exitFloor])).sort(),
    stairs: stairsMeta,
    enemyDoors: { [ELEVATION_GROUND]: [], [ELEVATION_FLOOR2]: [], [ELEVATION_ROOF]: [], ...doorFloors },
    encounterZone, // { doorIds, floor, enemyBudget } | { doorIds, floor, fixedComposition } | null — startX/endX filled in by StageBuilder
  };
}

// ENTRANCE: flat, no stairs, no combat, ~3-4s of clear traversal. Never a
// door, and — despite crateOffsets existing as a chunk option — never a
// prop here either: every crate StageSystem creates is added to
// world.dynamicSolids and physically blocks movement regardless of its
// destructible flag, so placing one in the one block explicitly meant to
// guarantee unobstructed traversal would silently wall the player in right
// at stage start. Kept empty on purpose.
export function buildEntranceBlock(rng) {
  const width = randRange(rng, LEVEL.entranceWidthRange);
  const chunk = streetChunk(width, ELEVATION_GROUND, {});
  return { chunk, meta: makeMeta({ type: 'entrance', entryFloor: ELEVATION_GROUND, exitFloor: ELEVATION_GROUND }) };
}

// EXIT: flat, no stairs, no new enemies, ~3-4s clear approach to the exit
// door.
export function buildExitBlock(rng) {
  const width = randRange(rng, LEVEL.exitWidthRange);
  const chunk = streetChunk(width, ELEVATION_GROUND, {});
  return { chunk, meta: makeMeta({ type: 'exit', entryFloor: ELEVATION_GROUND, exitFloor: ELEVATION_GROUND }) };
}

const FLAT_WIDTH_RANGE = [420, 640];

// A same-floor MIDDLE block (traversal, an optional encounter zone with one
// door — or two for a "harder encounter" — and/or breakable/solid cover
// props). `enemyBudget` (threat points) is computed by StageBuilder from
// the stage's total authored budget — this factory only lays out the
// geometry and door positions.
const BREAKABLE_TYPES = ['crate', 'barrel_a', 'barrel_b', 'barrel_c', 'sack'];
const SOLID_COVER_TYPES = ['obstacle', 'cart'];

export function buildFlatMiddleBlock(rng, floor, { withCombat, hardEncounter, enemyBudget = 0 }) {
  const width = randRange(rng, FLAT_WIDTH_RANGE);

  const doorSpecs = [];
  if (withCombat) {
    const doorCount = hardEncounter ? 2 : 1;
    const fracs = doorCount === 2 ? [0.35, 0.68] : [0.5];
    for (const frac of fracs) doorSpecs.push({ id: `door_${nextDoorSeq++}`, xOffsetFrac: frac });
  }

  const crateOffsets = [];
  const propCount = Math.floor(rng() * 2);
  for (let i = 0; i < propCount; i++) {
    const xOffset = 100 + rng() * (width - 200);
    const solidCover = rng() < 0.25;
    const type = solidCover
      ? SOLID_COVER_TYPES[Math.floor(rng() * SOLID_COVER_TYPES.length)]
      : BREAKABLE_TYPES[Math.floor(rng() * BREAKABLE_TYPES.length)];
    crateOffsets.push({ xOffset, type, destructible: !solidCover });
  }

  const chunk = floor === ELEVATION_GROUND
    ? streetChunk(width, floor, { doorSpecs, crateOffsets })
    : elevatedCombatChunk(width, floor, { doorSpecs, crateOffsets });

  const doorIds = doorSpecs.map((d) => d.id);
  const doorFloors = doorIds.length ? { [floor]: doorIds } : {};
  const encounterZone = withCombat ? { doorIds, floor, enemyBudget } : null;
  return {
    chunk,
    meta: makeMeta({ type: 'middle_flat', entryFloor: floor, exitFloor: floor, doorFloors, encounterZone }),
  };
}

// A pure-obstacle MIDDLE block (traversal around cover with no enemy door),
// used as an occasional pacing break between firefights.
export function buildObstacleMiddleBlock(rng, floor) {
  const width = randRange(rng, [360, 520]);
  const n = 1 + Math.floor(rng() * 2);
  const offsets = [];
  for (let i = 0; i < n; i++) {
    const xOffset = 120 + i * 150 + rng() * 60;
    const solidCover = rng() < 0.25;
    const type = solidCover
      ? SOLID_COVER_TYPES[Math.floor(rng() * SOLID_COVER_TYPES.length)]
      : BREAKABLE_TYPES[Math.floor(rng() * BREAKABLE_TYPES.length)];
    offsets.push({ xOffset, type, destructible: !solidCover });
  }
  const chunk = obstacleChunk(width, floor, offsets);
  return { chunk, meta: makeMeta({ type: 'middle_obstacle', entryFloor: floor, exitFloor: floor }) };
}

// A MIDDLE stairs transition block: changes the player's active floor by
// exactly one level, never carries an enemy door (keep firefights off the
// stairs themselves).
export function buildStairsBlock(fromFloor, toFloor) {
  const width = LEVEL.stairSpan + 90;
  const chunk = stairsChunk(width, fromFloor, toFloor);
  return {
    chunk,
    meta: makeMeta({
      type: 'middle_stairs',
      entryFloor: fromFloor,
      exitFloor: toFloor,
      stairsMeta: [{ from: fromFloor, to: toFloor }],
    }),
  };
}

// STAGE 10's deliberate final wave: a hand-authored fixed composition — 2x
// enemy3, 2x heavy, 1x elite — spent through 2 doors, staggered by the
// Director rather than dumped at once. This is the one place a block's
// encounter zone bypasses the normal weighted/budget spend in favor of an
// exact, deliberately-authored list. It is guaranteed to spawn in full
// regardless of the stage's remaining tier counts (see
// SpawnDirector._buildBatch) — StageBuilder deducts its cost from the
// normal body's budget upfront so the stage's total spend still lands in
// its authored economy target rather than adding on top.
export const FINAL_WAVE_COMPOSITION = ['enemy3', 'enemy3', 'heavy', 'heavy', 'elite'];

export function buildFinalWaveBlock(rng, floor) {
  const width = randRange(rng, [560, 720]);
  const doorSpecs = [
    { id: `door_${nextDoorSeq++}`, xOffsetFrac: 0.3 },
    { id: `door_${nextDoorSeq++}`, xOffsetFrac: 0.7 },
  ];
  const chunk = streetChunk(width, floor, { doorSpecs });
  const doorIds = doorSpecs.map((d) => d.id);
  const encounterZone = {
    doorIds,
    floor,
    fixedComposition: [...FINAL_WAVE_COMPOSITION],
  };
  return {
    chunk,
    meta: makeMeta({ type: 'middle_final_wave', entryFloor: floor, exitFloor: floor, doorFloors: { [floor]: doorIds }, encounterZone }),
  };
}
