# Chef Ramble
**Data:** `chef-ramble.ts` · RARE · MUSIC/ATTACKER/EVOLUTION · 110 HP

## Identity / win condition
A furious chef with a recipe. **Chop**, **Sear** (10 and Burn), **Flambé** (20 and Burn), then **Plate It**: cast in that order, Plate It transforms him into **The Five-Star Fiend** (150 HP): Cleaver Storm (20 to every enemy), Boil Over (Burn on everyone), Devour (40 and a heal of 20), and Kitchen Nightmare (40 to every enemy and a stun, Might 3 and Chaos 2 on a 5-turn cooldown).

## Counterplay
The recipe is four turns of visible abilities in an exact order; any other ability in between, or a stun or silence, breaks it. Until he transforms the kit is small (10-20 damage a step). The Fiend still dies to burst, and Anti-Heal turns off Devour.

## Readability
The recipe is printed on Plate It and each step says its step number.

## Deviations
**Renamed** from the provisional Michelin Monster (a registered trademark, OQ-10) to The Five-Star Fiend. The transformation is started by an ability's own effect (the sequence condition), the same way Patient Zero's evolution is started by his passive. Tested in `packages/engine/src/scenarios/region10.scenario.test.ts`.
