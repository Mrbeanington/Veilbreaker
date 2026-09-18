# Phase 00 — Architecture and scaffolding
**Read first:** CLAUDE.md (especially the hard platform constraint), spec/01, spec/02, spec/06 (trust model, data model), DECISIONS.md, OPEN-QUESTIONS.md

## Goal
A working monorepo skeleton and the core type/schema definitions, with no gameplay yet.

## Deliverables
1. Restate the technical architecture in `docs/ARCHITECTURE.md`: packages, data flow (bundled content → engine → UI / AI Workers / persistence), determinism strategy (seeded RNG, integer math), the persistence and save-migration strategy, and the versioning strategy. Accept or amend ADR-001 and ADR-002.
2. Scaffold the monorepo: `packages/engine`, `packages/content`, `packages/ai`, `packages/persistence`, `apps/web`. There is no server package. Include strict tsconfig, ESLint, Prettier, Vitest, and a CI workflow (typecheck, lint, test, build).
3. `packages/content/src/branding.ts` with `GAME_TITLE`.
4. Core TypeScript models and zod schemas for: CharacterDefinition, Ability, Cost, Effect, Trigger, Condition, TargetRule, RandomOutcome, StatusDefinition (all required fields from spec/02), Transformation, Summon, Resource, BattleState, PlayerAction, BattleEvent, EnergyRules, ResolutionOrder, BalanceVersion, CharacterArtSpec, CharacterVisualBible.
5. Default config files: `energy-rules.json`, `resolution-order.json` (the 15 tiers), and `match-format.json` (team size 3).
6. Written turn-resolution algorithm (pseudocode) in ARCHITECTURE.md, covering planning → validation → queue → tiered resolution → death checks → end of turn, including within-tier ordering (OQ-02).
7. Fill in the Commands section of CLAUDE.md.

## Acceptance criteria
- `pnpm install && pnpm typecheck && pnpm lint && pnpm test` pass (a trivial test is fine).
- Schemas reject a deliberately malformed sample character.
- `pnpm build` produces static files only, and the app shell loads when those files are served statically.
- A CI guard fails the build if the production bundle references external URLs (http/https origins other than relative paths) or contains `fetch(`/`XMLHttpRequest`/`WebSocket` outside an explicit allowlist (the optional P2P module).
- An ESLint rule bans `Math.random` and `Date.now` in `packages/engine`.
- No gameplay logic yet.

## Out of scope
Resolution logic, characters, and UI.

Finish with the end-of-phase report (`_TEMPLATE-end-of-phase-report.md`).
