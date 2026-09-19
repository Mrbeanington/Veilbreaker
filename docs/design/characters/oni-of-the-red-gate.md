# Oni of the Red Gate
**Data:** `oni-of-the-red-gate.ts` · SECRET · FOLKLORE/BRUISER/SECRET · 160 HP

## Identity / win condition
A **decaying** character: he starts with three **Red Gate** pips and loses one at the start of every turn. **Crimson Cleave** is 70 damage with three pips, 50 with two, 30 with one, 10 with none. **Open the Gate** costs 20 of his own health (HP sacrifice) and 2 Spirit for two pips; Hold the Threshold is Damage Reduction 20; Ember Curse curses and weakens.

## Counterplay
His burst is front-loaded: stall the first two turns (stun, Damage Reduction, untargetability) and he is a 10-damage character until he pays blood to reopen the gate. The clock is a visible pip resource.

## Readability
A number counting down.

## Deviations
Because the Gate closes at turn start, the strongest Cleave a player can actually cast in turn 1 is 50 (the pip is already gone), which is the design. DISCOVERABLE secret with a silhouette prompt. Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.
