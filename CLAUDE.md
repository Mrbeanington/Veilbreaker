# VEILBREAK: ARENA OF THE FALLEN — Claude Code Operating Guide

> Title is provisional. It lives in ONE constant (`GAME_TITLE` in `packages/content/src/branding.ts`). Never hard-code the name anywhere else.

## What this project is
An original, browser-based, competitive **3v3 turn-based arena game**. Players draft three characters from a large roster (V1 target: 120; architecture must support 500+). Abilities are simple and spend shared team energy; depth comes from interactions, counters, transformations, secrets, and team composition. It is a spiritual successor to a *style of gameplay* — not a derivative of any existing property.

You act as lead game designer, senior full-stack engineer, systems architect, balance designer, UI/UX designer, narrative designer, character designer, and technical art director.

## HARD PLATFORM CONSTRAINT: client-only
The game runs **entirely in the browser**. There is:
- **NO backend**: no application server, no server-side processing, no serverless functions.
- **NO database**: persistence uses browser storage (IndexedDB) plus export/import save files.
- **NO authentication requirement**: a local profile is created automatically on first launch.
- **NO external API dependency for core functionality**: no runtime calls to third-party services, and no CDN-loaded scripts or fonts. Everything the game needs is in the static build.

The build output is static files that work when served from any static host AND after the first load with the network disabled. Build-time and dev-time tooling (npm packages, test runners, the Node simulation CLI) is fine; the rule governs what the shipped game needs at runtime. When a feature would normally need a server, use the client-only replacement in `docs/spec/06-platform.md` instead of adding one. Never add a server "temporarily". If a request seems to require one, stop and flag it.

## Session protocol (follow every session)
1. Read this file, then `docs/PROGRESS.md` to find the **current phase**.
2. Open the matching file in `docs/phases/`. Read ONLY the spec sections it lists under "Read first". Do not load the whole spec unless needed.
3. Work only on the current phase. Do not start the next phase.
4. Before finishing: run typecheck, lint, and all tests. Everything must pass.
5. Update `docs/PROGRESS.md`: mark checklist items, list **every file created or changed**, note deviations.
6. Record architectural decisions in `docs/DECISIONS.md` (short ADR entries).
7. If the spec is ambiguous: choose the simplest option that keeps the system reusable, log it in `docs/OPEN-QUESTIONS.md`, and keep going. Stop and ask only for destructive or irreversible choices.
8. End with the phase's "End-of-phase report" and stop.

## Non-negotiables
1. **Originality.** No Naruto characters, terminology, art, lore, symbols, locations, ability names, source code, UI, or text. No copied assets or UI from any game. No real-person likenesses, no real team/league branding, no trademarks in names. Use public-domain myth/folklore with original interpretations.
2. **Simple abilities, deep interactions.** Every ability should be understandable in ~5 seconds. Complexity emerges from rules interacting, not from long ability text.
3. **Data-driven characters.** Characters are compositions of reusable components: Ability, Effect, Trigger, Condition, Status, Transformation, Resource, Summon, TargetRule, RandomOutcome. Custom scripts are allowed ONLY when components genuinely cannot express a mechanic; each script must be registered and justified in `DECISIONS.md`.
4. **Deterministic, pure engine.** `packages/engine` has no I/O, no `Math.random`, no `Date.now`, and no framework deps. All randomness goes through the seeded RNG stored in battle state. **Integer math only** (no floats in combat logic), so results are identical across browsers and devices. Same seed + same actions + same balance version = identical result.
5. **Centralized resolution.** One battle resolver. The priority order comes from configuration (`ResolutionOrder`) and is never hard-coded across files.
6. **Configuration over constants.** EnergyRules, resolution order, and all balance numbers live in versioned data, never embedded in logic.
7. **Client-only runtime.** See the hard platform constraint above. The engine is the sole authority within a match. In friend matches, integrity comes from deterministic replay verification plus commit-reveal (spec/06), not from a server.
8. **Powerful is acceptable. Uncounterable is not.** Every Legend and every Cheater must have counterplay.
9. **Discoverability.** Hidden mechanics may exist, but any hidden effect that changes a ranked outcome must appear in the battle log when it fires.
10. **Priorities when choosing:** functional game logic beats mockups; reusable systems beat hard-coding; simple player-facing rules beat complexity.
11. **Iterate.** Never dump the whole application at once.

## Tech stack (PROPOSED — confirm or amend in Phase 0 via ADR-001)
- pnpm workspaces monorepo, TypeScript `strict`, Node 20+ (dev and build only)
- `packages/engine` — pure TS battle engine (zero runtime deps, integer math)
- `packages/content` — character/status/balance data plus zod schemas and art specs, bundled into the build
- `packages/ai` — bots and headless simulation (runs in Web Workers in the browser, and in Node for dev CLI runs)
- `packages/persistence` — IndexedDB storage, versioned save schema with migrations, export/import
- `apps/web` — React + Vite static app; optional PWA service worker for offline play; optional single-file build (`vite-plugin-singlefile`)
- Vitest for unit tests; Playwright for browser tests, including an offline-mode test; ESLint + Prettier
- Hosting: any static host (GitHub Pages, Netlify, itch.io, or a local file)
- **Not allowed:** application servers, databases, auth providers, analytics SDKs, runtime CDNs, remote fonts, runtime AI/image APIs

## Conventions
- Stable kebab-case IDs: `tortuga-rex`, `status.stun`, `ability.tortuga-rex.shell-bash`.
- Numbers use the damage language (multiples of 10) unless a design reason is logged.
- No `any` in engine code. Engine functions take state and return new state or events; no hidden mutation.
- Every mechanic ships with tests. Every bug fix ships with a regression test.
- The battle log is a first-class output: the engine emits structured events, and the UI and replays consume them.

## Spec index
| File | Contents |
|---|---|
| `docs/spec/01-core-rules.md` | Vision, match format, damage language, turn system, resolution stack, energy, randomness, tags, Cheaters |
| `docs/spec/02-engine-systems.md` | Data-driven components, statuses, transformations, summons, death/resurrection, knowledge levels, replays, versioning |
| `docs/spec/03-roster.md` | Rarities, 12 Legends, Malachar/Father Bell, special characters, full 120 list, coverage rules, prototypes, tone and lore |
| `docs/spec/04-art-direction.md` | Global art language, regional guidance, CharacterArtSpec schema, Visual Bible, example prompts |
| `docs/spec/05-ui-ux.md` | Navigation, character select, Legend Chamber, match screen, tooltips, Codex, accessibility, sound |
| `docs/spec/06-platform.md` | Client-only platform: persistence, progression, unlocks, secrets, local ranked, friend matches, AI, dev balance tools, local analytics, security, future content |
| `docs/spec/07-testing-and-balance.md` | Required tests and the balance-simulation plan |

## Commands
- Install (from repo root): `pnpm install`
- Dev server (web app): `pnpm --filter @veilbreak/web dev`
- Typecheck all packages: `pnpm typecheck`
- Lint all packages: `pnpm lint`
- Format check: `pnpm format`
- Test all packages: `pnpm test`
- Build all packages (currently only `apps/web` has a build step): `pnpm build`
- Client-only platform guard (run after `pnpm build`): `pnpm verify-client-only`
- Full local CI gate, same checks CI runs: `pnpm ci`
- Run a single package's scripts: `pnpm --filter @veilbreak/<name> <script>` (e.g. `pnpm --filter @veilbreak/content test`)
- Node simulation CLI (`packages/ai`): not built yet — added in Phase 07.
