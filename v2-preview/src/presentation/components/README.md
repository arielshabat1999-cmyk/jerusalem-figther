# GAME V2 Presentation Components

Canonical flow: Authority -> Adapter -> Component -> Asset/CSS.

Rules:
- Components are presentation only and never own gameplay state.
- Adapters read authoritative systems and expose view-ready snapshots.
- Components render dynamic values at runtime; do not bake names, levels, prices, progress, ownership, dates, or leaderboard data into artwork.
- Replace existing views; do not stack permanent duplicate UI.
- UI asset work must not modify the canonical gameplay manifest or module order unless a genuine new production system is explicitly required.
- Migrate one component at a time and QA Boot, Home, Run, portrait, reload, and duplicate implementations before locking it.

Player Identity is the first reference implementation.
