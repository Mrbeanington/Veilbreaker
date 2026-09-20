# The Birch Witch
**Data:** `the-birch-witch.ts` · RARE · FOLKLORE/MAGE/CURSE/ANTI-HEALER · 110 HP

## Identity / win condition
Bleed and sap. Birch Switch is 10 damage and Bleed; **Bitter Sap** poisons and cuts healing by 10 for 3 turns; **Sap Drain** is 30 damage with a 20 life transfer on a *bleeding* enemy, 10 otherwise; Paper Bark Shell shields herself for 30.

## Counterplay
She needs a Bleed first, and Anti-Heal on her (**The Plague Doctor**) turns Sap Drain into a plain hit. Low HP, and her shield is her only defence.

## Readability
"Bleeding enemy" is the condition.

## Deviations
First real user of `status.bleed`. Tested in `packages/engine/src/scenarios/region3.scenario.test.ts`.
