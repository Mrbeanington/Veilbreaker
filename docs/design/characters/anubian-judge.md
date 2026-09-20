# Anubian Judge
**Data:** `anubian-judge.ts` · SECRET · MYTHOLOGY/CONTROLLER/ATTACKER/SECRET · 140 HP

## Identity / win condition
The weighing of the heart. Feather Strike is 20; **Weigh the Heart** is 20, or **40 against an enemy that has dealt 60 or more damage this battle**; Verdict of Ma'at weakens and exposes; Balance the Scales heals an ally 30. The more you hurt, the heavier you weigh.

## Counterplay
It punishes the enemy's best attacker, not a specific trick: a defensive or support enemy is barely touched. Kill him first or put the damage on a fresh character. DISCOVERABLE secret with a silhouette prompt.

## Readability
The threshold is printed on the ability and the enemy's damage dealt is visible in the log.

## Deviations
Uses `damageDealtAtLeast`, first used in a kit here. Tested in `packages/engine/src/scenarios/region5.scenario.test.ts`.
