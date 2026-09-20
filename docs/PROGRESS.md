# Progress

**Current phase:** 13 in progress: regions 1-9 done (110 of 120 characters built). Next: region 10 (Music / Entertainment / Chaos), one region per session.

| Phase | Title | Status |
|---|---|---|
| 00 | Architecture and scaffolding | ☑ |
| 01 | Battle state, resolver, RNG, energy | ☑ |
| 02 | Combat primitives | ☑ |
| 03 | Advanced systems | ☑ |
| 04 | First five prototypes | ☑ |
| 05 | Playable local 3v3 | ☑ |
| 06 | Remaining 15 prototypes | ✅ done |
| 07 | Bots and headless simulation | ✅ done |
| 08 | Full client UI | ✅ done |
| 09 | Local profile, persistence, progression, unlocks | ✅ done |
| 10 | Friend matches (serverless) | ✅ done |
| 11 | Local ranked | ✅ done |
| 12 | Dev-mode balance tools & local analytics | ✅ done |
| 13 | Scale the roster to 120 | 🔄 region 9 of 11 done |
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

### 2026-09-18 — Phase 04
Built the first five real character kits on top of Phases 01–03, plus the small engine extensions
they forced:
- **Tortuga Rex** (CORE tank): Shell Bash, Fortress Shell, Ancient Patience, and Shellquake — the
  required "conditional on prior defensive setup" mechanic, via the existing `conditional` effect +
  `hasStatus` condition against his own Damage Reduction. No new engine work needed.
- **Mister Whiskers** (CORE Cheater) + a stubbed **Whiskers, Devourer of Worlds** (SECRET): Nine
  Lives (pre-charges Death Prevention out of a Lives Remaining resource, since a passive can't react
  to its own holder's death — `evaluateEvent` skips characters once `alive: false`), Paw Swap
  (the documented Cheater rule-break, retargeting a queued attack), Black Cat's Crossing (energy
  theft), and Copycat's Gamble/Nine Lives' Favor (randomness + probability manipulation).
- **Patient Zero** (CORE): Bite/Festering Wound/Shambling Grasp/Outbreak Pulse, Infection now a real
  ticking status (just `tickBehavior: "damageOverTime"` — zero new engine code), and an automatic,
  in-match evolution (Patient Zero → The Infected → The Outbreak) driven by his own passive rather
  than the (never automatically evaluated — see OQ-34) `Transformation.trigger` field.
- **Moonshot Maddox** (CORE): a Bases/Strikes resource pair, four abilities, and one passive ("At the
  Plate") that centralizes every base-advance and strikeout check — required because an ability's
  effects all share its own resolved targets, so an enemy-targeted swing can't also modify Moonshot's
  own resources in the same cast.
- **Malachar, Lord of the Last Breath** (SECRET): a Souls economy (passive: gains a Soul on any
  unconsecrated death, via a new `Trigger.effectTarget: "self"`), Raise the Forgotten (Thrall summon),
  Borrowed Life (lifeTransfer, via a new effect-level `{ side: "self" }` target override), Corpse
  Command, You Belong to Me (a slot-occupying "temporary fourth fighter" summon), and Embrace the
  Throne (the Death King transformation). Consecration's four blocks (souls, resurrection, thralls,
  corpse use) are wired up — resurrection at the engine level, the other three through the shared
  Souls economy — and tested with a minimal test-fixture ability standing in for Father Bell's
  not-yet-built passive, exactly as phase-04-first-five.md itself proposes.
- **Art:** `CharacterArtSpec`/`CharacterVisualBible` restructured to match spec/04's documented schema
  (identity anchors; splash/portrait/battle-avatar/ability-icon/transformation/secret-silhouette
  prompts), a `composePrompt` function composing every prompt from a character's bible + shot type +
  the global art language, and `missingIdentityAnchors` for spec/04's own validation step. All six
  characters (including the stub) have full art specs; Patient Zero, Malachar, and the Devourer of
  Worlds stub also have transformation/secret-silhouette prompts.
- **Coverage matrix:** `packages/content/coverage.md`, generated by `pnpm run generate-coverage`
  (`packages/content/src/coverage.ts` + a thin `scripts/generate-coverage.ts` wrapper) from each
  character's actual ability/passive/transformation data — never hand-maintained.
- **Tooltips:** `generateAbilityTooltip` composes cost/cooldown/effect text directly from an
  `Ability`'s data, so a tooltip can't silently drift from what the ability's numbers actually do.

