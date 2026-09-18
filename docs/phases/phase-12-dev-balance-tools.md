# Phase 12 — Dev-mode balance tools and local analytics
**Read first:** spec/06 (balance tools, analytics, security)

## Deliverables
- **Dev mode** (build flag, or URL flag in dev builds; excluded from production by default). It edits HP, damage, healing, costs, cooldowns, durations, status values, transformation requirements, and RNG weights. It creates a draft BalanceVersion in IndexedDB with a diff view and schema validation, can run an in-browser Worker simulation, and exports a JSON file to commit into `packages/content`. There is no source editing, and old replays keep resolving under their shipped versions.
- **Player stats:** personal analytics from local match history.
- **Developer reports:** simulation dashboards with outlier flags and recommendations. Never auto-nerf.

## Acceptance criteria
A production build contains no dev-mode code (verified in CI). An exported balance file round-trips through validation.

Finish with the end-of-phase report.
