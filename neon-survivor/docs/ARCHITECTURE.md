# Neon Survivor — Architecture Specification v1

Status: authoritative design for the architecture migration branch.

## Product assumptions
Neon Survivor is designed as a mobile-first live-service action game supporting solo, co-op and PvP. It must support account login, cloud progression, leaderboards, friends, matchmaking, two currencies (coins and premium diamonds), real-money purchases, inventory/cosmetics, abilities/equipment, ranks, achievements, daily/weekly missions, stages/worlds, seasons, live events, statistics and remotely configurable content/balance.

## Non-negotiable rules
1. Gameplay, presentation, persistence and networking are separate layers.
2. Systems never monkey-patch functions owned by other systems.
3. Cross-system communication uses typed domain events or explicit service contracts.
4. Shared mutable globals are forbidden in new architecture.
5. Runtime state has explicit ownership; there is one authoritative owner for every value.
6. Content/balance data is separated from mechanics and rendering.
7. Persistent schemas are versioned and migrated explicitly.
8. Premium currency, purchases, competitive progression and authoritative multiplayer state are server-controlled.
9. Client input is a request/command, not proof that a reward, score or purchase occurred.
10. Legacy code is migrated subsystem-by-subsystem; verified replacements are required before removal.
11. Git owns code versions. New source filenames do not contain v42/v145-style version suffixes.
12. A missing dependency/config is an explicit error, never silently interpreted as success.

## Layers
### Core
Bootstrap, clock/game loop, events, state ownership, lifecycle, configuration, storage abstraction and diagnostics.

### Domain / Gameplay
Entities, movement, combat, damage, weapons, abilities, spawning, pickups and game-mode rules. Gameplay contains no DOM/UI code and does not depend on a concrete backend provider.

### Progression
Objectives, ranks, achievements, missions, stages, seasons, prestige and rewards. Progression consumes domain events and emits progression events.

### Player
Profile, statistics, inventory, garage, loadouts, unlocks and cosmetics.

### Economy
Wallet, catalog prices, grants, spending and transactions. Coins may be earned through gameplay. Diamonds are premium/rare and server-authoritative when online services are enabled.

### Online
Auth, profile sync, cloud save, friends, leaderboards, matchmaking, sessions, co-op, PvP and purchases. Concrete vendors are adapters behind contracts.

### Live Ops
Remote config, versioned content catalog, feature flags, scheduled events, daily/weekly content and experiments. Remote data may tune declared data/configuration; arbitrary remote code execution is forbidden.

### Presentation
Renderer, UI, VFX, audio and input adapters. Presentation observes state/events and sends commands/intents; it does not own gameplay truth.

## Entity model
All gameplay actors use stable entity IDs. Player-specific entities additionally carry playerId and optionally teamId. Components/capabilities describe state rather than type-specific global variables.

Minimum conceptual entity fields:
- entityId
- entityType
- ownerId/playerId when applicable
- teamId when applicable
- transform
- health/status
- weapons/abilities when applicable
- tags

The combat system must be able to damage any valid target without assuming a single global player. This is required for co-op and PvP.

## Runtime state ownership
- SessionSystem: sessionId, matchId, gameMode, authority, connectivity.
- WorldSystem: entity registry and world lifecycle.
- RunSystem: runId, elapsed time, distance, score and run lifecycle.
- CombatSystem: damage resolution and combat outcomes.
- ProgressionSystem: rank/objective/mission progression.
- InventorySystem: owned/equipped item state.
- EconomySystem/server: balances and transactions.
- Presentation: transient UI-only state (open panel, animation state, selected tab).

No second system writes another system's owned state directly. It sends a command/event through the declared interface.

## Event taxonomy
Events use `domain:event` names and stable payload schemas. Important initial events include:
- app:ready
- session:started / session:ended
- run:started / run:ended
- run:time-changed / run:distance-changed / run:score-changed / run:level-changed
- entity:spawned / entity:despawned
- combat:damage-applied
- combat:entity-killed
- player:damaged
- upgrade:selected
- reward:granted
- progression:objective-progressed
- progression:rank-up
- inventory:item-added / inventory:item-equipped
- economy:balance-changed
- network:connected / network:disconnected