**Files created:** `packages/content/src/data/characters/{helpers,tortuga-rex,mister-whiskers,
whiskers-devourer-of-worlds,patient-zero,moonshot-maddox,malachar,index}.ts`,
`packages/content/src/{coverage,coverage.test,tooltip,tooltip.test}.ts`,
`packages/content/scripts/generate-coverage.ts`, `packages/content/schemas/art.test.ts` (as
`packages/content/src/schemas/art.test.ts`), `packages/engine/src/scenarios/{scenario-support,
tortuga-rex.scenario.test,mister-whiskers.scenario.test,patient-zero.scenario.test,
moonshot-maddox.scenario.test,malachar.scenario.test}.ts`, `docs/design/characters/{tortuga-rex,
mister-whiskers,patient-zero,moonshot-maddox,malachar}.md`, `packages/content/coverage.md` (generated
output).
**Files changed:** `packages/content/src/schemas/{condition,effect,character,art}.ts` (ADR-011's new
fields/functions), `packages/content/src/data/statuses.ts` (Infection's real hook, tooltip text for
statuses Phase 03 already implemented but never updated), `packages/content/src/index.ts` (new
exports), `packages/engine/src/{triggers,effects}.ts` (ADR-011), `packages/content/{package.json,
tsconfig.json}` (the `generate-coverage` script and its Node types), `package.json` (the
`generate-coverage` script, `tsx` devDependency), `packages/content/src/data/statuses.test.ts` (the
DoT-list assertion, now including Infection).

**Tests:** 225 passing (up from 179): 41 net new across `effects.test.ts` (+9: effect-level
self-targeting, retarget defaults, consecration blocks resurrection), `triggers.test.ts` (+2:
`effectTarget`), `art.test.ts` (+6, new), `coverage.test.ts` (+7, new), `tooltip.test.ts` (+5, new),
and 5 new `packages/engine/src/scenarios/*.scenario.test.ts` files (+20: one scripted multi-turn
battle suite per character, exercising every required signature mechanic end-to-end through real
`createBattle`/`resolveTurn` calls with the real content libraries, not hand-rolled fixtures).
`pnpm run ci` is green locally; pushed and confirmed green on GitHub Actions.

