# Progress

**Current phase:** 03 (complete, verified green — see session log). Next: 04.

| Phase | Title | Status |
|---|---|---|
| 00 | Architecture and scaffolding | ☑ |
| 01 | Battle state, resolver, RNG, energy | ☑ |
| 02 | Combat primitives | ☑ |
| 03 | Advanced systems | ☑ |
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

### 2026-09-17 — Phase 01
Implemented the battle resolver end to end in `packages/engine`:
- `src/rng.ts` — a pure, seeded mulberry32 PRNG (`RngState` is a decimal string, fits
  `BattleState.rngState`) with `nextUint32`/`nextFloat`/`rollDie`/`pickRandom`/`pickWeighted`.
  Every function returns a new state; nothing mutates. No `Math.random` anywhere (still enforced
  by the ESLint rule from Phase 00).
- `src/energy.ts` — `generateEnergy` (random and fixed modes, pool cap, OQ-03 turn-1 skip) and
  `canAfford`/`payCost` (NEUTRAL paid from the richest remaining family when unspecified; a
  caller-supplied explicit payment is validated and must sum exactly to the cost).
- `src/actions.ts` — `validateAction`: unknown character/ability, wrong team, cooldown,
  affordability, and target-side/alive placeholder checks.
- `src/effects.ts` — `applyEffect` for `damage`, `heal`, `sequence`, `randomOutcome`; every other
  `Effect` kind throws (by design — see ADR-007) since those systems don't exist until Phase 02/03.
- `src/resolver.ts` — `createBattle` and `resolveTurn`. `resolveTurn` validates every action
  up front (an illegal action is rejected, not dropped), walks `ResolutionOrder` tiers read from
  config, orders each tier's actions by initiative-then-ally-slot (OQ-02), reduces cooldowns
  (excluding abilities set that same turn — ADR-007), runs the death-checks and
  resource-generation tiers, flips initiative, and applies OQ-14's max-turn HP-percentage
  tiebreak. Pure throughout: takes a state, returns a new state and event list (CLAUDE.md rule 4).

