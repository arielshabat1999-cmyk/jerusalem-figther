# Jerusalem Fighter — Game Rules Specification v1.0

Status: BASE GAMEPLAY RULES — APPROVED
Purpose: This document defines the gameplay systems and rules only. Art direction, final visual assets, sound design, and visual polish are intentionally out of scope for this phase.

## 1. Product Goal

Build the final gameplay foundation for a portrait-mobile 2D side-scrolling action game. The base must be production-oriented, modular, deterministic where appropriate, and designed so final graphics can later be mounted on top without rewriting core gameplay systems.

The implementation must not be treated as a prototype. Temporary geometric placeholders are acceptable for visuals during this phase, but movement, combat, spawning, level progression, AI, collision, inventory, persistence, and system architecture should be implemented as final systems.

## 2. Platform and Orientation

- Primary target: iPhone / mobile Safari.
- Game is portrait-only.
- Do not build a rotate-device prompt. The game layout itself is designed only for portrait.
- Touch controls are the primary input method.
- Target smooth gameplay at approximately 60 FPS on modern iPhones.
- Desktop keyboard controls may exist only as optional development/debug controls and must not define gameplay behavior.

## 3. Core Game Structure

- The game is a continuous side-scrolling action game divided into stages.
- Player progresses mainly from left to right.
- Stages 1–10 are curated progression stages.
- The game does not permanently end after Stage 10.
- After Stage 10, progression can continue theoretically indefinitely using reusable/procedural stage segments.
- Difficulty rises by stage number.
- There is no time limit.
- The player cannot freely return through the entire level. Backtracking is limited to roughly 20 meters of world distance behind the current progression frontier.
- Previously activated enemies remain alive in the world until defeated even if they move off-screen.
- Unactivated enemies do not exist yet and are created only through spawn doors when those doors are triggered.

## 4. Stage Start and Stage Exit

### Stage Start
- The player begins each stage at an entry door.
- The area around an entry door must be kept clear of blocking stairs, enemies, crates, barrels, and other obstacles.
- The player must have enough clear room to begin moving and fighting normally.

### Stage Completion
- The exit door stays locked until the stage is fully cleared.
- A stage is considered cleared only when:
  1. No active enemies remain alive.
  2. No required spawn door still has enemies waiting to spawn.
- When the stage becomes clear, display an `AREA CLEAR` style message instructing the player to reach the exit.
- Gameplay continues normally after the message.
- Exit door opens when the clear condition is satisfied.
- Entering the open exit door is automatic on contact.
- Around the exit door there must also be a clear approach area without blocking objects or stairs.

## 5. Level Topology

- Levels contain street-level play plus upper floors and rooftops.
- Buildings may include second and third floors.
- Rooftops may be short or long and can support substantial combat sequences similar to street-level gameplay.
- Every enemy spawn location must be physically reachable by the player.
- Every elevated combat area must have a valid route back down to street level.
- No unreachable enemies are allowed.
- No one-way trap areas unless intentionally specified later.
- Every solid world surface blocks movement appropriately.
- Head collision is enabled: the player cannot jump through ceilings, balconies, or other solid overhead geometry.

## 6. Player Controls

### Movement
- One virtual joystick controls horizontal movement, jumping, crouching, and stair behavior.
- Left/right: walk/run horizontally.
- Up: jump.
- Only one jump is allowed per airborne cycle. No double jump.
- Down: crouch while held.
- Crouch is hold-based, not toggle-based.
- Player immediately returns to standing when down is released and there is enough headroom.
- Player can move slowly left/right while crouched.

### Jumping
- Player may fire while jumping.
- No fall damage.
- Player cannot jump through solid ceilings.

### Stairs
- When walking into stairs, player automatically moves up them.
- Holding joystick down while walking across a stair connection forces the player to remain at the current elevation instead of automatically ascending.
- Stairs must work consistently for the player and enemies.

## 7. Player Shooting

- Player fires only horizontally in the direction currently faced.
- No auto-aim.
- No vertical aiming.
- No diagonal aiming.
- Player may fire while running.
- Player may fire while jumping.
- Player may fire from crouch if the weapon and collision geometry allow it.
- Bullets are blocked by solid cover.
- No headshot bonus or location-based damage in v1.

## 8. Weapons

There are four core weapons:

1. Pistol
2. Assault Rifle
3. Machine Gun
4. RPG

