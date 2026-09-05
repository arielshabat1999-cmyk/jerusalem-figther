# Art Integration Status

Tracks progress against `art-pack/CLAUDE_ART_INTEGRATION_PROMPT.txt`,
`art-pack/README.md`, and `art-pack/asset-manifest.json`.

## Current blocker

The art pack's binary ZIP (actual PNG/WebP sheets) has not been added to
the repository yet — only `art-pack/README.md`, `asset-manifest.json`,
and the integration prompt (text/JSON, no images). **No pixels have been
integrated.** Everything below is the wiring that makes dropping the real
sheets in a mechanical, low-risk step once the ZIP lands, per the
instruction not to block the build.

## Done (pre-ZIP scaffolding)

- **`src/render/AssetRegistry.js`** — central asset registry (art-pack
  rule: "use an asset registry instead of hard-coded paths"). Loads a
  JSON manifest, decodes sheet images once, and resolves
  `"<actorId>.<animState>.<frame>"` sprite keys / `"<actorId>.<animState>"`
  animation keys to `{image, x, y, w, h, anchorX, anchorY}`. Gameplay code
  never imports this — only the render layer does.
- **`src/render/ArtAdapter.js`** — the actual per-asset-group fallback:
  every `draw*` method checks the registry first and falls back to
  `PlaceholderAdapter` individually if that one sprite/animation isn't
  loaded yet. This is what lets integration proceed one group at a time
  (characters → enemies → environment → props → parallax → FX → UI)
  without ever leaving a blank/broken entity on screen.
- **`src/render/AnimationState.js`** — pure state-mapping functions
  (`getPlayerAnimState`, `getEnemyAnimState`) covering all 9 required
  states: idle, walk, run, jump, fall, shoot, crouch, hit, death. Reads
  only existing gameplay fields (`onGround`, `vy`, `vx`, `crouching`,
  `hitStunTimer`, a new `lastFireTimer`/`lastHitTimer`) — no art
  dependency, so this is already correct and won't need touching once
  real art lands.
- **Player gender field** (`player.gender`, `save.data.characterGender`,
  `SaveSystem.setCharacterGender`) — plumbing for the male/female
  character selection the art direction requires. No selection UI yet
  (that's part of the "characters" group, see Next below); defaults to
  `'male'` and is fully persisted.
- **`assets/art/manifest.json`** — valid, currently-empty manifest
  (`sheets: {}, sprites: {}, animations: {}`), plus the
  `assets/art/runtime/{characters,enemies,environment,props,backgrounds,
  fx,ui}/` folder layout mirroring the pack's `requiredRuntimeFolders`,
  ready to receive the extracted ZIP contents.
- Verified: unit tests still pass, and a live-browser (Playwright) smoke
  test confirms the game boots, renders, and responds to input
  identically to before this change — the empty manifest means every
  entity still falls back to the placeholder shapes, so this pass is a
  pure no-visual-regression scaffolding change.

## Sprite/animation key contract (for when the ZIP is extracted)

- Player: `player_male` / `player_female`.
- Enemies: `enemy_ranged`, `enemy_melee`, `enemy_ranged_strong`,
  `enemy_melee_strong`.
- Required animation states per actor: `idle`, `walk`, `run`, `jump`,
  `fall`, `shoot`, `crouch`, `hit`, `death`.
- Props: `prop.<crateType>.idle` (crate `type` field already exists on
  `Crate` entities).
- FX: `fx.coin`, `fx.bullet_player`, `fx.bullet_enemy`, `fx.explosion`.
- Environment/parallax/UI keys are not yet finalized — they depend on how
  the pack's reference sheets are actually cropped, and will be defined
  when that group is integrated.

## Not started (waiting on the ZIP)

- Characters (idle/walk/run/jump/fall/shoot/crouch/hit/death sprite
  sheets for male + female, plus a character-select UI).
- Enemies (same animation set × ranged/melee × normal/strong, varied
  fictional headwear per the art direction, no tactical vests).
- Environment (modular walls/arches/stairs/doors/platforms/rooftops,
  spawn + exit doors, Old City stone-alley set).
- Props (decorative vs. solid-cover vs. breakable vs. traversal — needs a
  `renderKind`/tag per prop so `ArtAdapter` can pick the right sprite
  family; not yet added since no prop art exists to key against).
- Parallax (6-7 layer cinematic background, day/sunset/night, Temple
  Mount skyline layer — current sky is a flat two-stop gradient).
- FX polish (muzzle flash, hit sparks, dust) beyond the functional
  placeholder circles/rects already in `PlaceholderAdapter`.
- Premium Arcade HUD/Quick-Inventory/Pause visual skin (current HUD is
  functional plain CSS from the gameplay-foundation pass).

## Explicitly deferred single assets

None yet — nothing has been attempted and skipped. This section will list
any individual asset that turns out to be technically unsuitable once
real extraction begins, per the "don't block the build" instruction.
