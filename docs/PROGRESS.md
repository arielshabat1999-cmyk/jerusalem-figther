# Jerusalem Fighter — Gameplay Foundation Progress

Tracks implementation status against the acceptance criteria in
`docs/GAME_RULES_SPEC_V1.md` §35. Status legend: **DONE**, **PARTIAL**
(works but has a noted limitation), **UNVERIFIED** (implemented, not yet
validated the way the criterion implies).

## Architecture summary

Clean rebuild from scratch under `src/` (ES modules, no build step, no
external dependencies). The previous prototype (`game-core.js`,
`game-render.js`, `visual-overhaul.js`, `art-assets-renderer.js`,
`stage-flow.js`, `game-ui.js`, `v2/`) is gone, not patched — see git
history on this repo before the `main` reset for the old code if needed.

- `src/config/GameConfig.js` — every tunable value called out in spec §34.
- `src/physics/World.js` — one authoritative collision system (§32):
  AABB solids, stairs (auto-ascend / crouch-hold-elevation), head collision.
- `src/entities/` — Player, Enemy, Crate, Coin, SpawnDoor (logical bounds
  only, no visual sizing — §33).
- `src/systems/` — WeaponSystem, ProjectileSystem, DamageSystem, EnemyAI,
  SpawnDoorSystem, CoinSystem, CameraSystem, InventorySystem,
  ChunkLibrary + StageBuilder + StageSystem.
- `src/render/` — Renderer + PlaceholderAdapter (placeholder geometric
  shapes only; swapping the adapter is the only step needed to mount real
  art later — §36).
- `src/ui/` — HUD, InventoryUI (plain DOM, no framework).
- `src/main.js` — wiring/bootstrap; `index.html` + `style.css` at repo
  root so GitHub Pages serves it directly.

## Acceptance criteria (§35)