### General Weapon Rules
- Ammunition supply is infinite.
- Magazine capacity and reload still matter.
- Reload is automatic when the magazine becomes empty.
- Player can continue moving, jumping, and crouching while reloading.
- Once a weapon is purchased, it permanently belongs to the player.
- Weapon switching is performed only through Inventory.
- Purchased weapons persist across deaths, stages, browser restarts, and future sessions.
- Weapons can be upgraded after purchase.

### Pistol
- Starting/default weapon.
- Lowest overall firepower.
- Single shot per button press.
- Fast reload.
- Moderate accuracy and simple handling.

### Assault Rifle
- Balanced weapon.
- Medium damage.
- Medium magazine.
- Medium-fast rate of fire.
- Holding FIRE produces continuous automatic fire.

### Machine Gun
- Large magazine.
- Fast rate of fire.
- Lower damage per bullet than heavier weapons.
- Holding FIRE produces continuous automatic fire.
- Intended for sustained pressure and crowd control.

### RPG
- One rocket before reload.
- Long reload relative to other weapons.
- Single shot per press.
- Explosion deals area damage to nearby enemies.
- Explosion can destroy destructible crates/barrels/environment objects.
- Player does not take damage from own RPG explosion in v1.

## 9. Weapon Upgrades

After a weapon has been purchased, upgrades may improve properties such as:

- Damage.
- Fire rate.
- Reload speed.
- Magazine size where appropriate.

Upgrade system must be data-driven so values can be balanced later without rewriting weapon logic.

Avoid infinite power scaling that destroys game balance. Upgrade caps should be configurable.

## 10. FIRE Button Behavior

- Pistol: one shot per press.
- Assault Rifle: automatic fire while held.
- Machine Gun: automatic fire while held.
- RPG: one rocket per press.
- FIRE must not auto-aim.
- Shooting always follows facing direction.

## 11. Player Health

- Base balance target: player survives approximately five normal enemy hits.
- Strong enemy attacks may deal enough damage that approximately two strong hits can defeat an unprotected player.
- Exact HP values should be represented as configurable data rather than hard-coded assumptions.

### Health Regeneration
- Automatic health regeneration exists.
- Regeneration can restore health only up to 50% of maximum HP.
- Regeneration begins only after the player has gone a configurable period without taking damage.
- Health above 50% requires healing purchases or future health systems.

### Hit Reaction
- When hit, player receives a small knockback away from the incoming shot/attack.
- Apply a brief hit-stun of approximately 0.2 seconds.
- Follow hit-stun with approximately 0.45 seconds of damage immunity/invulnerability.
- These values must be configurable.
- The purpose is to prevent several overlapping enemy bullets from deleting all health in a single frame.

## 12. Crouching and Bullet Avoidance

- Crouching reduces the player's collision/hitbox height.
- Standard horizontal bullets fired at standing torso height should be capable of passing over a crouched player.
- Melee enemies can still damage a crouched player at close range.
- Crouching is an active defensive mechanic, not cosmetic animation.

## 13. Shield

- Shield is an additional defensive layer before HP.
- Incoming damage depletes shield before health.
- Shield capacity can be purchased/upgraded through Inventory.
- Shield state is persistent where appropriate.
- Exact recharge rules can be tuned later, but do not make shield invalidate the health system.

## 14. Healing Purchases

- Healing can be purchased through Inventory.
- Healing cannot be spammed endlessly during combat.
- Add a configurable cooldown between healing purchases/uses.
- Inventory does not pause the game, so using healing during combat carries risk.

## 15. Death and Restart

- There are no checkpoints.
- On death, restart from the beginning of the current stage.
- Example: dying on Stage 4 restarts Stage 4, not Stage 1.
- Coins already collected remain owned after death.
- Score already earned remains.
- Purchased weapons and upgrades remain.
- Stage layout and spawn logic may reset normally on restart.

## 16. Persistence

Save at minimum:

- Current stage.
- Highest stage reached.
- Total coins.
- Score.
- Purchased weapons.
- Weapon upgrade levels.
- Shield upgrades/state where appropriate.
- Other permanent progression introduced later.

If the browser/game is closed during a stage, reopening resumes from the beginning of that same stage, not the exact world position where the player closed the game.

Use a versioned save schema so future updates can migrate old saves safely.

## 17. Score

- Score is earned primarily from defeating enemies.
- No headshot scoring in v1.
- No mandatory time bonus.
- No timer-based pressure.
- Score persists after death.
- Score should be data-driven per enemy type.

## 18. Coins

Coins are obtained from:

- Defeated enemies.
- Destructible random crates.

