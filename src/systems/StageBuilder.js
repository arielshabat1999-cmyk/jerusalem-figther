import { LEVEL, SPAWN_DOOR, STAGES, STAGE_GEN } from '../config/GameConfig.js';
import { ENEMY_TIER_ORDER, ENEMY_FIRST_STAGE, getStageComposition } from '../config/EconomyConfig.js';
import { streetChunk, stairsChunk, elevatedCombatChunk, obstacleChunk, ELEVATION_GROUND, ELEVATION_FLOOR2 } from './ChunkLibrary.js';

// Deterministic PRNG so a given stage number always builds the same layout
// (needed for stage 11+ to be reproducible/testable, spec section 30) while
// still varying stage-to-stage.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks an enemy tier for one spawn slot from the stage's remaining
// composition budget (economy spec section 7/8/11) — weighted toward
// whichever unlocked tier still has the most left, so the mix trends
// toward the authored per-stage counts by stage end without requiring
// hand-authored weights. Never selects a tier before its intended stage
// (ENEMY_FIRST_STAGE). Falls back to 'enemy1' (always unlocked) in the
// rare case every remaining count has already been drawn down to 0.
function pickTier(rng, stage, remaining) {
  const candidates = ENEMY_TIER_ORDER.filter((t) => stage >= ENEMY_FIRST_STAGE[t] && remaining[t] > 0);
  if (!candidates.length) return 'enemy1';
  const total = candidates.reduce((sum, t) => sum + remaining[t], 0);
  let r = rng() * total;
  for (const t of candidates) {
    r -= remaining[t];
    if (r <= 0) {
      remaining[t] -= 1;
      return t;
    }
  }
  const last = candidates[candidates.length - 1];
  remaining[last] -= 1;
  return last;
}

function pickEnemySpecs(rng, stage, count, remaining) {
  if (rng() < SPAWN_DOOR.emptyDoorChance) return []; // deliberate empty door (spec 23)
  const specs = [];
  for (let i = 0; i < count; i++) {
    specs.push({
      kind: rng() < 0.55 ? 'ranged' : 'melee',
      tier: pickTier(rng, stage, remaining),
    });
  }
  return specs;
}

// Chunks that both require and produce ELEVATION_GROUND, so any number of
// them can be placed back to back without ever breaking connection
// metadata continuity (spec section 30's "impossible layouts" concern).
function groundCombatUnit(rng, stage, remaining) {
  const enemiesHere = 1 + Math.floor(rng() * 2);
  return streetChunk(520, ELEVATION_GROUND, { door: pickEnemySpecs(rng, stage, enemiesHere, remaining) });
}

// Breakable cover (crate/barrel/sack — shootable, drops coins) vs.
// permanent solid-cover (obstacle/cart — blocks but never breaks), per the
// art-pack's decorative/solid-cover/breakable/traversal prop categories.
const BREAKABLE_TYPES = ['crate', 'barrel_a', 'barrel_b', 'barrel_c', 'sack'];
const SOLID_COVER_TYPES = ['obstacle', 'cart'];

function obstacleUnit(rng) {
  const offsets = [];
  const n = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < n; i++) {
    const xOffset = 140 + i * 160 + rng() * 60;
    const solidCover = rng() < 0.25;
    const type = solidCover
      ? SOLID_COVER_TYPES[Math.floor(rng() * SOLID_COVER_TYPES.length)]
      : BREAKABLE_TYPES[Math.floor(rng() * BREAKABLE_TYPES.length)];
    offsets.push({ xOffset, type, destructible: !solidCover });
  }
  return obstacleChunk(460, ELEVATION_GROUND, offsets);
}

// A full up-and-over excursion: stairs up to floor 2, a combat section on
// that floor, then stairs back down — always self-contained at ground
// level on both ends (spec section 5: every elevated area has a route
// back down).
function rooftopExcursionUnits(rng, stage, remaining) {
  const enemiesHere = 1 + Math.floor(rng() * 3);
  return [
    stairsChunk(LEVEL.stairSpan + 90, ELEVATION_GROUND, ELEVATION_FLOOR2),
    elevatedCombatChunk(480 + rng() * 200, ELEVATION_FLOOR2, { door: pickEnemySpecs(rng, stage, enemiesHere, remaining) }),
    stairsChunk(LEVEL.stairSpan + 90, ELEVATION_FLOOR2, ELEVATION_GROUND),
  ];
}

