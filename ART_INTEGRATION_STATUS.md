# Art Integration Status

## Mobile playtest fixes (post-integration)

Three issues found in a mobile recording were fixed, targeted-tested, and
verified end-to-end:

1. **Player sliding instead of walking/running.** Root cause: only one art
   frame exists per animation state (see "How this differs from the raw
   ZIP" below), so the sprite never changed pose while translating. Fixed
   by mirroring that single pose every other half-step for `walk`/`run`
   only (`Player.gaitPhase`, distance-based so cadence scales with actual
   speed; `ArtAdapter.drawPlayer`) — `idle`/`jump`/`fall`/etc. are
   unaffected, and the mirror is about the same foot anchor already used
   for facing direction, so it never shifts the feet. 4 new deterministic
   tests assert the transform alternates correctly, never mirrors on
   idle, combines correctly with facing-left, and leaves the feet anchor
   pixel-identical between mirrored/unmirrored frames.
2. **Controls too close to the Safari bottom bar.** `#controls`'s bottom
   offset raised by 70px (within the requested 60-80px range), still
   composed with `env(safe-area-inset-bottom)` via
   `calc(max(18px, env(safe-area-inset-bottom)) + 70px)`. Joystick/
   FIRE/INV positions relative to each other and the top HUD are
   unchanged.
3. **Couldn't jump from stairs.** Root cause: `World.step` unconditionally
   re-pinned the actor onto the stair ramp every frame while on its span,
   which clobbered a freshly-set jump velocity back to zero before it had
   any effect. Fixed by folding the ramp into the same sweep-gated
   landing check already used for solids, gated on `vy >= 0` — a jump
   (`vy < 0`) is never fought, so gravity/normal air collision fully take
   over immediately, and the ramp only recaptures the actor once actually
   falling and either close to its surface or crossing it. 6 new
   targeted tests cover jumping from the bottom/middle/top of stairs,
   landing back on the ramp mid-climb, jumping while stationary on
   stairs, and a normal-ground-jump regression check.

No gameplay rule, physics constant, or collision dimension changed —
only the stair-ramp *landing candidate* logic and the player's animation
bookkeeping/render transform.

## player_male run: replaced with a cleaner 4-frame set

Same pattern as idle below, delivered as a single combined image (4 running
poses, no labels this time). Unlike the idle delivery, this one had a real
alpha channel already (background genuinely transparent, confirmed
numerically) — no checkerboard-recovery step needed. Extracted via
connected-component analysis; two crops initially picked up a sliver of the
*neighboring* pose inside their padded bounding box (the neighbor is a
separate component but still fell inside the rectangular crop margin) —
fixed by masking out any pixel belonging to a different component before
saving, not just cropping a rectangle, so no frame can ever contain another
pose's pixels regardless of padding.

Normalized using the *same* scale factor established for the new idle
batch (target standing height ÷ that idle batch's own native pixel height)
rather than recomputing a fresh factor from this image's own resolution -
the engine applies one scale (read from `idle`) to every animation's
canvas uniformly, so `run` has to share idle's real-world-pixels-per-
canvas-pixel ratio to read at the correct size next to it. The result is
naturally shorter than idle on the canvas (~177px vs idle's 208px), which
is correct: a leaning running pose measures less top-to-bottom than
standing upright, not a bug. `assets/art/runtime/characters/player_male/run/`
now has 4 files (was 6); manifest regenerated to match. Verified live
(mobile smoke test) at the correct scale next to an enemy and the
environment.

## player_male idle: replaced again with a cleaner 4-frame set

The `idle` animation was replaced a second time with a higher-resolution,
cleaner 4-frame set (`IDLE_01`-`IDLE_04`) delivered as one combined preview
image. That image had no real alpha channel — it was a flat RGB render of
the 4 (already tightly cropped) characters composited over a light gray/
white checkerboard for preview purposes, plus a text label under each.
Recovered transparency without any dark-pixel/threshold keying: flood-
filled the background starting from the image border, expanding only
through pixels matching the checkerboard's own two known tile colors
(~`#DCDDE1`/`#FDFDFD`) — since that fill can only reach pixels *connected to
the border through checkerboard-colored pixels*, it can never eat into a
white/light element that's actually part of the character (e.g. the flag's
white stripe), no matter how close that color is to a tile color, because
no such connected path exists through the character's silhouette. Verified
by eye: all 4 frames fully opaque, flag patches intact, nothing leaked.

The 4 frames were normalized through the same pipeline as before (256x256
canvas, bottom-center feet anchor at y=244, scaled from their own native
height to the same 208px canvas-space standing height already baked into
walk/run/shoot/etc.), so they read at the same on-screen scale as every
other player_male animation with no other file needing to change.
`assets/art/runtime/characters/player_male/idle/` now has 4 files (was 8);
`manifest.json`'s `player_male.idle.*` entries were regenerated to match.

## Player male: replaced with the approved master animation sheet

The player_male master sheet (a single 1536x1024 image, one character in many
labeled poses — idle/walk/run/aim-shoot/jump/fall/crouch variants/melee/
death/turnaround/gear-reference/weapon-reference panels) came with a real,
already-clean per-character alpha channel baked in (confirmed by inspecting
the alpha channel directly: background fully transparent, every pose already
an isolated opaque silhouette). No background-removal/thresholding of any
kind was needed or performed — every runtime pixel is exactly as authored.

Extraction used connected-component analysis on that existing alpha (not a
uniform grid) to find each individual pose's real bounds, with an evidence-
based (pixel-area-ratio) fallback only for the few frames that visually
touch a neighbor. Cross-checked every section against the source image by
eye. **Several sections' "(N frames)" labels overstate what's actually
drawn** — confirmed by direct visual recount, not just an extraction
artifact — so the shipped counts are lower for those:

| animation | labeled | shipped | note |
|---|---|---|---|
| idle | 8 | 8 | matches |
| walk | 8 | 6 | only 6 distinct poses drawn; 1 disconnected fragment discarded |
| run | 8 | 6 | only 6 distinct poses drawn |
| shoot | 8 | 7 | 8 poses drawn, but the 8th has the rifle/muzzle-flash on the wrong side (inconsistent with the other 7 and with idle/walk/run facing) - excluded rather than shipped inconsistent |
| jump | 6 | 4 | only 4 distinct poses; the jump/fall boundary in the source is ambiguous, resolved by eye |
| fall | 6 | 5 | only 5 distinct poses |
| crouch_idle | 6 | 6 | matches |
| crouch_walk | 8 | 8 | matches |
| crouch_shoot | 6 | 6 | matches |
| hit | 6 | 5 | only 5 distinct poses |
| death | 6 | 4 | only 4 distinct poses (2 falling + 2 lying down) |
| melee | 6 | 6 | matches; **extracted but not wired into gameplay** - the game has no player melee-attack state, per spec "only use melee/prone if the game state supports them" |

Not extracted at all (reference-only panels, explicitly out of scope): head
expressions, gear-details close-ups, weapons reference, turnaround (8
angles), and the "EXTRA" panel's suggested FX icons. The "PRONE (6 FRAMES)"
label in that EXTRA panel is also inaccurate - only **one** prone pose
actually exists in the source, not six, so prone was skipped entirely
rather than fabricating 5 more frames from a single image (the game has no
prone state either).

Every shipped frame was visually inspected (individually and via per-
animation contact sheets) for: full transparency, no leaked neighboring
body parts, an intact Israeli flag patch, an uncropped weapon/barrel, and a
visible walk/run leg cycle. Muzzle position for `shoot`/`crouch_shoot` was
measured (not estimated) from the actual art - rightmost opaque pixel in
the chest-height band, cross-checked against the frames that show a muzzle
flash - and is now in `MUZZLE.shoot`/`MUZZLE.crouch_shoot` (`GameConfig.js`).

**Runtime asset location:** `assets/art/runtime/characters/player_male/<state>/*.png`
(69 individual PNG files, one per frame, never packed into a sheet - loaded
via `AssetRegistry`'s standalone-`file` sprite support added earlier this
pass). **Manifest:** integrated directly into the game's existing single
`assets/art/manifest.json` (as `player_male.<state>.<n>` sprite/animation
entries) rather than a separate `player_male_manifest.json`, since that's
the one file `AssetRegistry` actually loads — a second manifest the engine
never reads would just be dead documentation. Say the word if a standalone
copy is still wanted for reference alongside it.

`player_female` is untouched (no female master sheet was part of this
delivery) — she still renders on the same approved sprites as before. Her
`crouch_idle`/`crouch_walk`/`crouch_shoot` states are aliased to her
existing single `crouch` animation so the new 3-way crouch split
(`AnimationState.getPlayerAnimState`) doesn't regress her rendering.

## Character-scale + muzzle-origin architecture (this pass)

Two long-standing visual bugs are now fixed at the code/config level,
using the current stable, already-integrated sprites — no sprite
extraction was touched (see "Player art on hold" below for why):

1. **Scale consistency.** `player_male`, `player_female`, and every enemy
   family were each extracted from a different source sheet at a
   different native pixel-per-character size (male idle 58px tall vs.
   female idle 42px tall vs. enemies 58-74px tall), and `ArtAdapter` drew
   every sprite at that raw native size — so the female character in
   particular read as visibly shorter than the male and than enemies.
   Fixed with `CHARACTER_SCALE` (`src/config/GameConfig.js`): every actor
   is now scaled, around its existing bottom-center anchor, from its own
   idle frame's native height to one shared `targetHeightPx`
   (`ArtAdapter.getActorScale`, cached per actor). "Strong"/heavy enemy
   variants get an extra `heavyMultiplier` on top so they still read as
   intentionally bigger. Only the destination draw size changes — the
   source crop is never resampled, and collision hitboxes
   (`PLAYER.standHeight`/`crouchHeight`, enemy `w`/`h`) are completely
   untouched.
2. **Muzzle origin.** `Player._muzzleSpawn` used to derive the projectile
   spawn point purely from the tiny collision box (`this.x/y/w/h`), which
   put both the bullet and the rendered muzzle-flash effect (`main.js`
   spawns it at that same spawn point) near the player's center instead
   of the rifle. Fixed with a `MUZZLE` anchor table (`GameConfig.js`) keyed
   by pose (idle/walk/run/jump/fall/crouch/shoot), each entry a height
   fraction of the shared visual height plus a forward offset in the
   facing direction, mirrored automatically for `facingDir === -1`.
   `_muzzleSpawn` picks the crouch anchor specifically when grounded +
   crouching (the one pose where `AnimationState.getPlayerAnimState`
   shows the crouch sprite instead of the shoot sprite while firing) so
   the anchor always matches whatever pose is actually on screen.

11 new targeted tests cover both (mirroring for left-facing muzzle
offsets, crouch/airborne pose selection, male/female/enemy sharing the
same on-screen height, heavy enemies scaling up on top of that, and the
source crop never being distorted). All 20 pre-existing tests
(unit/stair-jump/gait/render-gait) still pass unmodified.

## Renderer is now ready for a separate-PNG-per-frame character pack

`AssetRegistry` supports a second, simpler sprite declaration alongside the
existing shared-sheet-plus-rect one: `{ "file": "path/to/frame.png",
"anchorX", "anchorY", "refH" }`. No `sheets` entry is needed for these —
each file is loaded and drawn as its own standalone image, in full, never
cropped or repacked into an atlas. This is the drop-in shape for a
production pack that ships one runtime PNG per animation frame (per
character per state per frame index), which is the format the next
character delivery is expected in.

`refH` is optional and only matters for `ArtAdapter`'s per-actor scale
normalization: if a delivered frame is a padded fixed-size canvas (e.g.
256x256) rather than a tight crop, its raw pixel height isn't the actual
character height, so `refH` lets the manifest say what that real height
is (e.g. from the pack's own bbox metadata) without requiring any crop of
the file itself. Sprites without `refH` behave exactly as before
(fall back to the sprite's own height) — zero effect on current art.

8 new tests cover the standalone-file path (loads with no pre-declared
sheet, defaults size to the file's natural dimensions, `refH`/anchor
pass-through, missing files are skipped gracefully, legacy sheet+rect
sprites keep working unchanged). All 31 prior tests still pass unmodified.

**No sprite files were replaced by this change** — `manifest.json` and
every runtime PNG are untouched; this is registry/renderer plumbing only,
prepared ahead of the next character-pack delivery per instruction.

Enemy art and `player_female` are unchanged — still whatever was already
approved and integrated before this pass. The male extraction above is the
first sprite set to actually land using the standalone-file registry path;
the same approach (real alpha channel + connected-component extraction +
this manifest format) is ready to reuse whenever equivalent female/enemy
masters arrive.


Tracks progress against `art-pack/README.md`, `art-pack/asset-manifest.json`,
and `art-pack/CLAUDE_ART_INTEGRATION_PROMPT.txt`, using the binary ZIP
(`Jerusalem_Fighter_Art_Handoff_v1.zip`) as the visual source of truth.

Real art is now integrated and playable end-to-end (verified with a live
Playwright smoke test: game boots, background/environment/player/enemy art
all render together with no console errors). Nothing in `src/` was
rewritten to fit the art — the art was extracted and adapted to the
existing gameplay foundation's data (logical hitboxes, AI, spawn/stage
systems are unchanged).

## ✅ Resolved: player characters replaced with the approved soldier design

The civilian-look male/female sprites flagged below as possibly-rejected
have been **replaced**. The user supplied the actual final reference
boards (Israeli-soldier-inspired, olive/tactical gear, visible IDF/flag
patches, full idle/walk/run/jump/crouch/shoot/hit/death animation grids —
15 frames per row for male, 16 for female) and both characters were
re-extracted and re-integrated from that reference:

- Real multi-frame walk/run/idle/crouch/shoot/hit cycles (15-16 frames
  each, not a single pose) plus a proper multi-frame death fall and a
  jump arc split into rising (`jump`) and falling (`fall`) halves — no
  gait-mirroring hack needed anymore since genuine distinct frames exist.
  `Player.gaitPhase` (distance-based) now indexes directly into the real
  cycle via `AssetRegistry.getAnimationFrameAtPhase`, so leg cadence still
  scales with actual speed and freezes solid when idle, but drives real
  frames instead of a mirrored single pose.
- Both characters visibly carry the Israeli flag patch on the sleeve/
  shoulder in the extracted frames, olive/tactical clothing throughout,
  no scarves — matches the approved reference, not the earlier civilian
  look.
- Old single-frame `player_male`/`player_female` sheets, sprites, and
  animations were fully removed from the manifest before writing the new
  ones (not layered on top).
- Verified live in a mobile-Safari-emulated smoke test: both genders
  render correctly in-game (including switching gender mid-session via
  the Inventory), no console errors, flag patch visible on screen.
- 4 render-transform tests were rewritten (the old ones tested the
  now-removed mirror hack) to instead assert: the real cycle advances by
  distance not time, a frozen phase keeps drawing the same frame, idle
  never touches the phase-indexed lookup, and the feet anchor is
  pixel-identical across every frame in the cycle.

Collision boxes, physics, and hitbox dimensions were not touched.

## How this differs from the raw ZIP

Every file in the ZIP's `runtime/` folder turned out to be a "handoff
board" (dark rounded panel background + text labels/titles), not a
pre-cut transparent sprite — despite living in a folder named `runtime`.
Getting real, transparent, tightly-trimmed game sprites out of them
required: background chroma-keying (color-distance based, tuned per
sheet), detecting and stripping title/label text bands, and segmenting
multi-item rows into individual icons. All of that processing happened
outside the repo (scratch scripts, not committed); what's committed under
`assets/art/runtime/**` is the resulting clean, transparent, packed sprite
sheets plus `manifest.json` and `AssetRegistry`/`ArtAdapter` code that
reads them. `*.layout.txt` files next to each packed sheet document the
pixel rects for future re-extraction/maintenance.

## Completed by group

### Characters — DONE (final approved soldier design)
- Male + female, all 9 required states, each with a real multi-frame
  cycle (not a single pose): idle (15/16 frames), walk (15/16), run
  (15/16), jump (split from one launch-to-land arc: rising half is
  `jump`, falling half is `fall`), crouch, shoot, hit, death (a real
  fall-to-ground sequence, plays once and freezes on the last frame
  rather than looping back to standing).
- Source: the user-supplied final reference boards (soldier-look,
  olive/tactical gear, Israeli flag patch visible on the sleeve/shoulder
  in-frame, IDF-inspired equipment), extracted via a fixed-grid slice
  (uniform column pitch per row, content-detected row bands) plus the
  same chroma-key background removal used elsewhere in this pack. This
  **replaced** the earlier civilian-look single-pose extraction
  entirely — old sprites/sheets/animations were deleted before the new
  ones were written, not layered on top.
- Character select: a Male/Female toggle in the Inventory overlay
  (`src/ui/InventoryUI.js`), persisted via `SaveSystem.setCharacterGender`.
  No dedicated character-select *screen* (with the pack's portrait art)
  was built — out of time budget for this pass; the toggle is functional
  but plain.
- No scarves on either character, matching the locked art direction.
- Walk/run cadence is distance-driven (`Player.gaitPhase`, indexed via
  `AssetRegistry.getAnimationFrameAtPhase`) so leg speed tracks actual
  horizontal speed and freezes solid when idle; every other state uses
  the normal clock-driven animation lookup.

### Enemies — DONE (3 of 4 families)
- `shooter` -> `enemy_ranged`, `heavy` -> `enemy_ranged_strong`, `melee` ->
  `enemy_melee` all extracted cleanly: 4 headwear/look variants each,
  picked per-instance via `enemy.id % 4` for visual variety among
  simultaneously active enemies (matches "varied fictional head
  coverings" literally, not just in prose). No tactical vests, confirmed
  visually.
- **`elite` family (-> `enemy_melee_strong`) NOT extracted.** Its dark
  tactical outfit is close enough in color to the panel background that
  every chroma-key attempt (plain distance threshold, tightened
  thresholds, border-connected flood fill) either left a visible
  background residue or ate holes in the character. Tried three
  approaches before stopping — see git history of this file's
  companion scratch scripts if revisiting. `enemy_melee_strong` has no
  manifest entry, so it correctly falls back to `PlaceholderAdapter`'s
  rectangle per-entity (verified: no missing/blank enemies).
- Only one static pose exists per variant (the boards show team-variant
  portraits, not an animation set) — that single pose is registered for
  all 9 required animation states. Enemies visually change facing but not
  pose during walk/run/jump/etc. Documented limitation, not a bug.

### Environment — DONE (core pieces)
- Extracted: wall, arch, stairs, platform, door, 2 window variants, 2
  balcony variants, rooftop (water tanks/antenna) — all clean, no
  chroma-key issues (these are texture-heavy stone renders, very
  distinct from the dark panel background).
- Wired in: solids use `env.wall` (elevated building mass) or
  `env.platform` (the street-level ground strip) based on a new
  `texture` tag on solid rects, tiled to fit; stairs use `env.stairs`
  clipped to the ramp's parallelogram; doors use `env.door`.
- Windows/balconies extracted but **not yet placed** anywhere in
  generated stage geometry — `StageBuilder`/`ChunkLibrary` don't have a
  concept of decorative wall inserts yet. Available in the manifest for
  a future pass.

### Props — DONE (extraction + gameplay wiring)
- 15 individual props extracted: crate, crate_broken, 3 barrel variants,
  sack, market_stall, chair, plant_pot, plants_cluster, lantern,
  awning_fabric, rug, cart, obstacle.
- `Crate` entity gained a `destructible` flag. `StageBuilder` now varies
  generated obstacles between breakable types (crate/barrel/sack — shot
  down, drop coins) and permanent solid-cover types (obstacle/cart —
  block forever), which is the "decorative / solid-cover / breakable /
  traversal" distinction the art pack asked for: breakable and
  solid-cover are both live in gameplay; "traversal" needs no extra code
  since every solid (destructible or not) is already standable-on by the
  existing collision system.
- Decorative-only dressing (market_stall/chair/lantern/awning/rug/plants)
  is extracted and in the manifest but **not yet placed** as
  non-colliding scenery in generated stages — out of time budget.

### Parallax / Backgrounds — DONE, simplified from the pack's intent
- Full composited Day/Sunset/Night Jerusalem skyline scenes (Temple Mount
  dome visible in all three) extracted and wired as a slow-scrolling far
  layer, plus a closer tinted haze gradient layer that shifts per
  lighting state — two layers, not one flat background.
- Lighting state now cycles day -> sunset -> night by stage number
  (`lightingStateForStage` in `GameConfig.js`), including for procedural
  stage 11+.
- **The pack's "6-7 layer cinematic parallax" target was not achieved.**
  The ZIP's `runtime/backgrounds/` files turned out to be a mix of
  mislabeled/bled full-scene crops (see below) plus, in one file, what
  looks like a layer-breakdown *diagram* (Sky/Distant City/Temple
  Mount/Mid Buildings/Rooftops/Foreground as separate images) rather
  than actual separated per-lighting-state layer assets. No genuinely
  separated layer art was found to extract, so this pass uses the
  composited scenes rather than inventing a fake multi-layer split.
- Source-file mislabeling worth knowing about if revisiting: the file
  named `night_master.png` actually contains a clean "SUNSET" scene, and
  `parallax_sunset.png` mostly contains the "Night" scene (moon visible)
  with only a sliver of an unrelated scene on its left edge. The 3 PNGs
  now in `assets/art/runtime/backgrounds/{day,sunset,night}.png` were
  hand-verified by their in-image captions, not by source filename.

### FX — DONE
- All 10 icons extracted cleanly: muzzle_flash, bullet, impact, dust,
  sparks, explosion, smoke, crate_break, coin, hit_effect.
- Wired in: bullets (both factions), coin pickups, RPG explosions, a
  small burst on crate destruction (`fx.crate_break`), a brief
  muzzle_flash on every shot (player and enemy), and a brief hit_effect
  wherever damage actually lands (bullets and melee hits alike).

### UI — NOT extracted graphically this pass
- `hud_and_menus.png` is a dense multi-panel board (top HUD bar, a row of
  7 circular control-button icons, and 3 side-by-side panels for
  Character Select / Stage Clear / Game Over) — far more layout work per
  extracted pixel than any other group, and the existing CSS HUD is
  already functional (not a "rectangles pasted" prototype). Given the
  time already spent getting characters/enemies/environment/props/
  backgrounds/FX working end-to-end, pixel extraction of this sheet was
  deprioritized rather than done poorly.
- No CSS re-skin was applied either (documenting honestly rather than
  claiming a "premium" pass that didn't happen). The HUD/Pause/Inventory
  overlays remain the plain dark-panel CSS from the gameplay-foundation
  pass. This is the single biggest remaining gap against the art
  direction's "Premium Arcade HUD" requirement.

## Gameplay rules — unchanged, verified

- Inventory still never pauses simulation (`InventoryUI` never calls
  `loop.setPaused`); Pause still fully freezes it. Unit tests for spawn
  doors, stairs, head collision, weapon fire modes, and damage/regen all
  still pass unmodified.
- Collision boxes remain independent of sprite bounds throughout — every
  new draw call reads `entity.x/y/w/h` for placement math only and draws
  the sprite at its own authored size, anchored bottom-center for
  characters/props and center for FX.

## Suggested next steps

1. A real character-select screen using the pack's portrait crops.
2. Place decorative props (market stalls, lanterns, rugs, plants) and
   window/balcony wall inserts into generated stage chunks for street
   dressing.
3. UI graphical pass on `hud_and_menus.png`, or at minimum a CSS-only
   "Premium Arcade" re-skin (colors/borders sampled from the pack).
4. Revisit the `elite` enemy family with a manual paint-based
   background removal (outside an automated script) if a real deadline
   requires it in-game rather than as a placeholder.