Extended `packages/content/src/schemas/battle.ts` (OQ-25's flagged extension point):
`CharacterRuntimeState` (HP, alive, cooldowns) and `initiativePlayerId` on `BattleState`. Added
`energyPoolSchema` to `common.ts` (ADR-005 — an enum-keyed `z.record` infers as `Partial`, which
doesn't work for a pool where every family is always present) and an optional `resolutionTierId`
on `Ability` (ADR-007).

**Files created:** `packages/engine/src/{rng,energy,actions,effects,resolver}.ts` and their
`*.test.ts` files.
**Files changed:** `packages/content/src/schemas/{common,battle,ability}.ts`,
`packages/engine/src/index.ts` (public API), `packages/engine/src/index.test.ts` (replaced the
Phase 00 placeholder assertion).

**Tests:** 54 passing (up from 14): 10 RNG (determinism, purity, range/distribution checks), 19
energy (generation modes, pool cap, canAfford/payCost incl. NEUTRAL edge cases), 13 resolver
(determinism, illegal-action rejection incl. a no-mutation check, tier-ordering read from config
in both directions, cooldown timing, death checks, the max-turn tiebreak, initiative alternation),
2 content, 2 barrel/index smoke tests. `pnpm run ci` (typecheck, lint, test, build,
verify-client-only) is green.

**Deviations:** logged as ADR-005/006/007 — the `EnergyPool` schema shape, "fixed" energy-mode
semantics plus `createBattle`'s turn-1 generation pass, and the resolver's intentionally narrow
effect-kind support / cooldown timing / win-condition scope.

**New open questions:** OQ-27 (alternating turn model not implemented — deferred until a mode
needs it), OQ-28 (team-wipe/win-condition detection beyond the max-turn tiebreak deferred to
Phase 02).

**Custom scripts:** none.

**Recommended next step:** Phase 02 ("Combat primitives") — extend `applyEffect` to cover
statuses, and build real death/resurrection handling on top of the `death-checks` tier this phase
already wired up.

### 2026-09-18 — GitHub Pages + repo publication (between phases)
Made the repo public (user request, matching `gridiron-playbook`'s setup) and added
`.github/workflows/deploy.yml`, which builds `apps/web` and publishes `apps/web/dist` to GitHub
Pages on every push to `main`. README now leads with links to the live game
(https://mrbeanington.github.io/Veilbreaker/) and the project hub artifact, same pattern as
`gridiron-playbook`. This is also when ADR-008's CI fix landed (see above) — setting up Pages is
what finally surfaced that CI had been red since Phase 00.

### 2026-09-18 — Phase 02
Built the combat primitives on top of Phase 01's resolver:
- **Status engine** (`packages/engine/src/statuses.ts`): `applyStatusToCharacter` (stack rules
  none/refresh/stack/stackAndRefresh, capped at `maxStacks`), `dispelCharacter`, `hasStatus`,
  `getEffectiveMagnitude` (`magnitude * stacks`, the one rule used everywhere), `computeTicks`
  (DoT/HoT), `decrementStatusDurations` (with the same same-turn exemption ADR-006 gave
  cooldowns — see ADR-009), and `canAct` (Stun/Silence).
- **Damage pipeline** (`packages/engine/src/damage.ts`): `resolveDamage` implements invulnerable
  → reflect/counter → amplification/weakness → damage reduction → shield → HP exactly as
  phase-02-combat-primitives.md names it, with a precise table (ADR-009) for what each of
  normal/piercing/affliction skips. `resolveHeal` implements OQ-04's healing-class rules
  (Anti-Heal blocks `heal` only; Healing Reduction/Amplification affect `heal` and
  `lifeTransfer`, never `setHp`).
- **Targeting** (`packages/engine/src/targeting.ts`): `resolveTargets` evaluates self/ally/enemy/
  any × single/all/random/lowestHp/highestHp, filters out untargetable characters, and forces
  enemy-side targeting onto a taunter — redirecting an explicit off-target selection rather than
  rejecting it as illegal (a real bug I caught and fixed via a failing test).
- **`effects.ts`** now implements `applyStatus`, `removeStatus` (including `dispelAll`),
  `modifyCooldown`, `modifyEnergy`, and `drainEnergy`, alongside Phase 01's damage/heal/sequence/
  randomOutcome. `summon`, `transformInto`, and `modifyResource` still throw — Phase 03 scope.
- **`resolver.ts`**: real target resolution (via targeting.ts) replaces Phase 01's raw
  pass-through of player-submitted target ids; Stun/Silence are checked both at planning
  (actions.ts) and again per-action during resolution (a status can be applied mid-turn by an
  earlier tier); DoT/HoT tick during their named tiers; status durations decrement during
  post-turn-effects; Cooldown Increase/Reduction adjust the cooldown-reduction tier's decrement
  rate; and OQ-09's team-wipe win/draw check runs after every tier, taking precedence over the
  max-turn tiebreak.
- **Status library** (`packages/content/src/data/statuses.ts`): all 32 statuses from spec/02, each
  a real, schema-validated `StatusDefinition`. 19 have a concrete engine hook exercised by tests;
  13 are data-only with a `TODO(phase-03)` tooltip (ADR-009, OQ-29) — spec/06's own named
  exceptions plus nine more that either have no concrete spec'd mechanic or need a richer
  per-application parameter than the current model supports.

**Files created:** `packages/engine/src/{statuses,damage,targeting,types}.ts` and their
`*.test.ts` files (except `types.ts`, which has no runtime behavior to test);
`packages/content/src/data/statuses.ts` and its test.
**Files changed:** `packages/content/src/schemas/{common,battle,effect,status}.ts` (EnergyPool
already existed; added `ActiveStatus`/`CharacterRuntimeState.statuses`, damage types, the
`applyStatus`/`removeStatus` field additions, `modifyCooldown`, `drainEnergy`,
`StatusDefinition.tickBehavior`), `packages/engine/src/{energy,effects,actions,resolver,index}.ts`.

**Tests:** 124 passing (up from 54): the new statuses.test.ts (15), damage.test.ts (18),
targeting.test.ts (13), effects.test.ts (12), and content's statuses.test.ts (4), plus 8 new
resolver.test.ts integration tests (stun/silence blocking action in both same-turn-execution and
next-turn-planning forms, taunt redirect, DoT ticking across its full duration, Cooldown
Reduction speeding up recovery, simultaneous wipe → draw, one-sided wipe → win). `pnpm run ci`
is green, and this time GitHub Actions was checked directly (not just assumed from the local run
— see ADR-008's lesson).

**Deviations:** logged as ADR-009 — the ActiveStatus stacking model, the damage-type interaction
table, the status-duration same-turn exemption, taunt-redirects-rather-than-rejects, and the
13 statuses shipped data-only.

**New open questions:** OQ-29 (13 statuses without a concrete engine hook yet), OQ-30
(`drainEnergy`'s grant-to-self doesn't enforce the pool cap). OQ-28 is resolved (see above).

**Custom scripts:** none.

**Recommended next step:** Phase 03 ("Advanced systems") — transformations, summons, per-character
resource tracking (`modifyResource`), and whichever of the 13 deferred statuses the first real
character kits (Phase 04) turn out to need.

### 2026-09-18 — Phase 03
The largest phase yet — built every remaining "Advanced systems" deliverable on top of Phases
01–02's resolver and combat primitives:
- **Triggers and Conditions**: a new `PassiveDefinition` (trigger→condition→effects, spec/02 had
  no equivalent for a character's own passive, only for statuses) and one shared evaluator
  (`triggers.ts`'s `evaluateEvent`) that scans every character's current passive and every active
  status's `triggerTiming` against each game event, with a `relation` field (`self`/`ally`/
  `enemy`/`any`) making "onDeath (any/ally/enemy)" concrete. `conditions.ts`'s `evaluateCondition`
  implements every Condition variant from Phase 00's schema plus two new ones
  (`usedAbilityLastTurn`, `abilitySequenceMatches`, backed by a new `CharacterRuntimeState
  .abilityHistory`). A depth-5 recursion guard (`MAX_TRIGGER_DEPTH`) stops a self-perpetuating
  cascade, tested with a genuinely looping fixture.
- **Custom Resources**: `Resource` gained `displayHint`/`trackMode`; `CharacterRuntimeState
  .resources` plus a real `modifyResource` effect handler (clamped to the definition's min/max)
  replace what was a schema-only concept through Phase 02.
- **Transformation engine**: `transformations.ts`'s `applyTransformation` swaps abilities/passive/
  cooldowns and rescales current HP by ratio when max HP changes, while never touching `statuses`
  (so they persist through a transformation, per spec/02's "preserving identity and statuses").
- **Summons**: `summons.ts` + `damage.ts` — attached (non-slot) summons absorb damage for their
  owner, with overflow carrying through once they break; slot-occupying ("fourth unit") summons
  are tracked but not yet independently targetable (OQ-32). Expiry runs in the post-turn-effects
  tier alongside status decay, firing `onExpireEffects`.
- **Death extensions**: Death Prevention floors a lethal hit at 1 HP and self-consumes
  (`damage.ts`'s `applyHp`); `erase` kills via a distinct `"erased"` event that `deriveGameEvents`
  never maps to `onDeath` — that omission alone is the whole "erasure bypasses death triggers"
  mechanism; `resurrect` revives at a configurable HP%, blocked by Resurrection Lock.
- **State snapshot/restore**: `snapshot.ts` — a JSON-round-trip deep clone (BattleState is already
  plain, serializable data), tested for full deep-equality and independence from later mutation of
  either copy, plus a smoke test of the OQ-06 rewind pattern (restore, then re-resolve).
- **RNG manipulation**: `rng-modifiers.ts` — a one-shot `RngModifier` queued on a character and
  consumed by their next `randomOutcome` roll. Branches are read worst-to-best by author
  convention; `forceOutcome`/`guaranteeMin`/`guaranteeMax`/`reroll`/`weightBoost` cover spec/01's
  four named manipulations.
- **Cheater hooks**: `retargetQueuedAction` (OQ-07) lets a priority-tier effect redirect a
  same-turn queued action via a `resolver.ts`-owned override map (`applyEffect` stays pure — it
  only reports the request); Ability Lock and Energy Lock both got a real hook via a new
  `ActiveStatus.param` field (resolving two of OQ-29's three parameter-blocked statuses); Energy
  Cost Increase adds its magnitude onto NEUTRAL cost (`getEffectiveCost`, actions.ts); "punish
  repeated abilities" is just a `usedAbilityLastTurn`/`abilitySequenceMatches` condition check —
  no new engine primitive needed.

**Files created:** `packages/engine/src/{conditions,triggers,transformations,summons,snapshot,
rng-modifiers,test-support}.ts` and test files for all but `test-support.ts` (shared test
fixture helper, not part of the public API); `packages/content/src/schemas/passive.ts`.
**Files changed:** `packages/content/src/schemas/{common,condition,battle,effect,index}.ts`
(Resource display fields; Trigger.relation + onHpThreshold; ActiveStatus.param, RngModifier,
CharacterStats, SummonRuntimeState, and CharacterRuntimeState's resources/abilityIds/passiveId/
abilityHistory/stats/pendingRngModifiers; the erase/resurrect/modifyRandomOutcome/
retargetQueuedAction effect kinds); `packages/engine/src/{energy,damage,effects,actions,resolver,
index}.ts`; test fixtures across `{statuses,damage,targeting,effects,resolver}.test.ts` updated
for the new required CharacterRuntimeState/EffectState/EffectContext/ResolveTurnDeps fields.

**Tests:** 179 passing (up from 124): triggers.test.ts (18, one per trigger type plus relation
filtering, conditional gating, and the recursion guard), snapshot.test.ts (3), rng-modifiers.test.ts
(9), plus new coverage in damage.test.ts (death prevention, summon absorption with overflow),
effects.test.ts (summon, transformInto, erase, resurrect + resurrection lock, all five RNG
manipulation modes, retargetQueuedAction, modifyResource clamping, conditional), and
resolver.test.ts (Ability Lock end to end, same-turn Cheater retargeting, erasure genuinely not
firing a watching passive vs. a normal death firing it). `pnpm run ci` is green, verified on
GitHub Actions directly.

**Deviations:** logged as ADR-010 (twelve numbered decisions — see docs/DECISIONS.md for the full
list: passive/status trigger evaluation, subject-targeted reactive effects, the recursion guard,
erasure-as-distinct-event, kill attribution, death prevention, summon absorption, transformation
HP rescaling, RNG modifier semantics, the new ActiveStatus.param, and the conditions that still
always return false).

**New open questions:** OQ-31 (reactive-effect targeting, hasTag/secretScript always false,
onMatchStart not wired, onTurnStart/End's per-character firing convention, onHpThreshold's lack of
edge-detection), OQ-32 (slot-occupying summons aren't independently targetable yet), OQ-33
(Transformation.changes.tags/energyCostOverrides not applied to runtime state). OQ-29 is
partially resolved (5 of its original blockers fixed; 8 statuses remain data-only).

**Custom scripts:** none.

**Recommended next step:** Phase 04 ("First five prototypes") — the first real character kits.
This is where several Phase 03 simplifications will get their first real pressure test: whichever
deferred statuses these five characters actually need, whether reactive effects need real
targeting beyond "the event's subject," and whether slot-occupying summons need to become fully
independent units.