### Coin Collection
- Coins appear physically in the world after dropping.
- Coins may bounce/pop slightly on spawn.
- Coins are magnetically attracted toward the player when inside a configurable collection radius.
- Collection becomes automatic once sufficiently close.
- This system should feel fast and satisfying on mobile and should not require pixel-perfect contact.

## 19. Destructible Objects

- Random crates can appear in allowed level positions.
- Crates can be shot and destroyed.
- Crates can drop coins.
- Crates do not drop health in v1.
- Some environmental obstacles, such as wooden barrels or future destructible props, can also be destroyed by gunfire/explosions.
- Destructible objects may sometimes block the player's path and require destruction or jumping.
- Solid cover blocks bullets until destroyed if the object is destructible.
- Non-destructible cover remains solid.

## 20. Enemy Types

The base architecture must support multiple enemy classes. At minimum:

### Ranged Enemy
- Uses horizontal firearm behavior similar to player shooting.
- Cannot aim vertically or diagonally in v1.
- May move while fighting.
- May jump and crouch.
- Can use stairs.
- Can descend from rooftops and pursue the player.

### Melee / Knife Enemy
- Aggressively closes distance to player.
- Runs toward player.
- Can jump over obstacles.
- Can use stairs and rooftops.
- Tries to reach melee range.
- Gunfire pushes this enemy backward with noticeable knockback.

### Strong Enemy Variants
- No dedicated boss is required.
- Strong enemies should create challenge through better combat behavior rather than enormous health pools.
- They may shoot faster, reposition more aggressively, jump, crouch, and evade.
- Avoid enemies that require excessive bullet sponging.

## 21. Enemy AI

### General
- Enemies pursue the player after activation.
- Activated enemies remain active and persistent until defeated.
- Enemies can navigate between street, stairs, upper floors, and roofs when routes exist.
- Enemies may jump over suitable obstacles.
- Enemies must not teleport to solve navigation problems.

### Ranged Combat Behavior
- Enemy seeks a useful horizontal firing line.
- If cover blocks its bullets, enemy should reposition instead of firing forever into a wall.
- Enemy may advance or retreat to maintain a useful combat distance.
- Enemy can shoot while moving/jumping where physically reasonable.
- Enemy can crouch and jump to evade player fire.
- Enemy reaction timing and aggressiveness scale with difficulty.

### Melee Behavior
- Enemy prioritizes closing distance.
- It pursues over navigable terrain.
- It jumps obstacles when needed.
- It receives knockback from player shots.

### Friendly Fire
- Enemy projectiles do not damage other enemies in v1.

## 22. Enemy Death

- Defeated enemy does not disappear instantly.
- Enemy enters death state and remains visible lying on the world surface for several seconds.
- After a configurable delay, body may be removed for performance.
- Coins may spawn from the defeated enemy.

## 23. Spawn Door System

This is a core rule and must be implemented as a first-class system.

### Spawn Principle
- Enemies never visibly pop into existence in open space.
- Enemies enter the world through doors placed in the level.
- Doors may exist at street level, second floor, or third floor.

### Triggering
- A spawn door becomes eligible when it enters the player's active forward screen/activation region.
- When triggered, the door opens.
- One or more enemies may exit.
- Enemies leave sequentially with a short configurable delay between them rather than all spawning in the same frame.
- Door closes afterward.

### Empty Doors
- Some doors may intentionally open and close without spawning an enemy.
- This prevents every door animation from guaranteeing an attack and adds uncertainty.

### One-Time Use
- A spawn door is used only once.
- Once resolved, it cannot spawn another group later.

### Forward-Only Spawning
- New enemy spawns occur only ahead of the player.
- Do not activate new enemies from doors far behind the player.
- If an untriggered spawn opportunity is permanently passed behind the progression boundary, resolve/cancel it safely rather than creating enemies behind the player.

### Already Spawned Enemies
- Once an enemy has exited a door, it remains part of the world until defeated.
- Going off-screen does not delete or reset it.

## 24. Active Enemy Limits

- Early stages: approximately 3–4 simultaneously active enemies.
- Later stages: up to approximately 8 active enemies at once.
- Values must be configurable by stage/difficulty.
- Spawn doors that want to release additional enemies should wait if releasing them would exceed the active limit.
- The system should avoid unfair instant swarms and avoid performance spikes.

## 25. Cover and Projectile Collision

- Solid walls block player and enemy bullets.
- Solid crates/barrels/props can block bullets depending on object type.
- Destructible cover absorbs damage until destroyed.
- Enemy AI should recognize that direct line of fire is blocked and attempt to change position.
- Projectiles should use reliable collision handling so fast bullets do not tunnel through thin geometry.

