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
| 35 | Coin magnet | DONE | `CoinSystem` magnet radius + auto-collect radius; logic-verified, not unit-tested. |
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

## Suggested next steps (not blocking, but worth tracking)

- Cross-floor AI pathing (#16/#17) so enemies actively seek a stair when
  the player is on a different floor, instead of only using stairs they
  happen to cross while pursuing on the current floor.
- Real-device iPhone Safari pass (#49) and an active-enemy-load profiling
  pass (#50).
- Author a small number of bespoke hand-placed stage layouts for 1-10 if
  "curated" is meant to imply unique authored content beyond data-driven
  difficulty scaling (see note on #44).