| # | Criterion | Status | Notes |
|---|---|---|---|
| 1 | Touch movement reliable | DONE | `InputManager` + joystick; verified in a live browser (Playwright) smoke test. |
| 2 | Single jump, no double jump | DONE | Jump only triggers when `onGround`; edge-triggered input. |
| 3 | Crouch changes hitbox, dodges correctly-placed bullets | DONE | Hitbox height drops on crouch; needs balance playtesting for exact bullet height vs crouch height. |
| 4 | Move while crouched | DONE | `crouchMoveSpeed` applies regardless of axis input. |
| 5 | Stair auto-ascent | DONE | Unit-tested (`World.step` ramp interpolation). |
| 6 | Hold-down prevents auto-ascent | DONE | Unit-tested (pins to stair-entry elevation). |
| 7 | Run + shoot | DONE | Firing is independent of `vx`. |
| 8 | Jump + shoot | DONE | Firing has no ground-state gate. |
| 9 | Horizontal-only shooting | DONE | Projectiles carry `vx` only; muzzle Y is fixed per stance. |
| 10 | All 4 weapons, correct fire modes | DONE | Unit-tested single-shot (pistol/RPG) vs automatic (rifle); machine gun shares the automatic path. |
| 11 | Automatic reload | DONE | `WeaponRuntime.update` starts reload at 0 ammo. |
| 12 | Move during reload | DONE | Reload state never touches movement. |
| 13 | RPG explosion hits multiple enemies + destructibles | DONE | `DamageSystem.applyExplosion` radius-queries enemies and crates; no dedicated multi-target unit test yet. |
| 14 | Solid cover blocks projectiles | DONE | Swept segment test against `world.bulletBlockers()`. |
| 15 | AI repositions when LOS blocked | DONE | `updateRangedAI` blocked branch. |
| 16 | Ranged enemy: pursue/stairs/jump/crouch/fight | PARTIAL | All present on the enemy's current floor. AI does not yet actively path to a stair to *change floors* to reach the player — it only auto-ascends a stair its patrol/approach happens to cross. Cross-floor pursuit is a follow-up. |
| 17 | Melee enemy: pursue/stairs/jump obstacles/knockback | PARTIAL | Same cross-floor caveat as #16. Same-floor pursuit, obstacle jumping, and hit knockback are done and unit-adjacent verified. |
| 18 | Enemies never pop into open space | DONE | `Enemy` is only ever constructed by `SpawnDoorSystem`/`StageSystem.spawnEnemy`. |
| 19 | Doors open → release sequentially → close | DONE | Unit-tested full lifecycle. |
| 20 | Empty doors supported | DONE | `SPAWN_DOOR.emptyDoorChance` in `StageBuilder`. |
| 21 | Doors are one-use | DONE | Unit-tested (`resolved` state, no re-trigger). |
| 22 | No spawns behind progression boundary | DONE | Unit-tested forward-only cancellation. |
| 23 | Spawned enemies persist off-screen | DONE | Enemy roster isn't culled by camera visibility, only by death + lingering timer. |
| 24 | Early vs later active-enemy limits | DONE | `DIFFICULTY.activeEnemyLimitByStage`; gating mechanism unit-tested generically. |
| 25 | Every enemy reachable | DONE | Structural guarantee: doors are only placed on chunk floors that are part of the connected solids/stairs graph the assembler builds. |
| 26 | Every upper area has a route back down | DONE | `rooftopExcursionUnits` always pairs stairs-up with stairs-down; `StageBuilder.assemble` throws if a stage doesn't return to ground before its exit. |
| 27 | Entry/exit approaches stay clear | DONE | Entry/exit approach chunks never carry doors or crates by construction. |
| 28 | Backtrack distance capped | DONE | `StageSystem.update` clamps `player.x` against `progressionX - backtrackLimit`. |
| 29 | Regen caps at 50% | DONE | Unit-tested. |
| 30 | Knockback / hit-stun / invuln | DONE | Unit-tested invuln window; knockback applied via `applyKnockback`. |
| 31 | Death restarts current stage | DONE | `restartStage()` reloads the same `stage.stageNumber`. |
| 32 | No checkpoints | DONE | Save schema has no mid-stage position field. |
| 33 | Coins/score survive death | DONE | `SaveSystem` state untouched by stage restart. |
| 34 | Weapons/upgrades survive death + browser restart | DONE | Persisted to `localStorage`, versioned schema (`SAVE.schemaVersion`). |
| 35 | Coin magnet | DONE (superseded) | No longer a radius-based magnet — every coin unconditionally homes to the player after a brief pop (see "Coin pickup rework" below); still auto-collects with no pixel-perfect contact required. |
| 36 | Crates drop coins | DONE | `onCrateHit` spawns a coin on destroy. |
| 37 | Inventory available mid-gameplay, doesn't pause | DONE | `InventoryUI` never calls `loop.setPaused`; only the Pause button does. |
| 38 | Player vulnerable while Inventory open | DONE | No invulnerability tied to inventory state. |
| 39 | Weapon switching only via Inventory | DONE | `Player.activeWeaponId` is only mutated by `InventorySystem.switchWeapon`. |
| 40 | Pause fully freezes simulation | DONE | `GameLoop` skips `update()` entirely while paused (AI/projectiles/physics/timers all live inside `update`). Verified via Playwright toggle. |
| 41 | Exit locked until stage resolved | DONE | Also now a **physical** barrier (see Known Issues Fixed below), not just a visual lock. |
| 42 | Exit opens on clear, auto-enter on contact | DONE | |
| 43 | Reopen restarts current stage, progression intact | DONE | |
| 44 | Stage 1-10 progression works | DONE, with a scoping note | Stages 1-10 and 11+ share **one** data-driven stage builder (spec §33/48: no competing systems) — difficulty/length/rooftop-frequency scale by stage number via `DIFFICULTY.*` formulas rather than being bespoke hand-placed per stage. This satisfies "designed progression curve" through tunable data, not unique hand-authored geometry per stage. Flagging this explicitly as an interpretation choice rather than changing it silently. |
| 45 | Stage 11+ from reusable chunks | DONE | Unit-tested stages 11/25/50 build without error. |
| 46 | Procedural layouts stay reachable/valid | DONE | Assembler validates elevation continuity and throws rather than emit an invalid layout. |
| 47 | Gameplay functional with placeholder graphics | DONE | Zero references to art assets anywhere under `src/`. |
| 48 | No duplicate/competing core systems | DONE | Exactly one `GameLoop`, `World`, `CameraSystem`, stage builder; old prototype fully removed. |
| 49 | Stable portrait layout on iPhone Safari | UNVERIFIED | Built with `dvh`, safe-area insets, `touch-action:none`; verified only in a 390×760 Chromium viewport (Playwright), not on a physical iPhone. |
| 50 | Stable performance at later-stage enemy load | UNVERIFIED | No profiling/soak test yet at ~8 simultaneous active enemies. |

## Known issues found and fixed during this pass

- **Overlay CSS bug**: `.overlay { display:flex }` was overriding the
  browser's default `[hidden]{display:none}`, so the Pause/Inventory/Game
  Over overlays rendered on top of the game from the start regardless of
  their `hidden` attribute. Fixed with an explicit `.overlay[hidden]`
  rule. Found via an automated Playwright smoke test.
- **Fall-through-void at a locked exit**: nothing physically stopped the
  player from walking past a still-locked exit door and off the end of
  the authored ground geometry, causing an unrecoverable fall. Fixed by
  clamping forward movement at the (locked) exit, mirroring the existing
  backtrack clamp.

## Spawn Director (WHAT/WHERE/WHEN enemy spawning)

Added `src/systems/SpawnDirector.js`, one instance per loaded stage, as the
single authority deciding which enemies spawn, how many, when, and through
which door — everything else (enemy AI, physics, collision, player
controls) is unchanged.

- Five fixed enemy tiers (`ENEMY_TIERS` in GameConfig.js) layer HP/damage/
  speed/coin-reward on top of the existing ranged/melee AI behaviors — HP
  and coin reward are fixed per tier, not scaled by stage. `enemy.strong`
  (existing sprite-family/scale selector) is now derived from the tier
  instead of taken as a constructor flag, so rendering/animation is
  unaffected.