function buildBodyChunks(stage, rng, remaining) {
  const unitCount = Math.min(STAGE_GEN.unitCountCap, STAGE_GEN.unitCountBase + Math.floor(stage * STAGE_GEN.unitCountPerStage));
  const rooftopChance = Math.min(STAGE_GEN.rooftopChanceCap, STAGE_GEN.rooftopChanceBase + stage * STAGE_GEN.rooftopChancePerStage);
  const chunks = [];
  for (let i = 0; i < unitCount; i++) {
    const roll = rng();
    if (roll < rooftopChance) chunks.push(...rooftopExcursionUnits(rng, stage, remaining));
    else if (roll < rooftopChance + STAGE_GEN.obstacleChance) chunks.push(obstacleUnit(rng));
    else chunks.push(groundCombatUnit(rng, stage, remaining));
  }
  return chunks;
}

// Assembles a linear chunk sequence into flat stage geometry, validating
// that each chunk's entryElevation matches the running elevation left by
// the previous chunk. A mismatch is a bug in a chunk pattern above, not a
// runtime condition to recover from — it must never silently produce an
// unreachable layout.
function assemble(chunks) {
  let cursorX = 0;
  let elevation = ELEVATION_GROUND;
  const solids = [];
  const stairs = [];
  const doorSpecs = [];
  const crateSpecs = [];
  for (const chunk of chunks) {
    if (chunk.entryElevation !== elevation) {
      throw new Error(`Stage chunk connection mismatch at x=${cursorX}: expected elevation ${elevation}, chunk starts at ${chunk.entryElevation}`);
    }
    for (const s of chunk.solids) solids.push({ ...s, x: s.x + cursorX });
    for (const st of chunk.stairs) stairs.push({ ...st, x: st.x + cursorX });
    for (const d of chunk.doors) doorSpecs.push({ x: cursorX + d.xOffset, elevation: d.elevation, enemySpecs: d.enemySpecs });
    for (const c of chunk.crates) crateSpecs.push({ x: cursorX + c.xOffset, type: c.type, destructible: c.destructible });
    cursorX += chunk.width;
    elevation = chunk.exitElevation;
  }
  if (elevation !== ELEVATION_GROUND) {
    throw new Error('Stage sequence must return to ground level before the exit approach');
  }
  return { length: cursorX, solids, stairs, doorSpecs, crateSpecs };
}

// Public entry point. Works identically for curated stages 1-10 and
// indefinite procedural stages 11+ (spec sections 29/30) — there is only
// one stage-building system, difficulty is what scales with `stage`.
export function buildStageLayout(stage) {
  const rng = mulberry32(stage * 7919 + 13);
  const composition = getStageComposition(stage);
  const remaining = { ...composition.counts };
  const entry = streetChunk(LEVEL.entryApproachWidth, ELEVATION_GROUND);
  const body = buildBodyChunks(stage, rng, remaining);
  const exit = streetChunk(LEVEL.exitApproachWidth, ELEVATION_GROUND);
  const layout = assemble([entry, ...body, exit]);

  const baseGround = { x: -200, y: LEVEL.groundY, w: layout.length + 400, h: 2000, blocksBullets: true, texture: 'platform' };
  return {
    stage,
    length: layout.length,
    solids: [baseGround, ...layout.solids],
    stairs: layout.stairs,
    doorSpecs: layout.doorSpecs,
    crateSpecs: layout.crateSpecs,
    entryX: LEVEL.entryApproachWidth * 0.35,
    exitX: layout.length - LEVEL.exitApproachWidth * 0.35,
    activeEnemyLimit: composition.maxAlive,
    isProcedural: stage > STAGES.curatedCount,
  };
}
