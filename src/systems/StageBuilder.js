import { LEVEL, DIFFICULTY, STAGES } from '../config/GameConfig.js';
import {
  FLOOR_MIN,
  FLOOR_MAX,
  randRange,
  buildEntranceBlock,
  buildExitBlock,
  buildFlatMiddleBlock,
  buildObstacleMiddleBlock,
  buildStairsBlock,
} from './BlockLibrary.js';

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

// Builds the randomized MIDDLE-block sequence between ENTRANCE and EXIT
// (stage-generation spec sections 8/9/13). This is the one place that
// decides pacing:
//   - a stair transition never appears less than LEVEL.stairGapRange (4-7s
//     worth of px) after the previous one, or before the entrance (using
//     the same range comfortably covers the looser "first stair only after
//     3-4s" rule too — spec section 3);
//   - stairs are never placed back-to-back (each stair resets the gap
//     counter to 0, so the very next block can't also be a stair);
//   - the last MIDDLE slot before EXIT is never a stair, and never carries
//     an enemy door (spec section 1/9: clear, enemy-free EXIT approach);
//   - the player is always walked back down to FLOOR_MIN before EXIT,
//     because EXIT (and the base-ground solid StageBuilder wraps every
//     stage in) only exists at street level.
function buildBodyBlocks(stage, rng) {
  const unitCount = Math.min(10, 3 + Math.floor(stage / 2));
  const stairChance = Math.min(0.5, 0.12 + stage * 0.025);
  const obstacleChance = 0.2;

  let currentFloor = FLOOR_MIN;
  let pxSinceLastStair = 0;
  let nextStairGap = randRange(rng, LEVEL.stairGapRange);
  const blocks = [];

  for (let i = 0; i < unitCount; i++) {
    const isLastSlot = i === unitCount - 1;
    const roomForStair = !isLastSlot && currentFloor < FLOOR_MAX && pxSinceLastStair >= nextStairGap;

    if (roomForStair && rng() < stairChance) {
      const toFloor = currentFloor + 1;
      const block = buildStairsBlock(currentFloor, toFloor);
      blocks.push(block);
      currentFloor = toFloor;
      pxSinceLastStair = 0;
      nextStairGap = randRange(rng, LEVEL.stairGapRange);
      continue;
    }

    if (!isLastSlot && rng() < obstacleChance) {
      const block = buildObstacleMiddleBlock(rng, currentFloor);
      blocks.push(block);
      pxSinceLastStair += block.chunk.width;
      continue;
    }

    // Never seed a fight directly at the stage exit (spec section 1/9).
    const withCombat = !isLastSlot && rng() < 0.75;
    const hardEncounter = withCombat && rng() < 0.18;
    const block = buildFlatMiddleBlock(rng, currentFloor, { stage, withCombat, hardEncounter });
    blocks.push(block);
    pxSinceLastStair += block.chunk.width;
  }

  // Every stage's EXIT sits at street level - walk back down if the
  // randomized body left the player elevated (spec section 13: "eventually
  // return/continue toward exit configuration").
  while (currentFloor > FLOOR_MIN) {
    const toFloor = currentFloor - 1;
    blocks.push(buildStairsBlock(currentFloor, toFloor));
    currentFloor = toFloor;
  }

  // A stair (forced descent or otherwise) must never be the block
  // immediately before EXIT (spec section 9: "never... stairs directly
  // beside the stage exit").
  if (blocks.length && blocks[blocks.length - 1].meta.type === 'middle_stairs') {
    blocks.push(buildFlatMiddleBlock(rng, currentFloor, { stage, withCombat: false, hardEncounter: false }));
  }

  return blocks;
}

