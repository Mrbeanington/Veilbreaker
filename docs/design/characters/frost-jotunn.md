# Frost Jötunn
**Data:** `frost-jotunn.ts` · RARE · MYTHOLOGY/TANK/BRUISER · 190 HP

## Identity / win condition
A frost giant. Ice Club is 30; Hoarfrost Skin gives Damage Reduction 20 for 2 turns; **Winter's Lock** freezes an enemy's **Might** for 2 turns (an `energy-lock` with the family as its parameter: any ability that needs Might cannot be used); Glacier Slam is 20 to every enemy.

## Counterplay
The lock only stops abilities that need Might; a Focus, Spirit or Chaos ability still works. He is slow: two of his abilities need Might and Spirit together. Energy denial or speed beats him.

## Readability
"Freezes Might" is the whole rule, and the enemy is told which ability is blocked.

## Deviations
First use of `status.energy-lock` (the engine had it, no character did). Tested in `packages/engine/src/scenarios/region4.scenario.test.ts`.
