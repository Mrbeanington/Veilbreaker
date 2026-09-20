# The Sphinx
**Data:** `the-sphinx.ts` · RARE · MYTHOLOGY/CONTROLLER/BEAST · 140 HP

## Identity / win condition
The riddler. **Riddle of the Three Ages** locks one of the enemy's Might, Focus or Spirit for 2 turns, chosen at random; Lion's Claw is 30; Stone Silence silences for a turn; Patient Stone heals her 20.

## Counterplay
The lock only stops abilities of one energy family and lasts 2 turns, and the enemy sees which family. It is a 3-turn cooldown. A team that spreads its costs shrugs it off.

## Readability
The three outcomes are listed, and the lock is a normal status.

## Deviations
The random lock reuses `status.energy-lock` with the family as its parameter (first used by Frost Jotunn). Tested in `packages/engine/src/scenarios/region5.scenario.test.ts`.