// Validates the full stage-generation spec section 18 checklist. Every one
// of these is also guaranteed structurally by how buildBodyBlocks/assemble
// are written (a stair block can never appear as the last body block, a
// stair block never carries doors, assemble() itself throws on any
// elevation-continuity break) — this function re-checks the same
// invariants explicitly so a future change to the generator that breaks one
// of them fails loudly instead of silently shipping a broken stage, per
// section 18's "if validation fails, do not try to patch broken geometry."
function validateStage(allBlocks, layout) {
  const errors = [];
  const [entrance, ...rest] = allBlocks;
  const exit = rest[rest.length - 1];
  const body = rest.slice(0, -1);

  if (!entrance || entrance.meta.type !== 'entrance') errors.push('missing ENTRANCE block');
  if (!exit || exit.meta.type !== 'exit') errors.push('missing EXIT block');
  if (entrance && (entrance.meta.stairs.length > 0)) errors.push('ENTRANCE must not contain stairs');
  if (exit && exit.meta.stairs.length > 0) errors.push('EXIT must not contain stairs');

  const lastBody = body[body.length - 1];
  if (lastBody && lastBody.meta.type === 'middle_stairs') errors.push('a stair block sits directly beside EXIT');
  if (lastBody) {
    const doorsAtExit = Object.values(lastBody.meta.enemyDoors).some((list) => list.length > 0);
    if (doorsAtExit) errors.push('an enemy door sits directly beside EXIT');
  }

  for (const b of body) {
    if (b.meta.type === 'middle_stairs') {
      const delta = Math.abs(b.meta.exitFloor - b.meta.entryFloor);
      if (delta !== 1) errors.push(`stair block ${b.meta.id} changes floor by ${delta}, must be exactly 1 (no Floor1->Floor3 skip)`);
      const doorsOnStairs = Object.values(b.meta.enemyDoors).some((list) => list.length > 0);
      if (doorsOnStairs) errors.push(`stair block ${b.meta.id} must not carry an enemy door`);
    }
  }

  if (exit && exit.meta.entryFloor !== FLOOR_MIN) errors.push('stage does not return to FLOOR_MIN before EXIT');

  // Continuity between consecutive blocks (assemble() already enforces this
  // by throwing, but re-check here so a validation failure - not a raw
  // exception - is what a bad future change would surface first).
  for (let i = 1; i < allBlocks.length; i++) {
    if (allBlocks[i].meta.entryFloor !== allBlocks[i - 1].meta.exitFloor) {
      errors.push(`block ${allBlocks[i].meta.id} entryFloor does not match previous block's exitFloor`);
    }
  }

  if (layout.length <= 0) errors.push('stage has zero playable length');

  if (errors.length) {
    throw new Error(`Stage generation validation failed:\n - ${errors.join('\n - ')}`);
  }
}

// Assembles a linear block sequence into flat stage geometry, validating
// that each block's entryElevation matches the running elevation left by
// the previous block. A mismatch is a bug in a block factory above, not a
// runtime condition to recover from — it must never silently produce an
// unreachable layout.
function assemble(chunks) {
  let cursorX = 0;
  let elevation = FLOOR_MIN;
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
  if (elevation !== FLOOR_MIN) {
    throw new Error('Stage sequence must return to street level before the exit approach');
  }
  return { length: cursorX, solids, stairs, doorSpecs, crateSpecs };
}

// Public entry point. Works identically for curated stages 1-10 and
// indefinite procedural stages 11+ (spec sections 29/30) — there is only
// one stage-building system, difficulty is what scales with `stage`.
export function buildStageLayout(stage) {
  const rng = mulberry32(stage * 7919 + 13);
  const entrance = buildEntranceBlock(rng);
  const body = buildBodyBlocks(stage, rng);
  const exit = buildExitBlock(rng);
  const allBlocks = [entrance, ...body, exit];

  const layout = assemble(allBlocks.map((b) => b.chunk));
  validateStage(allBlocks, layout);

  const baseGround = { x: -200, y: LEVEL.groundY, w: layout.length + 400, h: 2000, blocksBullets: true, texture: 'platform' };
  return {
    stage,
    length: layout.length,
    solids: [baseGround, ...layout.solids],
    stairs: layout.stairs,
    doorSpecs: layout.doorSpecs,
    crateSpecs: layout.crateSpecs,
    entryX: entrance.chunk.width * 0.35,
    exitX: layout.length - exit.chunk.width * 0.35,
    activeEnemyLimit: DIFFICULTY.activeEnemyLimitByStage(stage),
    statScale: DIFFICULTY.statScaleForStage(stage),
    isProcedural: stage > STAGES.curatedCount,
    blocks: allBlocks.map((b) => b.meta), // explicit per-block metadata (spec section 12), for debugging/tests
  };
}
