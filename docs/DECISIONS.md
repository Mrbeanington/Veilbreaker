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

## ADR-005 — EnergyPool is an explicit object schema, not an enum-keyed z.record — Accepted (2026-09-17, Phase 01)
**Context:** `packages/engine/src/energy.ts` needs a fully-required `{ MIGHT, FOCUS, SPIRIT, CHAOS }` type to read and write pool amounts without `?? 0` guards everywhere. `BattleState.energyPools` originally typed each player's pool as `z.record(energyFamilySchema, z.number())`.
**Decision:** zod v3 infers an enum-keyed `z.record`'s output as `Partial<Record<Family, number>>` (every key optional) rather than a fully-required record — real `tsc` output confirmed this the moment `packages/engine` tried to use it as a fully-required type. Added `energyPoolSchema` (a plain `z.object` with all four families required) to `packages/content/src/schemas/common.ts`, exported as `EnergyPool`, and used it for `BattleState.energyPools`'s value type (the outer map is still `z.record(idSchema, energyPoolSchema)`, keyed by playerId, which stays a proper `Record<string, EnergyPool>` since string-keyed records aren't downgraded to `Partial`).
**Consequences:** One canonical `EnergyPool` type, owned by content, used by the engine without defensive `?? 0` reads. General lesson for later phases: prefer `z.object` over `z.record(z.enum(...), ...)` whenever every enum member is genuinely always present.

## ADR-006 — Energy generation semantics: "fixed" mode and createBattle's turn-1 pass — Accepted (2026-09-17, Phase 01)
**Context:** spec/06's `EnergyRules.generation.mode` names `"random"` and `"fixed"` but only fully specifies `"random"` (OQ-03's default). Separately, the resolution order (spec/01) places "Resource generation" second-to-last (tier 14) and "Next turn" last (tier 15) — meaning a turn's generation really produces the *next* turn's energy, and turn 1 has no previous turn to have generated anything.
**Decision:** `"fixed"` mode grants every family `perLivingCharacter * livingCharacterCount` units directly, with no RNG draw — the simplest reading that still scales with team size the same way `"random"` mode's *total* unit count does, just without randomizing which family each unit lands in. `createBattle` (packages/engine/src/resolver.ts) runs one `generateEnergy` pass per team before returning the initial state, using the same `EnergyRules` the match will use, so OQ-03's "no energy on turn 1 for the initiative player" is meaningful (the non-initiative player actually has turn-1 energy) instead of vacuous (neither player would have any).
**Consequences:** `CreateBattleConfig` now requires `energyRules`, not just `matchFormat`. A caller must supply the *same* `EnergyRules` to `createBattle` and every subsequent `resolveTurn` call, or turn-1 energy and later turns' energy will be generated under inconsistent rules.

## ADR-007 — Resolver scope and cooldown timing (Phase 01) — Accepted (2026-09-17, Phase 01)
**Context:** phase-01-battle-core.md scopes the resolver to RNG, energy, action validation, and tier-ordered resolution — explicitly not the full combat/status/transformation systems (Phases 02–03).
**Decision:**
1. `packages/engine/src/effects.ts` (`applyEffect`) implements only `damage`, `heal`, `sequence`, and `randomOutcome` — enough to prove determinism and tier ordering end-to-end. Every other `Effect` kind throws a explicit "not implemented until a later phase" error rather than silently no-op'ing, so a future character definition can't accidentally depend on a mechanic (statuses, transformations, summons, resource/energy-modifying effects) that doesn't exist yet.
2. `Ability` gained an optional `resolutionTierId` field (`packages/content/src/schemas/ability.ts`); unset, the resolver defaults it to `STANDARD_RESOLUTION_TIER_ID` ("standard-attacks-support"). This is what makes "reordering the resolution-order config reorders events" (the phase's own acceptance criterion) meaningful to test at all.
3. Cooldown reduction (tier 13) explicitly skips any `characterId:abilityId` pair used during the *same* turn's action-resolution tiers. Reducing a freshly-set cooldown in the same pass would make `cooldown: N` only ever block `N-1` turns, since tier 13 runs later in the same turn as tier 6 where the ability was used and its cooldown was set.
4. The `death-checks` tier (10) marks `alive: false` and emits a `death` event, but does not determine a match winner from a team wipe (OQ-09's draw rule) — that belongs to Phase 02's "Death, resurrection, and death-adjacent rules". The only win-condition Phase 01 implements is OQ-14's max-turn HP-percentage tiebreak, since it was explicitly listed as a Phase 01 deliverable.
5. Only `turnModel: "simultaneous"` actually resolves (`resolveTurn(state, actionsA, actionsB, deps)` takes both players' actions together). `"alternating"` exists as a schema value (OQ-01) but has no resolver implementation yet — logged as a new open question rather than built speculatively ahead of any content that needs it.
**Consequences:** Phase 01's engine is real and tested, but a character/ability with a non-attack effect (a status, a transformation trigger, a summon) will throw at resolve time until Phase 02/03 extends `applyEffect`. That's intentional — it surfaces missing engine support immediately instead of a mechanic quietly doing nothing.

## Custom script registry
| Script id | Character | Why components couldn't express it | Added in phase |
|---|---|---|---|
