# Dokkaebi
**Data:** `dokkaebi.ts` · RARE · FOLKLORE/CONTROLLER/RANDOM · 120 HP

## Identity / win condition
The goblin with the magic club. **Magic Club** is 40 damage, or 20 and a shower of gold (1 extra Chaos), at random; **Goblin Gold** adds 2 Chaos for the team; **Prank** weakens the enemy and makes its abilities cost more for 2 turns; Bump in the Night is 20.

## Counterplay
The Club's hard hit is only one branch. Prank's cost increase is a visible status and a dispel removes it. His energy is Chaos only, so it does not help a team that needs Might or Spirit.

## Readability
Both Club outcomes are printed.

## Deviations
Random branches are listed worst to best so a Cheater's forced roll means what it says. `modifyEnergy` with the neutral family does nothing in the engine (only the four families hold energy), so gold is Chaos. Tested in `packages/engine/src/scenarios/region6.scenario.test.ts`.
