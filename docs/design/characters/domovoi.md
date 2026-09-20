# Domovoi
**Data:** `domovoi.ts` · CORE · FOLKLORE/SUPPORT/DEFENDER · 110 HP

## Identity / win condition
**Hearth Keeper**: whenever an *ally* is damaged they gain a small 10 shield for a turn. Warm Hearth heals 20; Sweep the Floor is 10 damage and steals an energy; Hide in the Stove makes him untargetable; Household Mischief makes an enemy's abilities cost 1 more.

## Counterplay
The shield is small and one turn: a big hit or several hits per turn go through. He is a modest support with 110 HP and no burst.

## Readability
Everything is a number.

## Deviations
The passive targets the damaged ally (the trigger's `effectTarget: subject`), not himself. Tested in `packages/engine/src/scenarios/region3.scenario.test.ts`.
