# Architecture Decision Log

Format: `ADR-NNN — Title — Status (Proposed/Accepted/Superseded) — Date`, followed by Context / Decision / Consequences. Also register every custom character script here (see CLAUDE.md, rule 3).

## ADR-001 — Tech stack — Accepted (2026-09-17, Phase 00)
**Context:** The engine must be shared by the UI, bots, simulation, and friend-match verification. It must be deterministic, data-driven, and run entirely client-side (ADR-002).
**Decision:** pnpm TypeScript monorepo; pure `packages/engine` (integer math); `packages/content` with zod schemas; `packages/ai` (Web Workers + Node dev CLI); `packages/persistence` (IndexedDB); React + Vite static app; Vitest + Playwright.
**Consequences:** One engine codebase everywhere. The output is static files deployable to any static host. Confirmed unchanged during Phase 00 scaffolding; see ADR-003 for one addition (packages consumed as source, no per-package build step).

## ADR-003 — Workspace packages consumed as TypeScript source — Accepted (2026-09-17, Phase 00)
**Context:** `packages/engine`, `packages/content`, `packages/ai`, and `packages/persistence` are internal-only — nothing outside this monorepo ever imports them as published npm packages.
**Decision:** Each package's `package.json` points `main`/`types` at `src/index.ts` directly instead of a compiled `dist/`. `apps/web` (Vite) and Vitest consume that TypeScript source directly; each package's own `typecheck` script (`tsc --noEmit`) is the only place `tsc` runs on it. `apps/web` is the sole package with a real build step (`vite build`). Relative imports inside every package use extensionless specifiers (`./common`, not `./common.js`) — Vite/Vitest do not remap a `.js`-suffixed relative import back to its `.ts` source the way `tsc`'s `moduleResolution: bundler` would if the package were compiled to real `.js`, so extensionless imports are the form that resolves correctly everywhere (tsc, Vite, and Vitest) given this decision.
**Consequences:** Faster iteration (no build step between packages during Phases 00–08). No package here can be published standalone without adding a build step later — acceptable since none currently need to be.

## ADR-002 — Client-only platform — Accepted
**Context:** Owner requirement: no backend, no database, no server-side processing, no authentication requirement, and no external API dependency for core functionality.
**Decision:**
- Server authority is replaced by the local engine for solo play, and by commit-reveal plus deterministic replay verification for friend matches.
- The database is replaced by IndexedDB with versioned saves and export/import.
- Accounts are replaced by an automatic local profile.
- Online ranked is replaced by local ranked against bots.
- The admin panel is replaced by dev mode with exported balance files.
- Cross-player analytics are replaced by simulation reports plus personal stats.
**Consequences:** No global leaderboards, cross-device sync (except manual export), or tamper-proof unlocks. Friend matches are asynchronous by code; live P2P is optional. Hosting cost is effectively zero, and the game works offline.

## ADR-004 — Recursive zod schemas need a loosened Input type; the client-only guard exempts an audited vendor chunk — Accepted (2026-09-17, Phase 00 verification)
**Context:** Running the real Phase 00 acceptance criteria (`pnpm install && pnpm run ci`) after installing Node/pnpm surfaced two classes of bug the hand-review in the same session had missed.
**Decision:**
1. `effectSchema`, `randomOutcomeSchema`, and `randomOutcomeBranchSchema` (the mutually-recursive Effect/RandomOutcome types in `packages/content/src/schemas/effect.ts`) are annotated `z.ZodType<Output, z.ZodTypeDef, unknown>` instead of the single-argument `z.ZodType<Output>`. A single-argument annotation forces the schema's Input type to equal Output, but nested schemas with `.default()`-backed fields (e.g. `targetRuleSchema`) have an input shape strictly looser than their output shape, which real callers never notice because they always `.parse(value: unknown)`, never a value pre-typed as `Effect`. `exactOptionalPropertyTypes` was also dropped from `tsconfig.base.json` for the same family of reason (it does not compose with zod v3's `.optional()`/`.default()` output typing).
2. `apps/web/vite.config.ts` isolates React into its own `vendor` chunk (`build.rollupOptions.output.manualChunks`), and `scripts/verify-client-only.mjs` excludes that chunk from its external-URL/networking-API scan entirely (`VENDOR_CHUNK_PATTERN`). React's bundled internals contain strings that look like violations under naive scanning — W3C XML/SVG/MathML namespace URIs (DOM API identifiers, never fetched) and an inert `reactjs.org/docs/error-decoder.html` link embedded in minified error text — that have nothing to do with the app's own behavior. `apps/web/vite.config.ts` also sets `build.modulePreload: false`: Vite's default modulepreload polyfill contains a real (same-origin, harmless) `fetch(` call the guard can't statically distinguish from a call to a third party, and this single-entry Phase 00 app doesn't need the prefetch optimization it exists for.
**Consequences:** The client-only guard now enforces its rule against code this project actually writes, and treats a vendor dependency's internals as something to audit once by hand when added to `manualChunks.vendor`, not something to pattern-match on every CI run. Adding a new production dependency to the vendor chunk should get a one-time manual check that it doesn't call real network APIs.

## Custom script registry
| Script id | Character | Why components couldn't express it | Added in phase |
|---|---|---|---|
