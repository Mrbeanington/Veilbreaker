# The Oracle
**Data:** `the-oracle.ts` · RARE · MYTHOLOGY/SUPPORT/MAGE · 100 HP

## Identity / win condition
**Prophecy**: Foretell puts `status.foretold` on an enemy for 3 turns: the next time it takes damage, it takes 30 more affliction damage, once (the status removes itself first, so it can never chain). **Fate's Verdict** deals 60 to a foretold enemy and spends the prophecy, or 20 otherwise. Warning Dream shields an ally for 30; Sibylline Riddle silences for a turn.

## Counterplay
Foretell is a set-up, not damage: it does nothing unless someone else hurts the target within 3 turns, and a Dispel removes it. She has 100 HP and Spirit-heavy costs. The extra damage is affliction so it cannot be dodged with Invulnerable, but it is a single 30.

## Readability
One sentence per ability. The status text says "once".

## Deviations
A DoT tick counts as damage, so a poison tick can fulfil the prophecy early (documented in the status tooltip's spirit: "the next time it takes damage"). Adds `status.foretold` to the status library (34th). Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
