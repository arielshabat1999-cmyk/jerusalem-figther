# Final Player Character Reference

This file overrides any earlier player-character reference in the art pack.

## Locked protagonists
- **Male protagonist:** the approved soldier look from the latest corrected reference. Stylized realistic, olive/tactical clothing, combat-ready silhouette, no scarf.
- **Female protagonist:** matching alternate soldier in the same visual language, no scarf.
- These two are the only approved playable-character visual masters.
- Do **not** use the earlier civilian/blue-shirt protagonist variants as final art.
- Do **not** use the old `characters_atlas.png` as final art.

## Claude integration rule
When integrating the supplied art ZIP, treat any conflicting player-character art as superseded by this final reference. Keep gameplay, hitboxes, animation state keys and gender selection independent from visible sprite dimensions.

Required animation states remain: `idle`, `walk`, `run`, `jump`, `fall`, `shoot`, `crouch`, `hit`, `death`.
