# Cyclops Brontes
**Data:** `cyclops-brontes.ts` · CORE · MYTHOLOGY/ATTACKER/BEAST · 140 HP

## Identity / win condition
**Forge Heat** (0-3) comes from Hammer Blow (+1) and Stoke the Forge (+2). **Thunderbolt** with two Heat is a sure 70 (spends the Heat); with a cold forge it is a random 20, 40 or 60 (weights 3, 2, 1: an average of about 33). Molten Slag is 10 damage and Burn.

## Counterplay
Heat is visible, so the opponent knows when the bolt is certain. Stoke the Forge costs a turn of tempo; the bolt has a 2-turn cooldown and needs Might 2 and Focus 1. It is a plain 140 HP attacker with no defence.

## Readability
Two Heat means a sure hit. The gamble is a printed table.

## Deviations
The bolt is `normal` damage (no elemental typing), like Zeiron's. Randomness uses the seeded RNG in battle state, so it replays. Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
