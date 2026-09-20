# Professor Octopus
**Data:** `professor-octopus.ts` · RARE · FOLKLORE/MAGE/CONTROLLER · 110 HP

## Identity / win condition
A lecturing octopus with eight arms. **Eight Arms** is four hits of 10; Ink Cloud weakens every enemy; Tentacle Grab stuns for a turn (a 4-turn cooldown); **Encore** puts the ability he used last off cooldown at once.

## Counterplay
Encore repeats only what he last used, so it is worth most after Tentacle Grab, which the enemy sees coming. It costs Chaos with a 3-turn cooldown. Four small hits are blunted by flat Damage Reduction.

## Readability
Encore names the ability it refreshes in the log.

## Deviations
Uses `modifyCooldown` with the last-used token in `set` mode on the caster. Tested in `packages/engine/src/scenarios/region8.scenario.test.ts`.
