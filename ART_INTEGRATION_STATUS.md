# Art Integration Status

Tracks progress against `art-pack/README.md`, `art-pack/asset-manifest.json`,
and `art-pack/CLAUDE_ART_INTEGRATION_PROMPT.txt`, using the binary ZIP
(`Jerusalem_Fighter_Art_Handoff_v1.zip`) as the visual source of truth.

Real art is now integrated and playable end-to-end (verified with a live
Playwright smoke test: game boots, background/environment/player/enemy art
all render together with no console errors). Nothing in `src/` was
rewritten to fit the art — the art was extracted and adapted to the
existing gameplay foundation's data (logical hitboxes, AI, spawn/stage
systems are unchanged).

## ⚠ Open issue: player character art may be superseded

`art-pack/PLAYER_CHARACTERS_FINAL.md` (added after this pass started)
states the approved protagonists are **soldier-look, olive/tactical
clothing**, and explicitly rejects "the earlier civilian/blue-shirt
protagonist variants" as final art. The male/female sprites extracted and
wired in below (from `runtime/characters/{male,female}_master_strip.png`
in the ZIP) show **civilian clothing** — white button-up shirt +
suspenders (male), grey tank top (female), khaki pants on both — which
matches the description of the *rejected* look, not the approved
soldier look.

The corrected reference image was attempted
(`art-pack/PLAYER_CHARACTERS_FINAL_REFERENCE.b64.txt`) but committed
empty/incomplete and then removed — so the actual corrected art is not
yet available anywhere this session can reach. **This needs the real
corrected reference before the character art can be considered final.**
Everything else in this document (enemies, environment, props,
backgrounds, FX) is unaffected and unrelated to this issue.

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

### Characters — DONE
- Male + female, 8 of 9 required states each with real extracted art:
  idle, walk, run, jump, crouch, shoot, hit, death.
- **No dedicated `fall` art**: the source strip ships an unused "Melee"
  pose in that slot instead (the player never melees per the gameplay
  spec, so that frame has no use). `fall` reuses the `jump` sprite — the
  closest airborne pose — per the "keep the closest placeholder for that
  one asset" rule. Documented here rather than silently invented.
- Character select: a Male/Female toggle was added to the Inventory
  overlay (`src/ui/InventoryUI.js`), persisted via
  `SaveSystem.setCharacterGender`. No dedicated character-select *screen*
  (with the pack's portrait art) was built — out of time budget for this
  pass; the toggle is functional but plain.
- No scarves on either character, matching the locked art direction.

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
