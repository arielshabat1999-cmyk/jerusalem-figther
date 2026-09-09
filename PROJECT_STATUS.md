# Jerusalem Fighter — Project Status

**Canonical repository:** `arielshabat1999-cmyk/jerusalem-figther`
**Canonical branch:** `main` (the only branch that ships)
**Public URL:** https://arielshabat1999-cmyk.github.io/jerusalem-figther/
**Deployment method:** GitHub Pages, "Deploy from a branch" → `main`, root. Static files served directly, no build step. A push to `main` is live within roughly a minute.

There is exactly one deployed game. `main` is it. Any other branch (`claude/gameplay-foundation-spec-staun2`, `artpack-integration`, `graphics-overhaul`, `rebuild-v2`) is not deployed and must not be treated as a second source of truth — merge intentionally into `main` or leave it alone.

## Active systems (all on `main`, all live)

- **Player**: movement, joystick, jump, crouch, stairs, camera — `src/entities/Player.js`, `src/core/InputManager.js`, `src/physics/World.js`, `src/systems/CameraSystem.js`.
- **Enemies**: AI (ranged/melee) in `src/systems/EnemyAI.js`; tier identity (enemy1/enemy2/enemy3/heavy/elite — HP/damage/speed/reward) in `src/entities/Enemy.js`, driven by `EconomyConfig.ENEMY_TIERS`.
- **Animations**: `src/render/ArtAdapter.js` + `assets/art/manifest.json` (player + both enemy families, strong variants included).
- **Weapons / shop / upgrades**: single source of truth `src/config/EconomyConfig.js` (`WEAPONS`, `UPGRADE_EFFECTS`, `UPGRADE_PRICES`). Shop UI in `src/ui/InventoryUI.js`, purchase/upgrade transactions in `src/systems/InventorySystem.js`.
- **Spawn Director**: `src/systems/SpawnDirector.js` — decides WHAT/WHERE/WHEN enemies spawn each tick, gated to the player's current floor, respecting per-stage `maxAlive` and `EconomyConfig.STAGE_COMPOSITION` budgets/weights.
- **Block system**: `src/systems/BlockLibrary.js` (Entrance / Middle-flat / Middle-obstacle / Middle-stairs / Final-wave blocks) assembled by `src/systems/StageBuilder.js` into a 3-floor-capable stage (ground / floor 2 / roof), sharing one door/collision/art convention via `src/systems/ChunkLibrary.js`.
- **Background**: one global backdrop, `#bgLayer` in `index.html`/`style.css` → `assets/art/runtime/backgrounds/global_backdrop.jpg`. Not baked per-block.
- **Save/progression**: `src/core/SaveSystem.js`, versioned schema (`SAVE.schemaVersion`), coins/score/stage/ownership/upgrades persisted in `localStorage['jerusalemFighter.save.v1']`.
- **DEV / balance dashboard**: `?dev=1` → `src/dev/DevPanel.js`, reading/writing the same live config through `src/dev/GameBalance.js`. Invisible to normal players.

## Environment blocks

- **Block 1 (Entrance)**: live — `buildEntranceBlock` in `BlockLibrary.js`. Flat, no stairs, no combat.
- **Block 2+ (Middle, reusable)**: live — `buildFlatMiddleBlock` / `buildObstacleMiddleBlock` / `buildStairsBlock` are the reusable middle blocks StageBuilder draws from per stage; count/mix is generated per stage (`STAGE_GEN` in `GameConfig.js`), not hand-placed per block index.
- **Exit block**: live — `buildExitBlock`. Flat, no new enemies, locked until the stage is cleared.
- **Future blocks**: none planned/stubbed yet; add new factories to `BlockLibrary.js` and they slot into the same assembler automatically.

## Known issues / notes

- The dev dashboard's floor-teleport actions (`GO TO FLOOR 2/3`) set the player's Y directly without checking there's a floor at that X — if used somewhere the target floor doesn't structurally exist yet at the player's current X, the player falls back to ground on the next physics tick. Pre-existing dev-tool behavior, not a gameplay bug.
- Per-tier spawn weights (`STAGE_COMPOSITION[stage].weights`) are real and read by SpawnDirector, but not yet individually editable from the dashboard's Stage tab (only counts/maxAlive are) — not fabricated, just not yet surfaced as a control.
- No screen-shake/hit-stop/animation-speed-multiplier systems exist in this build; the dashboard's Game Feel tab does not fabricate controls for them.

## Last verified public commit

`874d1a9` was live and verified before this session's block/spawn-director port. The port (Entrance/Middle/Exit blocks, 3-floor gating, Spawn Director, encounter zones) is committed and pushed on top of it — see git log on `main` for the current HEAD, and re-verify the public URL after each push per the workflow below.

## Workflow for every future change

1. Work only inside this checkout of `main` (or a worktree tracking it) — never a different branch, never a new repo/folder.
2. Make the smallest correct change to the files the task actually touches.
3. Test locally (a static file server + Playwright is enough; no build step exists).
4. Verify existing gameplay didn't regress.
5. Commit.
6. Push to `main`.
7. Wait for GitHub Pages to redeploy.
8. Open the public URL and confirm the change is actually live (diff the served file against the local one if unsure).
9. Only then is the task done.
