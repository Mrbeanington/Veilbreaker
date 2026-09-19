# Charon
**Data:** `charon.ts` · RARE · MYTHOLOGY/UNDEAD/CONTROLLER · 130 HP

## Identity / win condition
**Obols** (0-5) are collected whenever *anyone* dies (**The Toll**), and Take the Toll adds one. Take the Toll steals 2 energy. Cross the River ferries an ally out of reach for a turn and heals 20. **Final Fare** locks an enemy out of resurrection for 2 turns and deals 20, or 40 (spending 3 Obols) when he can pay.

## Counterplay
He is a slow value engine: a game with no deaths gives him nothing but Take the Toll. Silence and stun stop the ferry. His anti-resurrection only matters against resurrection: it is a counter to **Malachar**'s Souls and **Nine Lives**-style plans, not a general strength. Cross the River has a 4-turn cooldown.

## Readability
Obols are a pip resource; "someone died, he earns" is one line.

## Deviations
Charon does not steal *Souls* (a Malachar-only resource); Obols are his own economy. Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
