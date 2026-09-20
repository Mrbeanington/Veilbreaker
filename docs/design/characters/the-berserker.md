# The Berserker
**Data:** `the-berserker.ts` · CORE · MYTHOLOGY/WARRIOR/BRUISER · 140 HP

## Identity / win condition
Pain into fury. **Pain Is Fuel**: every wound gives him a Rage (max 4). Axe Flurry is two hits of 10; **Reckless Swing** is 50 and costs him 20 health; **Blood Rage** heals 40 and spends three Rage (10 with less); **War Howl** frightens and weakens everyone for two Rage, and only hurts otherwise.

## Counterplay
He has to be hurt to be at his best, and his heal is finite. Reckless Swing is a real HP sacrifice, so a focused early burst kills him before Rage pays back. Anti-heal blanks Blood Rage.

## Readability
Rage is a pip and every payoff prints its price.

## Deviations
Berserk is modelled as a resource, not a damage bonus (as with Asterion). Tested in `packages/engine/src/scenarios/region4.scenario.test.ts`.