Events describe facts that happened. Commands describe requested actions (for example `combat.applyDamage`, `inventory.equip`, `economy.spend`).

## Content model
Enemies, bosses, ships, weapons, abilities, cosmetics, worlds/stages, objectives, rewards and store products are identified by stable content IDs and defined in versioned catalogs. Mechanics reference IDs rather than hard-coded UI labels/assets.

Example enemy definition fields: id, class/tags, baseHealth, speed, damage, behaviorId, weaponIds, rewardTableId, spawnRules, assetId. Adding a normal data-driven enemy should not require modifying CombatSystem.

## Progression model
An Objective definition contains stable id, metric/event source, target, scope, conditions and optional reset policy. Rank is one consumer of the generic objective engine; daily missions, achievements and stages should reuse the same objective primitives instead of creating separate counters.

Rewards are generic bundles: currency, item, unlock and progression resources. A rank system requests/grants a reward through RewardService rather than modifying wallets/inventory directly.

## Save model
Local storage is an offline cache/save mechanism, not authority for premium or competitive data. Save domains are independently versioned: profile, settings, progression, statistics, inventory, loadouts and offline run state. Migrations are deterministic and never destroy unrelated domains.

When accounts/backend are introduced, records include server revision/timestamps and explicit conflict policy. Purchases, diamonds and competitive results use server records as truth.

## Networking model
The architecture supports solo, co-op and PvP from the domain model. Networking is transport-agnostic.

Solo may run local authority. Casual co-op may use an appropriate session authority model, but economy/rewards remain validated by backend rules. Competitive PvP is designed for server authority over results and security-sensitive simulation decisions.

Network messages carry IDs/ticks/sequence information where required. Rendering may interpolate remote state; rendering state is not simulation truth.

## Authentication and identity
Game code consumes an AuthService contract. Google/Facebook are identity providers, not domain dependencies. Internal playerId is provider-independent so accounts can support multiple linked providers later.

## Economy and purchases
Currencies: coins and diamonds. Store catalog and offers are data-driven. All balance mutations are transactions with reason/source IDs. Real-money purchase receipts must be validated by the backend/store integration before premium items/currency become authoritative.

## Live configuration
Remote Config can change declared tunables and content references: enemy stats, spawn tables, objective targets, rewards, prices, event schedules and feature flags. Config/catalog payloads are schema-versioned, validated, cached and have safe local defaults. Remote config cannot inject executable JavaScript.

## Mobile requirements
Input is adapter-based (touch/controller/etc.). UI respects safe areas and variable aspect ratios. Game simulation does not depend on DOM dimensions. Lifecycle handles pause/background/resume. Performance budgets and object pooling are introduced for hot gameplay paths. Platform purchase/auth APIs live behind adapters.

## Testing boundaries
Core/domain systems must be testable without Canvas/DOM. Data schemas receive validation tests. Progression receives deterministic event-driven tests. Economy transaction rules receive tests. Network serialization receives compatibility tests. Presentation gets targeted integration/smoke tests.

## Migration strategy
Phase A — Foundation: specification, core contracts, bootstrap/lifecycle, state/event conventions, schema validators and diagnostics.
Phase B — Generic objective engine + Rank 1–10 as first production consumer.
Phase C — Run/world/entity model and game loop.
Phase D — Combat/damage/weapons/enemies/spawning.
Phase E — Inventory/garage/loadouts/economy/rewards/statistics.
Phase F — Auth/cloud/leaderboards/live config.
Phase G — multiplayer session model, co-op, then authoritative competitive PvP.
Phase H — remove legacy srcdoc/TXT patch loader only after replacement paths pass smoke tests.

## Migration safety
The current playable main branch remains the baseline. Architecture work stays isolated until a vertical slice is demonstrably playable. Each migration has: old behavior inventory, new contract, adapter/bridge if required, verification, then legacy removal. No big-bang rewrite.

## Definition of done for Phase A
- documented ownership and dependency rules
- deterministic bootstrap/lifecycle
- Event Bus and command/service boundaries
- versioned state/storage conventions
- content/config schema and validation approach
- provider-neutral online contracts
- diagnostics that expose missing dependencies
- no new monkey patches
- architecture can host the Rank vertical slice without depending on legacy globals
