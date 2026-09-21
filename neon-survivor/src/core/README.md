# Neon Survivor Core — Phase 1

This directory is the migration target for the legacy patch-stack architecture.

Rules:
1. New systems communicate through `GameEvents`; they do not replace global functions owned by other systems.
2. Shared runtime values belong in `GameState`.
3. Persistent data goes through `GameStorage` with explicit schema versions/migrations.
4. Objective/balance data stays separate from rendering and tracking logic.
5. Legacy code remains operational until its replacement has been verified in-game.
6. One subsystem is migrated at a time; no big-bang rewrite.

First migration target: Player Rank.