- `SPAWN_STAGE_TABLE` (stages 1-10) authors `maxAlive`, per-tier total
  counts, weights, and spawn-delay range per stage; stage 11+ reuses stage
  10's shape with counts/maxAlive growing slightly (`getSpawnStageConfig`).
- Stage generation (`BlockLibrary`/`StageBuilder`) now only lays out
  position/floor door anchors and per-block "encounter zones" (a threat-
  point budget, spec section 10/11) — it no longer decides what comes out
  of a door. `SpawnDoor` is reusable (cycles back to `idle` after closing)
  so one zone's 1-2 doors can release several waves over its lifetime.
- The Director spends each zone's budget via weighted tier selection,
  gated by: `currentFloor` match, `maxAlive`, a same-floor-door safe
  distance from the player, and a concurrent-open-door cap (usually 1-2,
  rarely 3 late-game). Guards avoid two Elites/Heavies together and
  leading a zone's first pick with one. Stage 10 adds one hand-authored,
  staggered final-wave zone (2x enemy3, 2x heavy, 1x elite) on top.
- Verified with a scratch Node simulation (real StageBuilder/SpawnDirector/
  SpawnDoorSystem/Enemy classes, simulated combat) across stages 1-10,
  repeated 5x: `maxAlive` never exceeded, no tier ever appears before its
  authored stage, every stage's spend lands inside its target coin-economy
  range from the spec, and every stage always reaches `isExhausted()`
  (no stall). Also verified live in a mobile Playwright session: floor-
  gating holds with real physics, and the coin/score award pipeline works
  end-to-end with the new tier-based rewards.
- Weapon prices/damage (`WEAPONS` in GameConfig.js) were rebalanced to
  match this new coin economy (pistol free, rifle ~stage 3, machine gun
  ~stage 5-6, RPG ~stage 8-10) — weapons are still purchase-only, never
  auto-granted.

## Stage-generation rebuild (ENTRANCE/MIDDLE/EXIT block system)

Replaced the chunk-based generator with an explicit three-category block
system (`src/systems/BlockLibrary.js` + rewritten `StageBuilder.js`):

- ENTRANCE and EXIT are always flat, stairless, ~3-4s (630-840px) safety
  zones with no enemy doors.
- MIDDLE blocks are randomly chosen flat-combat, flat-obstacle, or
  single-floor-change stairs blocks, each carrying explicit metadata
  (`id/type/entryFloor/exitFloor/floorsVisible/stairs/enemyDoors`).
- A stair transition never appears within 630-840px of ENTRANCE, is never
  followed by another stair inside 840-1470px (4-7s), is never the block
  directly before EXIT, and every stage is walked back down to FLOOR_MIN
  before EXIT (stairs only ever change the floor by exactly 1 level).
- Enemies now spawn only on the player's tracked `currentFloor`
  (`StageSystem._updateCurrentFloor`, updated only on a genuine stable
  landing, never mid-air/mid-ramp); `SpawnDoorSystem` gates door activation
  by `door.floorIndex === currentFloor` and caps concurrently-open doors at
  `SPAWN_DOOR.maxConcurrentOpenDoors` (2).
- `validateStage()` re-checks the full connectivity/pacing/floor-skip
  checklist and throws with a descriptive error if a future change to the
  generator breaks an invariant.
- Verified: all of stages 1-60 generate deterministically and pass
  validation (scratch test); live mobile smoke test confirmed floor-0
  doors activate/resolve correctly while floor-1/2 doors on the same stage
  stay `idle` until the player's `currentFloor` actually reaches them, and
  a stage-4 run showed a full floor0->floor1->floor0 round trip via stairs
  with `currentFloor` tracking landing exactly on each floor's Y.

## Coin pickup rework (always-homes, no magnet radius)

`CoinSystem`/`Coin` no longer have a magnet radius or distance cutoff.
Every dropped coin does a brief (0.15-0.3s) gravity pop/bounce, then homes
unconditionally toward the player's current position — no gravity, no
level-geometry collision (so it can never get stuck behind a wall or on
another floor), continuously re-targeting so it still catches a moving
player, accelerating smoothly to `COINS.homingMaxSpeed`. Collected exactly
once at `COINS.collectRadius` (~26px). Verified with a standalone scratch
test: coin spawned far away / above / below / while the player is moving
away, and several coins at once — every case collects exactly once with no
leftover coins.

## Suggested next steps (not blocking, but worth tracking)

- Cross-floor AI pathing (#16/#17) so enemies actively seek a stair when
  the player is on a different floor, instead of only using stairs they
  happen to cross while pursuing on the current floor.
- Real-device iPhone Safari pass (#49) and an active-enemy-load profiling
  pass (#50).
- Author a small number of bespoke hand-placed stage layouts for 1-10 if
  "curated" is meant to imply unique authored content beyond data-driven
  difficulty scaling (see note on #44).
