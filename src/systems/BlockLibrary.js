import { LEVEL, SPAWN_DOOR, DIFFICULTY } from '../config/GameConfig.js';
import { streetChunk, stairsChunk, elevatedCombatChunk, obstacleChunk, ELEVATION_GROUND, ELEVATION_FLOOR2, ELEVATION_ROOF } from './ChunkLibrary.js';

// The three-floor gameplay ceiling (stage-generation spec section 2):
// FLOOR1 = street, FLOOR2 = upper floor/balcony, FLOOR3 = rooftop. These are
// plain aliases of ChunkLibrary's elevation constants — "floor" and
// "elevation" are the same index throughout this codebase, there is no
// separate 1-based numbering to keep in sync.
export const FLOOR_MIN = ELEVATION_GROUND;
export const FLOOR_MAX = ELEVATION_ROOF;
export const FLOORS = [ELEVATION_GROUND, ELEVATION_FLOOR2, ELEVATION_ROOF];

export function randRange(rng, [min, max]) {
  return min + rng() * (max - min);
}

function pickEnemySpecs(rng, stage, count) {
  if (rng() < SPAWN_DOOR.emptyDoorChance) return []; // deliberate empty door (spec 23)
  const specs = [];
  const strongChance = DIFFICULTY.strongEnemyChance(stage);
  for (let i = 0; i < count; i++) {
    specs.push({ kind: rng() < 0.55 ? 'ranged' : 'melee', strong: rng() < strongChance });
  }
  return specs;
}

// Every block factory below returns { chunk, meta }. `chunk` is the plain
// geometry shape StageBuilder's assembler already knows how to stitch
// together (width/entryElevation/exitElevation/solids/stairs/doors/crates).
// `meta` is the explicit, human-readable block-metadata record the stage-
// generation spec (section 12) asks for — id/type/entryFloor/exitFloor/
// floorsVisible/stairs/enemyDoors — kept separate from `chunk` so gameplay
// geometry never has to be re-derived/inferred from it; it exists for the
// validator and for debugging a generated stage.
let nextBlockSeq = 1;

function makeMeta({ type, entryFloor, exitFloor, stairsMeta = [], doorFloors = {} }) {
  return {
    id: `${type}_${nextBlockSeq++}`,
    type,
    entryFloor,
    exitFloor,
    floorsVisible: Array.from(new Set([entryFloor, exitFloor])).sort(),
    stairs: stairsMeta,
    enemyDoors: { [ELEVATION_GROUND]: [], [ELEVATION_FLOOR2]: [], [ELEVATION_ROOF]: [], ...doorFloors },
  };
}

// ENTRANCE (spec section 1/17): flat, no stairs, no combat, ~3-4s of clear
// traversal. Light decoration only — represented here as a couple of
// non-blocking crate props, never a door and never solid cover that could
// read as "the player is already fighting."
export function buildEntranceBlock(rng) {
  const width = randRange(rng, LEVEL.entranceWidthRange);
  const crateOffsets = rng() < 0.5 ? [width * (0.55 + rng() * 0.2)] : [];
  const chunk = streetChunk(width, ELEVATION_GROUND, { crateOffsets });
  return { chunk, meta: makeMeta({ type: 'entrance', entryFloor: ELEVATION_GROUND, exitFloor: ELEVATION_GROUND }) };
}

// EXIT (spec section 1/17): flat, no stairs, no new enemies, ~3-4s clear
// approach to the exit door.
export function buildExitBlock(rng) {
  const width = randRange(rng, LEVEL.exitWidthRange);
  const chunk = streetChunk(width, ELEVATION_GROUND, {});
  return { chunk, meta: makeMeta({ type: 'exit', entryFloor: ELEVATION_GROUND, exitFloor: ELEVATION_GROUND }) };
}

const FLAT_WIDTH_RANGE = [420, 640];

// A same-floor MIDDLE block (spec section 8 MIDDLE_A/C/E/G generalized
// across whichever floor the player currently occupies): traversal, an
// optional single combat door, occasionally a "harder encounter" second
// door, and/or breakable/solid cover props.
const BREAKABLE_TYPES = ['crate', 'barrel_a', 'barrel_b', 'barrel_c', 'sack'];
const SOLID_COVER_TYPES = ['obstacle', 'cart'];

export function buildFlatMiddleBlock(rng, floor, { stage, withCombat, hardEncounter }) {
  const width = randRange(rng, FLAT_WIDTH_RANGE);

  const doorSpecs = [];
  if (withCombat) {
    const doorCount = hardEncounter ? 2 : 1;
    const enemiesPerDoor = 1 + Math.floor(rng() * 2);
    const fracs = doorCount === 2 ? [0.35, 0.68] : [0.5];
    for (const frac of fracs) {
      doorSpecs.push({ xOffsetFrac: frac, enemySpecs: pickEnemySpecs(rng, stage, enemiesPerDoor) });
    }
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

  const doorFloors = doorSpecs.length ? { [floor]: doorSpecs.map((d) => ({ xOffsetFrac: d.xOffsetFrac })) } : {};
  return {
    chunk,
    meta: makeMeta({ type: 'middle_flat', entryFloor: floor, exitFloor: floor, doorFloors }),
  };
}

// A pure-obstacle MIDDLE block (spec section 8 style variety) — traversal
// around cover with no enemy door, used as an occasional pacing break
// between firefights (spec section 16: "short movement section").
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

// A MIDDLE stairs transition block (spec section 8 MIDDLE_B/D/F): changes
// the player's active floor by exactly one level, never carries an enemy
// door (spec section 16 — keep firefights off the stairs themselves).
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
