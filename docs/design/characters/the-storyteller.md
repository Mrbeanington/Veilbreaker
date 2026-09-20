# The Storyteller
**Data:** `the-storyteller.ts` · RARE · FOLKLORE/SUPPORT/CONTROLLER · 90 HP

## Identity / win condition
A tale in three beats. Once Upon a Time shields an ally for 20; **Rising Action** is 20, or 30 right after it; **The Twist** is 30, or 40 right after Rising Action; Happily Ever After gives every ally Damage Reduction 20.

## Counterplay
The chain is one action per beat and the enemy reads it. Any interruption (stun, silence) resets it. Without the chain the numbers are small.

## Readability
The chain is printed on both payoffs.

## Deviations
Uses `usedAbilityLastTurn`, as **Shield Bash** and **Ambush** do. Tested in `packages/engine/src/scenarios/region6.scenario.test.ts`.
