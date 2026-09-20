# The Marionettist
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `the-marionettist.ts` · RARE · FOLKLORE/CONTROLLER/SUMMONER · 100 HP

## Identity / win condition
A puppeteer. Wooden Fist is 20; **Raise a Puppet** puts a 40-health puppet on stage for 3 turns; **Strings Taut** slows the recovery of every ability the enemy has for 2 turns (the first user of Cooldown Increase in a kit); **Marionette Dance** stuns for a turn (Spirit 1, 3-turn cooldown).

## Counterplay
100 HP and small numbers. A dispel removes the slowdown, area damage clears the puppet, and the Dance is a 3-turn cooldown.

## Readability
One effect per ability.

## Deviations
The puppet reuses the pet shape (a health pool, a duration, no team slot); it has no actions of its own (OQ-75). Tested in `packages/engine/src/scenarios/region7.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/the-marionettist/baseHp` is now **110**
- `abilities/ability.the-marionettist.wooden-fist/effects/0/amount` is now **30**