## 26. Backtracking Rule

- Player may move backward tactically, but only for roughly 20 meters behind the current progression frontier.
- The exact world-unit conversion must be configurable.
- The camera/world boundary should prevent unlimited backtracking.
- This rule must not trap the player in geometry.
- Active enemies may still pursue within the playable range.

## 27. Inventory

The system previously referred to as Shop must be named `Inventory` everywhere in the final gameplay code/UI terminology.

### Behavior
- Inventory is available during gameplay.
- Opening Inventory does NOT pause the game.
- Enemies, bullets, physics, and timers continue.
- Player remains vulnerable while Inventory is open.
- Inventory should be fast to use and designed as an overlay, not a separate paused scene.

### Functions
- View owned weapons.
- Purchase locked weapons.
- Switch active weapon.
- Purchase weapon upgrades.
- Purchase shield upgrades.
- Purchase healing subject to cooldown.

Weapon switching occurs only through Inventory.

## 28. Pause

- A Pause button is permanently available in the top-right area of the portrait UI.
- Pause freezes gameplay simulation completely.
- Pause must stop:
  - Enemy AI.
  - Projectiles.
  - Physics.
  - Spawn timers.
  - Reload timers.
  - Combat timers.
  - World simulation.
- Resume continues safely without time jumps.

## 29. Difficulty Progression

Difficulty should increase mainly through gameplay pressure rather than extreme HP inflation.

Scale factors may include:

- More simultaneous enemies.
- More difficult enemy combinations.
- Shorter reaction delays.
- Higher enemy fire rates.
- More aggressive pursuit.
- Better enemy evasion.
- More complex roof/street layouts.
- Denser spawn sequences.
- More melee/ranged combinations.

Avoid turning later enemies into huge bullet sponges.

### Stage 1–10
- Designed progression curve.
- Introduce systems gradually.
- Increase complexity and enemy count over time.

### Stage 11+
- Continue indefinitely in principle.
- Use reusable level chunks/segments assembled under strict topology rules.
- Every generated segment must remain traversable.
- Every elevated area must remain reachable and have a route back down.
- Door safe zones and spawn rules still apply.
- Difficulty continues scaling with sensible caps where required for fairness/performance.

## 30. Procedural / Reusable Stage Segments After Stage 10

The system should support composing levels from authored chunks such as:

- Street segment.
- Short rooftop segment.
- Long rooftop combat segment.
- Stair transition.
- Second-floor section.
- Third-floor section.
- Obstacle segment.
- Door/spawn segment.
- Exit approach segment.

Chunks must expose connection metadata so impossible layouts cannot be assembled.

Do not generate geometry purely randomly without validating traversal.

## 31. Camera

- Camera primarily follows forward player progression.
- Side-scrolling movement remains readable on portrait display.
- Camera must accommodate vertical movement to upper floors/roofs without abrupt snapping.
- Backtracking boundary is tied to progression logic, not only raw camera position.
- Camera should not reveal newly spawned enemies before their door entrance animation where avoidable.
- Camera behavior must be data-driven/tunable.

## 32. Collision System

The final base should have one authoritative collision system.

Must support:

- Player vs world.
- Enemy vs world.
- Player/enemy ground detection.
- Head collision.
- Stairs.
- Rooftops/platform surfaces.
- Destructible props.
- Bullet vs world.
- Bullet vs actor.
- Explosion radius damage.
- Crouching hitbox change.

Avoid multiple overlapping collision implementations or visual-layer hacks.

## 33. Architecture Requirements

Build the base as maintainable production code, not layered patches.

Recommended separation of concerns:

- Game loop / timing.
- Input system.
- Player controller.
- Weapon system.
- Projectile system.
- Damage/health/shield system.
- Enemy entity system.
- AI system.
- Navigation/stair traversal system.
- Spawn door system.
- Stage system.
- Procedural chunk system for Stage 11+.
- Collision system.
- Camera system.
- Inventory/progression system.
- Save/persistence system.
- UI/HUD system.
- Asset adapter/render system.

Core gameplay must not depend on final artwork dimensions.

Use logical collision bounds separate from visual sprite bounds so graphics can later be replaced without rewriting mechanics.

## 34. Data-Driven Configuration

Values that must be configurable rather than scattered magic numbers include at minimum:

