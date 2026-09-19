# Red Oni
**Data:** `red-oni.ts` · CORE · FOLKLORE/BRUISER/WARRIOR · 160 HP

## Identity / win condition
The loud half of a pair. Iron Club is 20 damage; **Bellowing Charge** is 50 and costs him 20 of his own health (affliction) **unless Blue Oni is on his team**, in which case it is free (`teamComposition`). Thick Hide gives Damage Reduction 20 for 2 turns; Kanabo Sweep is 20 to every enemy.

## Counterplay
On his own the charge bleeds him: three charges cost 60 of his 160 HP. Kill or silence Blue Oni and the discount goes with him. **Tortuga Rex**'s flat armour blanks Iron Club, and **Shiro** erases him whatever his HP.

## Readability
The condition is spelled out on the ability ("unless Blue Oni fights beside him").

## Deviations
The bond checks who is on the team, not who is alive (the engine's team-composition rule). Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.
