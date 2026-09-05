# Jerusalem Fighter — Art Handoff Pack

This pack consolidates the approved visual direction and implementation assets.

## Locked visual direction
- Stylized Realistic + Premium Arcade.
- Portrait iPhone side-scroller.
- Jerusalem Old City / classic stone alleys as the master environment.
- Cinematic parallax with Jerusalem/Temple Mount skyline in the far background.
- Day → sunset → night progression.
- Male and female selectable protagonists; no scarves on player characters.
- Enemies have varied fictional local-inspired head coverings/scarves and no tactical vests.
- Premium Arcade HUD / Quick Inventory / Pause.
- Rich gameplay props and environmental detail.
- Master-quality source art with mobile-optimized runtime exports.

## Runtime folders
`runtime/characters`, `runtime/enemies`, `runtime/environment`, `runtime/props`,
`runtime/backgrounds`, `runtime/fx`, `runtime/ui`.

## Important
The reference boards are the visual source of truth. Runtime section crops are provided as the
handoff basis. Claude should split/crop them into individual transparent game PNGs/atlases,
preserving the approved look rather than recreating the art in CSS or drawing substitute shapes.
Collision, AI and physics must remain independent from sprite dimensions.