- Player movement speed.
- Crouch speed.
- Jump velocity.
- Gravity.
- Hit-stun duration.
- Invulnerability duration.
- Health regeneration delay/rate/cap.
- Weapon damage.
- Fire rate.
- Magazine size.
- Reload duration.
- Projectile speed.
- RPG blast radius.
- Enemy HP/damage/speed.
- Enemy AI reaction delay.
- Spawn door delays.
- Active enemy limit.
- Coin magnet radius.
- Backtracking distance.
- Inventory healing cooldown.
- Difficulty scaling by stage.

## 35. Final-Base Acceptance Criteria

The gameplay base is NOT complete until all of the following are true:

1. Player movement works reliably on touch controls.
2. Single jump rule works with no accidental double jumps.
3. Crouch changes hitbox and can avoid correctly placed bullets.
4. Player can move while crouched.
5. Stair auto-ascent works.
6. Holding down while traversing stair connections prevents automatic ascent.
7. Player can run and shoot simultaneously.
8. Player can jump and shoot simultaneously.
9. Horizontal-only shooting is enforced.
10. All four weapons work with correct firing modes.
11. Automatic reload works.
12. Movement remains available during reload.
13. RPG explosion damages multiple enemies and destructible objects.
14. Solid cover reliably blocks projectiles.
15. Enemy AI repositions when cover blocks line of fire.
16. Ranged enemies can pursue, use stairs, jump, crouch, and fight.
17. Melee enemies can pursue, use stairs, jump obstacles, and receive knockback.
18. Spawned enemies never visibly pop into open world space.
19. Spawn doors open, release enemies sequentially, and close.
20. Empty spawn doors are supported.
21. Spawn doors are one-use only.
22. No new enemy spawn occurs behind the allowed forward progression logic.
23. Already spawned enemies remain persistent off-screen.
24. Early-stage active enemy limits and later-stage higher limits work.
25. Every generated/placed enemy is reachable by the player.
26. Every upper level/roof has a valid return path to street level.
27. Entry and exit door approaches remain clear.
28. Player cannot backtrack more than the configured distance.
29. Player health regenerates only up to 50%.
30. Hit knockback, hit-stun, and brief immunity work correctly.
31. Death restarts the current stage from its beginning.
32. No checkpoints exist.
33. Coins and score survive death.
34. Purchased weapons/upgrades survive death and browser restart.
35. Coin magnet behavior works.
36. Destructible crates can drop coins.
37. Inventory remains available during gameplay and does not pause simulation.
38. Player remains vulnerable while Inventory is open.
39. Weapon switching is only through Inventory.
40. Pause fully freezes simulation.
41. Stage exit remains locked until all required enemies/spawns are resolved.
42. Exit opens after stage clear and entry is automatic on contact.
43. Closing/reopening browser restarts at beginning of current stage with permanent progression intact.
44. Stage 1–10 progression works.
45. Stage 11+ can be assembled from valid reusable chunks.
46. Procedural layouts cannot create unreachable enemy locations or impossible routes.
47. Core gameplay remains functional with placeholder graphics, proving systems are independent from final art assets.
48. No duplicate/competing game-loop, collision, camera, or entity systems are introduced.
49. Mobile portrait layout is stable on iPhone Safari.
50. Performance remains stable under the intended later-stage active-enemy load.

## 36. Out of Scope for This Phase

Do not spend implementation time on final visual fidelity yet.

Out of scope:

- Final character art.
- Final enemy sprites.
- Final Jerusalem environment art.
- Final animations beyond functional placeholder states.
- Final particle polish.
- Final lighting polish.
- Final sound/music.
- Marketing screens.

However, the gameplay architecture must expose clean hooks for those systems so they can be added later without changing gameplay rules.

## 37. Implementation Rule for Claude Code

Treat this specification as the source of truth for gameplay behavior.

Before modifying the repository:

1. Read this entire specification.
2. Inspect only the files needed to understand the current V2 gameplay implementation.
3. Do not perform an unnecessary full-repository audit.
4. Decide whether the existing V2 architecture can support this spec cleanly.
5. If not, replace the relevant gameplay architecture instead of stacking patches/overrides on broken systems.
6. Keep final artwork out of scope while building the gameplay foundation.
7. Build systems in small, testable layers.
8. Run targeted tests/checks after each subsystem.
9. Do not declare the base complete until the acceptance criteria above are satisfied.
10. Keep a short implementation progress document in the repository indicating which acceptance criteria are complete, incomplete, or blocked.

The objective is a final, stable gameplay foundation onto which the approved visual asset pack can later be mounted.