# Lantern Spirit
**Data:** `lantern-spirit.ts` · RARE · FOLKLORE/SUPPORT/MAGE · 80 HP

## Identity / win condition
The roster's energy engine. **Guiding Flame** costs 1 and gives his team 2 Spirit and heals an ally 10. **Burn Bright** costs him 20 health for 2 Might and 1 Chaos. Lantern Ward gives an ally Damage Reduction 10; Flicker is 10 damage and Burn. **Last Light**: when he goes out his team gains 2 Spirit.

## Counterplay
80 HP, the lowest on the roster: kill him first, and even then his death pays 2 Spirit. Energy denial (**Mister Whiskers**) undercuts the engine. Burn Bright is a real HP sacrifice with a 4-turn cooldown.

## Readability
"Gives 2" is a printed number; energy is visible.

## Deviations
Adds the engine rule that a character's own death trigger (relation "self") fires for the character that just died; dead characters still react to nothing else. Regression tests in `triggers.test.ts`. Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.
