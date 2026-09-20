# The Gunslinger QB
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `the-gunslinger-qb.ts` · RARE · ATHLETE/ATTACKER/RANDOM · 100 HP

## Identity / win condition
A quarterback who always throws deep. Quick Slant is 20; **Long Bomb** lands at random: intercepted (10 to the enemy and **20 to him**), a 40 completion, or a 70 touchdown (1 in 5, 2 in 5 and 2 in 5); Play Fake weakens; Scramble makes him untargetable for a turn.

## Counterplay
The bomb is a real gamble: 1 in 5 throws cost him 20 of his 100 HP. Anything that forces his roll to its worst branch (**Madame Fortuna**'s Ill Omen) turns every bomb into an interception. Burst kills him fast.

## Readability
Every branch and its weight is printed.

## Deviations
Branches are listed worst to best (interception, completion, touchdown), so a Cheater's forced roll means what it says (ADR-027). Tested in `packages/engine/src/scenarios/region9.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `abilities/ability.the-gunslinger-qb.long-bomb/effects/0/outcome/branches/0/effects/1/amount` is now **10**