**Deviations:** logged as ADR-011 (nine numbered decisions — new `Trigger.effectTarget`, Consecration
blocking resurrection at the engine level, optional `retargetQueuedAction` fields, effect-level
`{ side: "self" }` targeting, Infection's real hook, `defaultResourcesFor`, the art-spec restructure,
Malachar's corpse-mechanic approximations, and the one-passive-slot design pattern), plus a design doc
per character (`docs/design/characters/*.md`) recording each character's own simplifications in
detail.

**New open questions:** OQ-34 (`Transformation.trigger` is never automatically evaluated — every
transform fires from an explicit ability/passive/status effect), OQ-35 (no ability can target a dead
character through the normal action pipeline), OQ-36 (per-effect targeting beyond `"self"`, and
corpse-identity tracking, aren't implemented). OQ-29 is further resolved (Infection and Soul
Consecration now have real hooks; 6 statuses remain data-only). OQ-31(a) is partially resolved
(`effectTarget: "self"` exists; a full resolved `TargetRule` for reactive effects still doesn't).

**Custom scripts:** none — see the (empty) registry entry in `docs/DECISIONS.md`.

**Recommended next step:** Phase 05 ("Playable local 3v3") — the first real UI wiring these five
characters (plus the engine) into an actual playable match, which is also where a "build a
`CreateBattleTeamInput` from a chosen roster" helper (using `defaultResourcesFor` and friends) will
want a proper home outside test fixtures.

### 2026-09-18 — Phase 05
Built the first playable match in `apps/web`, entirely driven by the engine:
- **Screens/components:** Home (mode + settings), team picker (implemented roster, no duplicates
  within a team), match screen (both teams, HP bars, status chips with text, custom-resource chips —
  Bases/Souls/etc. always visible, energy pool, generated ability tooltips with cost/cooldown state,
  target selection, queued-actions panel with change/confirm, battle log, turn timer), pass-the-device
  screen for hotseat, result screen. Placeholder portraits are initials + hash-derived hue.
- **Bot:** `packages/ai` `decideSimpleBotActions` (random legal action, prefers lethal-looking hits,
  legality via the real `validateAction`), run in a Web Worker (`apps/web/src/game/bot.worker.ts`).
- **PWA foundation:** generated manifest + placeholder SVG icons (`scripts/generate-manifest.ts`, from
  `GAME_TITLE`), hand-written precaching service worker built by a small Vite plugin; verified in
  `vite preview` (manifest fetch, SW registered/active, Cache Storage contents).
- **Settings:** animation speed, reduced-motion honored, turn timer toggle. Keyboard play via native
  buttons throughout.
- **Also added:** `RESOURCE_LIBRARY` (content), `client-only` allowlist entry for `sw.js`.
- Bugs found by actually playing in the browser pane: turns unconfirmable when a character had no
  affordable action (added explicit Pass); half-chosen target could leak across pass-device (cleared
  on confirm); service worker didn't precache index.html and never pruned old caches (both fixed).

**Files created:** `apps/web/src/{components,game,screens,settings}/*`, `styles.css`,
`registerServiceWorker.ts`, `apps/web/{sw-template.js,scripts/generate-manifest.ts}`,
`packages/ai/src/simple-bot{,.test}.ts`. **Changed:** `apps/web/{index.html,package.json,tsconfig.json,
vite.config.ts,src/App.tsx,src/main.tsx}`, `packages/content/src/data/characters/index.ts`,
`packages/ai/src/index.ts`, `eslint.config.js`, `scripts/verify-client-only.mjs`, `.gitignore`.

**Tests:** 237 passing (up from 225): 7 web component tests (action selection, validation feedback,
pass, timer expiry), 4 bot tests, 1 RESOURCE_LIBRARY test. `pnpm run ci` green.

**Deviations:** ADR-012. **New open questions:** OQ-37 (bot lethality heuristic), OQ-38 (no error
boundary), OQ-39 (settings not persisted). **Custom scripts:** none.

**Recommended next step:** Phase 06 ("Remaining 15 prototypes").

### 2026-09-19 — Phase 06, batch 1
Father Bell, The Plague Doctor, Behemoth (Legend), Shiro (Legend), Hydra: full data, art specs (Legends with reveal prompts), design notes (`docs/design/characters/`), coverage matrix regenerated. New `status.unhealable`; ADR-013. Required tests in `packages/engine/src/scenarios/batch1.scenario.test.ts`: Malachar vs. the real Father Bell, Behemoth no-heal (incl. dispel), Plague Doctor anti-heal/reduction vs. each healing class, Shiro erasure vs. death triggers, Hydra heads. Both Legends name two roster counters. **Tests:** 250 (up from 237). **Open:** OQ-40, OQ-41. **Remaining:** Koschei, Baba Yaga, Nine-Tailed Trickster, Referee, Gambler, Maestro Nocturne, Zeiron, Black Knight, Emperor Zero, Nameless One.

### 2026-09-19 — Phase 06, batch 2
Koschei (Death Seals), Baba Yaga, The Nine-Tailed Trickster (tails -> Ascension), The Gambler (probability/Chips), Zeiron (Legend): data, art specs, design notes, coverage regenerated, ADR-014. No engine changes. 18 new scenario tests in `batch2.scenario.test.ts` (Seals surviving a lethal blow; Ascension at 9 tails; Fox Fire Burn blocking Hydra's Regrow; Gambler roll consistency/determinism/Loaded Dice; Baba Yaga hut/flight/passive; Zeiron Wrath, Hush counter, Broken Crown). OQ-41 resolved. **Remaining:** The Referee, Maestro Nocturne, Black Knight, Emperor Zero, The Nameless One.

### 2026-09-19 — Phase 06, batch 3 (Phase 06 complete)
The Referee (Fouls/ejection), Maestro Nocturne (tempo), The Black Knight (Legend), Emperor Zero (Legend), The Nameless One (Final Legend, rewind): data, art specs (Legend reveal prompts; Nameless One locked silhouette and unlocked reveal), design notes, coverage regenerated. **Generic engine additions (ADR-015):** `repeatedAbility` condition, runtime `tags` (real `hasTag`), the `@lastUsed` ability token, the `onWouldDie` trigger and the `rewindTurn` effect (resolver restores the turn-start state, keeping the RNG stream, append-only log and spent charge). 33 new tests in `batch3.scenario.test.ts`, covering all of spec/07's rewind list (every state field, RNG, once-per-battle, death-prevention precedence, simultaneous death, erasure bypass, log, replay determinism). Web: `tags` passed into `createBattle`, `turnRewound` log line. **Files:** `packages/content/src/schemas/{condition,effect,battle}.ts`, `packages/content/src/{tooltip,coverage}.ts`, five new `packages/content/src/data/characters/*.ts` plus `index.ts`, `packages/engine/src/{conditions,effects,resolver,test-support}.ts`, `packages/engine/src/scenarios/batch3.scenario.test.ts`, `apps/web/src/game/{setup,describeEvent}.ts`, five design notes, `packages/content/coverage.md`, DECISIONS/OPEN-QUESTIONS. OQ-40 resolved; OQ-42 (rewind vs friend-match commit-reveal), OQ-43 (Ability Lock is single-slot) opened. **Custom scripts:** none. **Recommended next step:** Phase 07.

### 2026-09-19 — Phase 07 (bots and headless simulation)
`packages/ai`: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT and a LEGEND_BOSS framework (`bots.ts`, `heuristics.ts`, `evaluate.ts`, `candidates.ts`, `prng.ts`); headless simulator with ten degenerate-pattern detectors, stats and markdown/JSON report (`simulate.ts`, `report.ts`); Node CLI `pnpm sim` (`packages/ai/scripts/sim.ts`). Web bot worker now runs the ladder with a time budget. `PLAYABLE_CHARACTERS` exported from content. **Acceptance:** 3 x 10,000 matches (BEGINNER, INTERMEDIATE, EXPERT) over the 20 prototypes with 0 engine errors; reports in `docs/balance/`, summary and recommendations in `report-2026-09-19.md` (recommendations only, nothing changed). **Headline findings:** second player wins ~64% (caused by the OQ-03 turn-1 energy skip); widespread energy starvation; Patient Zero and Hydra strong, Maestro weak. **Tests:** 320 (up from 301). ADR-016; OQ-44 to OQ-47. **Files:** `packages/ai/src/*`, `packages/ai/scripts/sim.ts`, `packages/ai/package.json`, root `package.json`, `packages/content/src/data/characters/index.ts`, `apps/web/src/game/{bot.worker,roster}.ts`, `docs/balance/*`, docs. **Custom scripts:** none. **Recommended next step:** Phase 08.

### 2026-09-19 — Phase 08 (full client UI)
Main navigation (Play, Characters, Teams, Ranked, Codex, Missions, Legends, Profile, Settings) with keyboard navigation, skip link and focus management; character select with search, role, origin, rarity, mastery, availability, favorites and recently played filters; team presets; Codex with knowledge levels fed by the player's own match logs; Legend Chamber (12 non-grid positions, Nameless One crowning, evolves with unlocks); full settings (interface size, high contrast, animation speed, reduced motion, sound, turn timer, bot skill, spoiler switch) persisted to IndexedDB through `packages/persistence`; silent sound-event hooks; self-hosted Cinzel font and inline SVG icons; bot skill wired through the Worker. Engine now logs `abilityUsed`. **Owner-delegated balance decision:** energy rules changed to 2 per living character and no turn-1 skip (first player 36.8% to 50.3%, lockouts down 68%, matches 36% shorter; see `docs/balance/report-2026-09-19.md`). **Bug fixed:** the match UI let a team queue more energy than it owned (crashed resolution). **Tests:** 351 (up from 320). ADR-017; OQ-44/45 resolved, OQ-48 to OQ-50 opened. **Files:** `packages/persistence/src/*`, `packages/engine/src/resolver.ts`, `packages/content/src/config/energy-rules.json`, `apps/web/src/{App,main,styles}`, `apps/web/src/{components,screens,game,settings,profile,sound}/*`, docs. **Custom scripts:** none. **Recommended next step:** Phase 09.

### 2026-09-19 — Phase 09 (local profile, persistence, progression)
`packages/persistence`: atomic saves with checksummed envelopes and 3 rolling backups, corrupted-write recovery, profile v2 with a migration runner, JSON backup export/import, compressed transfer codes with QR drawing and decoding, replay records and codes, hostile-input handling. Web: first-launch install screen and gentle re-ask, storage persistence and a "Progress protection" status, Profile screen (level, transfer send/receive with in-app camera scanner and paste, share-sheet backup, restore, optional auto-save to a file, match history, replay viewer with file import and `#replay=` links), Missions screen (missions, faction challenges, secret achievements), Legend trials with Legend unlocks and the Nameless One gate, replays recorded for every match. Bugs fixed: turn-limit end never reached the match screen; multi-key IndexedDB write did not abort on a bad value. **Tests:** 445 (up from 351). ADR-018; OQ-51 to OQ-55. **Not done:** Playwright/Lighthouse (OQ-51), local ranked and friend matches (later phases). **Custom scripts:** none. **Recommended next step:** Phase 10.

### 2026-09-19 — Phase 10 (friend matches, serverless)
New package `packages/protocol`: message schemas, compressed bundle codes, SHA-256 (Web Crypto), seed commit-reveal, per-turn commit-reveal with salt mixed into the RNG, balance and content-hash handshake, state-hash desync detection, resign, resumable JSON sessions. Web: Friend Match (start, join, continue; copy, share and link; verification badge; resign; own-unlocks/everything-unlocked rule; asynchronous, saved in IndexedDB; finished matches recorded with a replay). `#match=` links open the right screen. **Bugs fixed:** the engine let an action use an ability outside the character's kit (`abilityNotKnown`); the planner now checks energy in the protocol's payment order. Stretch WebRTC: not attempted (logged in ADR-019). **Tests:** 484 (up from 445). ADR-019; OQ-56 to OQ-59. **Custom scripts:** none. **Recommended next step:** Phase 11.

### 2026-09-19 — Phase 11 (local ranked)
The Ranked section is now a working ladder against bots. Hidden Elo rating, 16 visible divisions (Bronze III to Diamond I, then Veilbreaker), five placement matches per season, calendar-month seasons with archive and half-reset, streaks, personal bests, most-played stats, best seasons (a local personal-best leaderboard) and recent matches. Bots scale in skill and team quality by division and draw teams from a measured meta pool (`pnpm meta`, `packages/ai/src/meta-pool.json`); Legend policy per OQ-05; pick/ban (four picks, one ban each) at Diamond and above. A match left unfinished is saved as pending and counts as a loss. All state is the profile's `ranked` block (**profile v3**, migration 2 to 3) and is in backups and transfer codes. Play screen has a Ranked Ladder card. **New:** `packages/persistence/src/ranked.ts`, `packages/ai/src/{ladder,meta}.ts`, `packages/ai/src/meta-pool.json`, `packages/ai/scripts/meta.ts`, `apps/web/src/game/ranked.ts`, `apps/web/src/screens/RankedScreen.tsx`, tests for each. **Changed:** `packages/persistence/src/{profile,codec,replay,index}.ts`, `packages/ai/src/index.ts`, `apps/web/src/{App.tsx,components/TeamPicker.tsx,game/finishMatch.ts,game/progression.ts,screens/{PlayScreen,ResultScreen,HistoryPanel}.tsx}`, root and ai `package.json` (`pnpm meta`), `apps/web/src/App.test.tsx`, `platform.test.ts`. **Removed:** `PlaceholderScreen.tsx`. **Bugs fixed:** the team picker could not hold more than three; Friend matches were labelled "Hotseat" in history. **Tests:** 567 (up from 485). ADR-020; OQ-05 resolved; OQ-60 to OQ-64. **Custom scripts:** none. **Recommended next step:** Phase 12.

### 2026-09-19 — Phase 12 (dev-mode balance tools and local analytics)
**Balance drafts:** `packages/content/src/balance.ts` (tunable discovery, `BalanceDraft` schema, atomic `applyBalanceDraft` with diff, warnings and schema re-validation, `SHIPPED_BALANCE_PATCHES`, `librariesForVersion`); replays now resolve under their own balance version. **Dev mode** (`apps/web/src/dev/*`, opened with `?dev=1`): draft manager in IndexedDB, searchable and filterable value editor, diff and validation, Worker simulation of shipped vs. draft with outlier flags and recommendations (never applied automatically), JSON export and import. `pnpm sim --balance file.json` runs a draft from the terminal. **CI guard:** `scripts/verify-no-dev-mode.mjs` (added to `pnpm ci`) proves the production build has no dev-mode code and self-tests with a `VITE_DEV_MODE=1` build. **Player stats** (Profile screen): win rates by fighter, team and opponent, favourite abilities and transformation counts. History entries record the side played. Docs: `docs/design/balance-workflow.md`. **Files:** `packages/content/src/{balance,balance.test,index}.ts`, `packages/ai/{src/simulate,src/index,scripts/sim}.ts`, `packages/persistence/src/profile.ts`, `apps/web/src/dev/*`, `apps/web/src/game/{stats,stats.test,balanceReplay.test,setup,replay,progression}.ts`, `apps/web/src/screens/{StatsPanel,StatsPanel.test,ProfileScreen}.tsx`, `apps/web/src/{App.tsx,vite-env.d.ts}`, `apps/web/vite.config.ts`, `vitest.config.ts`, `scripts/verify-no-dev-mode.mjs`, root `package.json`, docs. **Tests:** see CI (up from 567). ADR-021; OQ-65 to OQ-69. **Custom scripts:** none. **Recommended next step:** Phase 13.

### 2026-09-19 — Phase 13, region 1 (Ancient Mediterranean)
**13 new characters:** Asterion, Medusa, Charon, The Bronze Giant, Arachne, Cyclops Brontes, The Oracle, Cerberus, The Siren, Nemesis, Hecate's Disciple, and the Secrets Icarion and The Forgotten Titan (Hydra and Zeiron already existed; region complete at 15). Each has data, art spec and visual bible, a design note (`docs/design/characters/`), and signature-mechanic scenario tests (`packages/engine/src/scenarios/region1.scenario.test.ts`, 50 tests). New status `status.foretold`. **Engine bug fixed:** a damage effect's `target` (self) was ignored, so self-damage hit enemies (regression tests). **Checks:** coverage matrix regenerated (uncovered mechanics 24 to 5; several detectors were hard-coded "none" and now read data); template-overlap check added (no pair over 70%, closest 60%); 5,000-match simulation, 0 engine errors, outliers recorded in `docs/balance/phase13-region1-notes.md` (Forgotten Titan 67%). Ranked meta pool regenerated (60,000 matches, roster-scaled threshold). **The Island King:** backlog design note only. **Files:** `packages/content/src/data/characters/{asterion,medusa,charon,the-bronze-giant,arachne,cyclops-brontes,the-oracle,cerberus,the-siren,nemesis,hecates-disciple,icarion,the-forgotten-titan}.ts`, `index.ts`, `helpers.ts`, `statuses.ts`, `coverage.ts` (+ tests), `region1.roster.test.ts`, `packages/engine/src/effects.ts`, `packages/ai/{src/ladder.ts,src/meta-pool.json,scripts/meta.ts}`, `packages/content/coverage.md`, design notes, `docs/balance/*`, docs. **Tests:** see CI (up from 608). ADR-022; OQ-70 to OQ-74. **Custom scripts:** none. **Recommended next step:** region 2, Japanese Folklore / Ink Realm (15 characters; 2 already exist: The Nine-Tailed Trickster and Shiro).

### 2026-09-19 — Phase 13, region 2 (Japanese Folklore / Ink Realm)
**13 new characters:** Red Oni, Blue Oni, Kappa Kiro, Yuki-Onna, Tengu Swordsman, Lantern Spirit, Umbrella Yokai, The Paper Monk, Nekomata, The Mirror Samurai, Gashadokuro, and the Secrets Oni of the Red Gate and The Painted Ronin (The Nine-Tailed Trickster and Shiro already existed; region complete at 15). Data, art, design notes and 41 scenario tests each. **Engine:** `TargetRule.includeDead` (resurrection targets the fallen; engine, match screen and bots), and a dying character's own `self` onDeath trigger now fires. **Firsts:** resurrection (Nekomata), a pet (Paper Crane Familiar), ink, energy generation, ice, a decaying resource, `teamComposition`. **Checks:** coverage matrix (only relics uncovered), template overlap (no pair over 70%, closest 60%), 5,000-match simulation, 0 engine errors (notes in `docs/balance/phase13-region2-notes.md`). **QR scale fix:** transfer codes send each pair table's strongest 300 pairs only (a maxed profile no longer fit at 46 characters). Ranked meta pool regenerated (46 characters). Shared roster test kit (`regionRoster.testkit.ts`). **Files:** thirteen `packages/content/src/data/characters/*.ts`, `index.ts`, `schemas/common.ts`, `coverage.ts`, `regionRoster.testkit.ts`, `region{1,2}.roster.test.ts`, `packages/engine/src/{targeting,triggers}.ts` (+ tests, `scenarios/region2.scenario.test.ts`), `apps/web/src/screens/MatchScreen.tsx`, `packages/persistence/src/{codec,index}.ts`, `packages/ai/src/meta-pool.json`, design notes, `docs/balance/*`, docs. **Tests:** see CI (up from 673). ADR-023; OQ-75 to OQ-79. **Custom scripts:** none. **Recommended next step:** region 3, Slavic / Russian Night (12 characters; Baba Yaga and Koschei already exist).

### 2026-09-20 — Phase 13, region 3 (Slavic / Russian Night)
**10 new characters:** Leshy, Domovoi, Rusalka, Father Frost, The Birch Witch, Zmey Gorynych, The Firebird, One-Eyed Likho, Marya the Warrior, and the Secret The Midnight Tsar (Baba Yaga and Koschei already existed; region complete at 12). Data, art, design notes and 30 scenario tests each. **No engine changes**: the Firebird's rebirth reuses `onWouldDie` with `setHp`; Domovoi's shield uses a subject-targeted trigger; the Zmey's chain reuses the sequence condition. **Coverage:** the last uncovered mechanic (relics, The Midnight Tsar) is now covered, so **all 55 required mechanics have a character** and a test fails if that ever regresses. **Overlap:** Marya first overlapped Tortuga Rex by 75% and was reworked; no pair now exceeds 60%. **Simulation:** 5,000 matches, 0 engine errors, notes in `docs/balance/phase13-region3-notes.md` (Firebird 64%, Zmey 62%, Likho 42%). Ranked meta pool regenerated (56 characters). **Files:** ten `packages/content/src/data/characters/*.ts`, `index.ts`, `coverage.ts`, `coverage.test.ts`, `region3.roster.test.ts`, `packages/engine/src/scenarios/region3.scenario.test.ts`, `packages/ai/src/meta-pool.json`, design notes, `docs/balance/*`, docs. **Tests:** see CI (up from 724). ADR-024; OQ-80 to OQ-83. **Custom scripts:** none. **Recommended next step:** region 4, Northern / Celtic (11 characters; Morrigan [Legend] is not built yet either, so 11 are new).

### 2026-09-20 — Phase 13, region 4 (Northern / Celtic)
**11 new characters:** Draugr, Shieldmaiden Yrsa, The Berserker, Banshee, The Dullahan, Puca, Frost Jotunn, The Valkyrie, Fenris, the Secret The Wild Huntsman, and the Legend Morrigan, Mother of Crows (region complete at 11). Data, art, design notes and 32 scenario tests. **New:** `status.crow-prophecy` (35 statuses), Morrigan's Legend trial (`trial.morrigan`, seven Legends built), Legend checks in the shared roster test kit. **Engine fix:** `applyStatus` and `removeStatus` now honour an effect's `target` override (regression tests). **Checks:** coverage matrix regenerated with region 4 assertions, template overlap (no pair over 70%), 5,000-match simulation with 0 engine errors (notes in `docs/balance/phase13-region4-notes.md`), ranked meta pool regenerated for 67 characters. **Files:** eleven `packages/content/src/data/characters/*.ts`, `characters/index.ts`, `data/statuses.ts` (+ test), `coverage.test.ts`, `regionRoster.testkit.ts`, `region4.roster.test.ts`, `packages/engine/src/effects.ts` (+ test, `scenarios/region4.scenario.test.ts`), `apps/web/src/game/progression.ts`, `packages/ai/src/meta-pool.json`, `packages/content/coverage.md`, eleven design notes, `docs/balance/*`, docs. ADR-025; OQ-84 to OQ-86. **Custom scripts:** none. **Recommended next step:** region 5, Egypt / Desert / Ancient Kingdoms (11 new: Jackal Guardian, Scarab King, The Mummy Prince, Desert Djinn, Ifrit, The Sphinx, Sand Assassin, The Pharaoh Without a Tomb, The Living Sarcophagus, Anubian Judge [Secret], Aurelia [Legend]).

### 2026-09-20 — Phase 13, region 5 (Egypt / Desert / Ancient Kingdoms)
**11 new characters:** Jackal Guardian, The Scarab King, The Mummy Prince, Desert Djinn, Ifrit, The Sphinx, Sand Assassin, The Pharaoh Without a Tomb, The Living Sarcophagus, the Secret Anubian Judge, and the Legend Aurelia, Empress of the Sun (region complete at 11). Data, art, design notes and 35 scenario tests. **New:** `status.sun-guard` (36 statuses; a standing 1-HP floor, hook in `applyHp`), Aurelia's Legend trial (`trial.aurelia`, eight Legends built), two pet summons. **Engine:** an effect's `target` may be an all-enemies rule, so death and other triggers can affect the whole enemy team (regression test). **Checks:** coverage matrix regenerated with region 5 assertions, template overlap (no pair over 70%), 5,000-match simulation with 0 engine errors (notes in `docs/balance/phase13-region5-notes.md`), ranked meta pool regenerated for 78 characters. **Files:** eleven `packages/content/src/data/characters/*.ts`, `characters/index.ts`, `data/statuses.ts` (+ test), `coverage.test.ts`, `region5.roster.test.ts`, `packages/engine/src/{damage,effects}.ts` (+ `effects.test.ts`, `scenarios/region5.scenario.test.ts`), `apps/web/src/game/progression.ts`, `packages/ai/src/meta-pool.json`, `packages/content/coverage.md`, eleven design notes, `docs/balance/*`, docs. QR transfer cap 300 to 250 pairs (`packages/persistence/src/codec.ts`), favorites test picks a public fighter (`apps/web/src/App.test.tsx`). ADR-026; OQ-88 to OQ-91. **Custom scripts:** none. **Recommended next step:** region 6, World Folklore / Spirits / Tricksters (spec/03 #65 onward).

### 2026-09-20 — Phase 13, region 6 (World Folklore / Spirits / Tricksters)
**12 new characters:** Anansi, The Moon Rabbit, Jiangshi, Dokkaebi, The White Fox, The Roc, The Ghoul, The Wandering Genie, The Storyteller, The Monkey Trickster, the Secret The Thousand-Faced Stranger, and the Legend Madame Fortuna (region complete at 12). Data, art, design notes and 33 scenario tests. **New:** Madame Fortuna's Legend trial (`trial.madame-fortuna`, nine Legends built) and Cheater rule-break; no new statuses and no engine changes. **Convention:** random-outcome branches are listed worst to best (region 5's Twisted Wish reordered). **Checks:** coverage matrix regenerated with region 6 assertions, template overlap (two pairs reworked, none over 70%), 5,000-match simulation with 0 engine errors (notes in `docs/balance/phase13-region6-notes.md`), ranked meta pool regenerated for 90 characters. **Files:** twelve `packages/content/src/data/characters/*.ts`, `characters/index.ts` and `desert-djinn.ts`, `coverage.test.ts`, `region6.roster.test.ts`, `packages/engine/src/scenarios/region6.scenario.test.ts`, `apps/web/src/game/progression.ts`, `packages/ai/src/meta-pool.json`, `packages/content/coverage.md`, twelve design notes, `docs/balance/*`, docs. **QR transfer** now shrinks its pair tables to fit one code (`packages/persistence/src/codec.ts` + test). ADR-027; OQ-92 to OQ-95. **Custom scripts:** none. **Recommended next step:** region 7, Horror / Monsters / Dead (spec/03 #77 onward).

### 2026-09-20 — Phase 13, region 7 (Horror / Monsters / Dead)
**8 new characters:** The Headless Bride, The Marionettist, The Scarecrow, The Grave Digger, The Vampire Countess, The Collector, Ashmouth and The Thing Beneath the Bed (Patient Zero, The Plague Doctor, Malachar and Behemoth already existed; region complete at 12). Data, art, design notes and 22 scenario tests. **No engine changes, no new statuses, no new Legend or Secret.** **Firsts:** a repeatable resurrection of another character (Exhume), Cooldown Increase and a team-wide Energy Cost Increase in kits. **Checks:** coverage matrix regenerated with region 7 assertions, template overlap (no pair over 70%), 5,000-match simulation with 0 engine errors (notes in `docs/balance/phase13-region7-notes.md`), ranked meta pool regenerated for 98 characters. **Files:** eight `packages/content/src/data/characters/*.ts`, `characters/index.ts`, `coverage.test.ts`, `region7.roster.test.ts`, `packages/engine/src/scenarios/region7.scenario.test.ts`, `packages/ai/src/meta-pool.json`, `packages/content/coverage.md`, eight design notes, `docs/balance/*`, docs. `packages/ai/src/ladder.test.ts` and `packages/persistence/src/codec.test.ts` thresholds loosened. ADR-028; OQ-96, OQ-97. **Custom scripts:** none. **Recommended next step:** region 8, Animals / Weird Characters (spec/03 #89 onward).

### 2026-09-20 — Phase 13, region 8 (Animals / Weird Characters)
**7 new characters:** Sir Hopsalot, General Goose, The Honey Badger, Professor Octopus, King Croak, The Albino Gorilla and the Legend The Minotaur King (Tortuga Rex and Mister Whiskers already existed; Whiskers, Devourer of Worlds is a transformation stage of Mister Whiskers; region complete at 10). Data, art, design notes and 23 scenario tests. **New:** The Minotaur King's Legend trial (`trial.minotaur-king`, ten Legends built); no new statuses and no engine changes. **Checks:** coverage matrix regenerated with region 8 assertions, template overlap (three pairs reworked, none over 70%), 5,000-match simulation with 0 engine errors (notes in `docs/balance/phase13-region8-notes.md`), ranked meta pool regenerated for 105 characters. **Files:** seven `packages/content/src/data/characters/*.ts`, `characters/index.ts`, `coverage.test.ts`, `region8.roster.test.ts`, `packages/engine/src/scenarios/region8.scenario.test.ts`, `apps/web/src/game/progression.ts`, `packages/ai/src/meta-pool.json`, `packages/content/coverage.md`, seven design notes, `docs/balance/*`, docs. **Scale fixes:** `packages/persistence/src/codec.ts` (+ test) packs long id lists as bitsets; `packages/ai/scripts/meta.ts` minimum-games floor 3. ADR-029; OQ-98, OQ-99. **Custom scripts:** none. **Recommended next step:** region 9, Sports / Fighters (spec/03 #99 onward).

### 2026-09-20 — Phase 13, region 9 (Sports / Fighters)
**5 new characters:** Fourth & One, The Gunslinger QB, El Magnífico, The Contender and Ace (Mason "Moonshot" Maddox, The Referee and The Black Knight already existed; region complete at 8). Data, art, design notes and 14 scenario tests. **No engine changes, no new statuses, no new Legend or Secret.** **Checks:** coverage matrix regenerated with region 9 assertions, template overlap (no pair over 70%), 5,000-match simulation with 0 engine errors (notes in `docs/balance/phase13-region9-notes.md`), ranked meta pool regenerated for 110 characters. **Files:** five `packages/content/src/data/characters/*.ts`, `characters/index.ts`, `coverage.test.ts`, `regionRoster.testkit.ts` (ATHLETE tag), `region9.roster.test.ts`, `packages/engine/src/scenarios/region9.scenario.test.ts`, `packages/ai/src/meta-pool.json`, `packages/content/coverage.md`, five design notes, `docs/balance/*`, docs. ADR-030; OQ-100. **Custom scripts:** none. **Recommended next step:** region 10, Music / Entertainment / Chaos (spec/03 #107 onward).
