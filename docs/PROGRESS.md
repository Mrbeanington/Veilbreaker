# Progress

**Current phase:** 00 (complete, verified green — see session log). Next: 01.

| Phase | Title | Status |
|---|---|---|
| 00 | Architecture and scaffolding | ☑ |
| 01 | Battle state, resolver, RNG, energy | ☐ |
| 02 | Combat primitives | ☐ |
| 03 | Advanced systems | ☐ |
| 04 | First five prototypes | ☐ |
| 05 | Playable local 3v3 | ☐ |
| 06 | Remaining 15 prototypes | ☐ |
| 07 | Bots and headless simulation | ☐ |
| 08 | Full client UI | ☐ |
| 09 | Local profile, persistence, progression, unlocks | ☐ |
| 10 | Friend matches (serverless) | ☐ |
| 11 | Local ranked | ☐ |
| 12 | Dev-mode balance tools and local analytics | ☐ |
| 13 | Roster scale to 120 | ☐ |
| 14 | Art spec completion | ☐ |
| 15 | Balance pass, polish, accessibility, offline/PWA, security | ☐ |

## Session log
<!-- Append one entry per session: date, phase, what was done, files created/changed, deviations, open questions raised. -->

### 2026-09-17 — Phase 00
Scaffolded the pnpm monorepo (`packages/engine`, `packages/content`, `packages/ai`,
`packages/persistence`, `apps/web`), strict TS config, ESLint 9 flat config (with the
Math.random/Date.now ban scoped to `packages/engine`), Prettier, Vitest per package, a GitHub
Actions CI workflow, and `scripts/verify-client-only.mjs` (the external-URL / fetch-XHR-WebSocket
build guard). Wrote `docs/ARCHITECTURE.md`, accepted ADR-001/002 and added ADR-003 in
`docs/DECISIONS.md`, logged OQ-25/OQ-26 in `docs/OPEN-QUESTIONS.md`, and filled in CLAUDE.md's
Commands section. Full zod schemas for every model Phase 00 requires (Cost, TargetRule, Trigger,
Condition, RandomOutcome, Resource, Effect, StatusDefinition, Transformation, Summon, Ability,
CharacterDefinition, BattleState (skeleton, see OQ-25), PlayerAction, BattleEvent, EnergyRules,
ResolutionOrder, MatchFormat, BalanceVersion, CharacterArtSpec, CharacterVisualBible) live in
`packages/content/src/schemas/`, plus the three default config JSON files and tests that a
malformed character/config is rejected. `apps/web` is a minimal React shell that reads
`GAME_TITLE` and sets `document.title` at runtime (never hard-coded in `index.html`).

**Files created:** see `git log` / `git status` for the full list — this was a from-scratch
scaffold, so effectively every file under `packages/`, `apps/web/`, `scripts/`,
`.github/workflows/`, plus the root config files and `docs/ARCHITECTURE.md`.

### 2026-09-17 — Phase 00 verification
Installed Node.js 24.19.0 (winget) and pnpm 9.12.0 (`npm install -g`, since `corepack enable`
needed admin rights this session didn't have) and actually ran the acceptance criteria:
`pnpm install`, then `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build`,
`pnpm run verify-client-only` (all four bundled as `pnpm run ci`; note `pnpm ci` alone hits pnpm's
own reserved `ci` subcommand, not the package.json script — must use `pnpm run ci`). This
surfaced and fixed real bugs the hand-review missed:
- Dropped `exactOptionalPropertyTypes` from `tsconfig.base.json` — it doesn't play with zod's
  `.optional()`/`.default()` typing on recursively-typed schemas.
- `effectSchema`, `randomOutcomeSchema`, `randomOutcomeBranchSchema` needed a 3-argument
  `z.ZodType<Output, ZodTypeDef, unknown>` annotation instead of the 1-argument form, because
  `targetRuleSchema`'s `.default()`-backed fields give it an input shape looser than its output
  shape, which a single-generic `z.ZodType<T>` (Input = Output = T) can't express.
- `apps/web/tsconfig.json` had a stray `rootDir: "src"` that broke on `vite.config.ts` (which
  lives outside `src`) once `include` referenced both.
- `eslint.config.js` needed a Node-globals override (`process`, `console`, ...) for
  `scripts/**/*.mjs` and config files, and the root `package.json` needed `"type": "module"`.
- `scripts/verify-client-only.mjs` was flagging false positives from React's own bundled
  internals: W3C XML/SVG/MathML namespace URIs (never fetched, just DOM namespace identifiers)
  and React's `reactjs.org/docs/error-decoder.html` link (inert text in minified error messages).
  Fixed by splitting React into its own `vendor` chunk (`apps/web/vite.config.ts`
  `manualChunks`) and excluding that chunk from the scan — vendor code is audited once by hand,
  not pattern-matched. Also found a **real** `fetch(` call: Vite's own modulepreload polyfill.
  Disabled it (`build.modulePreload: false`) rather than teaching the guard to recognize
  same-origin fetches, since this app doesn't need the prefetch optimization yet.
- Resolved OQ-26: tested both `vite build` (served via `vite preview`) and `vite dev` in the
  browser pane against the strict CSP meta tag. Both work — the page renders, `document.title`
  updates to `GAME_TITLE`, HMR's websocket connects, and no CSP violations appear in the console.
  No dev-only CSP relaxation is needed.

**`pnpm run ci` is fully green**: typecheck passes across all 5 packages, lint is clean, all 14
tests pass, `apps/web` builds to static files (`index-*.js` 65 KB, `vendor-*.js` 141 KB gzip'd to
~16 KB / ~45 KB), and the client-only guard reports no violations. Logged the schema/guard fixes
as ADR-004 in `docs/DECISIONS.md`. Phase 00 is genuinely done — Phase 01 can start.
