# Architecture

Written at Phase 00. Restates and confirms ADR-001 (tech stack) and ADR-002 (client-only platform)
from `docs/DECISIONS.md`.

## Packages and data flow

```
packages/content  (bundled, read-only)
      │  CharacterDefinitions, Abilities, Effects, Statuses, Transformations,
      │  Summons, config (EnergyRules, ResolutionOrder, MatchFormat, BalanceVersion),
      │  CharacterArtSpecs — all zod schemas + validated default data.
      ▼
packages/engine   (pure, deterministic)
      │  Consumes content definitions + a PlayerAction per character per turn.
      │  Produces a new BattleState + BattleEvent[] for the turn. No I/O.
      ▼
   ┌──┴───────────────┬────────────────────┐
   ▼                  ▼                    ▼
apps/web          packages/ai        packages/persistence
(React UI,        (bots, headless    (IndexedDB: Profile, Unlocks, Mastery,
 renders state     simulation in a    MatchHistory, Replays, LocalRanking,
 + event log)      Worker/Node CLI)   AchievementProgress, Settings, ...)
```

`apps/web` is the only package that depends on all four others; it is the static app that ships.
There is no server package and no package may perform network I/O outside the optional,
allowlisted P2P module (spec/06, "Live peer-to-peer").

## Determinism strategy (CLAUDE.md rule 4)

- `packages/engine` has zero runtime dependencies besides `@veilbreak/content` (types only) and
  never calls `Math.random`, `Date.now`, or `new Date()` with no arguments. This is enforced by an
  ESLint rule scoped to `packages/engine/src/**/*.ts` (`eslint.config.js`), not just convention.
- All randomness flows through a seeded RNG whose *state* is serialized as part of `BattleState`
  (`rngState: string`). The concrete RNG algorithm is chosen in Phase 01; the schema only commits
  to "the seed/state round-trips as a string," which keeps replays and friend-match verification
  possible regardless of which algorithm is picked.
- Integer math only in combat logic (no floats), so the same seed + same actions + same
  `BalanceVersion` produce an identical result on any browser or device.
- `BattleEvent.turnRelativeSequence` orders events deterministically within a turn without ever
  reading the wall clock.

## Persistence and save-migration strategy (spec/06)

`packages/persistence` (built out in Phase 09) owns all player-data schemas — Profile,
UserCharacters, Unlocks, Mastery, Teams, MatchHistory, Replays, LocalRanking,
AchievementProgress, MissionProgress, DiscoveredSecrets, Settings — and is the only package that
touches IndexedDB. It depends on `@veilbreak/content` for shared types (e.g. a `MatchHistory`
entry references the `BalanceVersion` id and character ids it was played with) but content never
depends back on persistence.

Every persisted document schema carries an explicit version field. A migration runner applies
forward migrations in order before any write in a newer schema version can occur; a rolling
backup (last 3 snapshots) is taken immediately before migrating, so a bad migration is
recoverable (OQ-24). Save data is treated as untrusted input at every read: schema-validated,
size-limited, never `eval`'d or injected as HTML (CLAUDE.md "Security (client-only)").

## Versioning strategy

- **Content/balance:** `CharacterDefinition.version` and `BalanceVersion` are separate concepts.
  `BalanceVersion` stamps a whole ruleset snapshot; every match and every persisted replay records
  the `BalanceVersion` id it ran under. All shipped `BalanceVersion`s stay in the build, so old
  replays keep resolving after a balance patch (spec/02 "Balance versioning", OQ-17).
- **Save schema:** persistence's own schema version is independent of `BalanceVersion`. A save
  file only stores stable IDs and progress counters, never numeric indices into a roster array,
  so renamed/reordered/removed content is handled by migrations rather than breaking saves
  (OQ-17).

## Turn-resolution algorithm (pseudocode)

Implemented starting in Phase 01; this is the contract the engine's `resolveTurn` function must
satisfy, reading tier order from `ResolutionOrder` config rather than hard-coding it
(CLAUDE.md rule 5).

```
function resolveTurn(state: BattleState, actions: PlayerAction[]): { state: BattleState, events: BattleEvent[] }:
    assert actions are legal for `state` (cost affordable, cooldown ready, legal target per TargetRule)
        — an illegal action is rejected during planning, never silently dropped mid-resolution

    events: BattleEvent[] = []
    queue: QueuedAction[] = actions mapped to their ability's effects, tagged with resolution tier

    for tier in resolutionOrder.tiers sorted by `order`:           // spec/01 resolution stack
        tierActions = queue entries whose current tier == tier.id
        orderedTierActions = sortWithinTier(tierActions, state)    // OQ-02: initiative alternates
                                                                    //   each turn (seeded coin flip
                                                                    //   on turn 1); within a player,
                                                                    //   ally slot 1→3. Deterministic.
        for action in orderedTierActions:
            if action.source is dead or silenced/stunned-out of this action: skip, log event
            resolvedEffects = evaluate action.effects against `state`   // conditions, target rules,
                                                                          // random outcomes via RNG
            state, newEvents = applyEffects(state, resolvedEffects)
            events += newEvents
            # a Cheater's queue-modifying effect (OQ-07) may re-target or reorder
            # *later* entries in `queue` here — always logged, per CLAUDE.md rule 9

        if tier.id == "death-checks":
            state, deathEvents = checkDeaths(state)                // simultaneous-death → draw (OQ-09)
            events += deathEvents
            # death-triggered-effects tier runs immediately after, seeing the up-to-date state

    state.turn += 1
    if state.turn >= state.matchFormat.maxTurns:
        state, endEvent = resolveMaxTurnsTiebreak(state)            // OQ-14: higher total HP% wins
        events += [endEvent]

    return { state, events }
```

Key invariants this pseudocode must preserve once implemented:
- Every branch that changes state emits a `BattleEvent`, even hidden ones (`knowledgeLevel:
  "TRUE_SECRET"` events still exist in the log — CLAUDE.md rule 9, OQ-13).
- `sortWithinTier` never uses `Math.random`; the "coin-flip" in OQ-02 is a draw from the seeded RNG
  stored in `state.rngState`, recorded so it replays identically.
- The same function runs client-side for solo play, inside a friend match after both players
  reveal their actions (spec/06), and inside `packages/ai`'s headless simulation — one resolver,
  no duplicated logic.

## Tech stack — ADR-001/ADR-002 status

Both accepted as proposed, with one addition (see `docs/DECISIONS.md` ADR-003): workspace packages
are consumed as TypeScript source directly (via each package's `main`/`types` pointing at
`src/index.ts`) rather than pre-built to `dist/`. `apps/web` is the only package with a real build
step (`vite build`). This keeps Phase 00–08 iteration fast; nothing here blocks adding a build
step to an individual package later if it ever needs to ship standalone.
