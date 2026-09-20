# Anansi
**Data:** `anansi.ts` · RARE · FOLKLORE/CONTROLLER/SUPPORT · 110 HP

## Identity / win condition
The tale-spinner. Spider Bite is 20 and Poison; **Tangled Tale** adds 2 turns to the cooldown of the ability the enemy used last; Tall Tale weakens; Web of Stories shields a friend for 30. He wins by making the enemy's best move come back late.

## Counterplay
Tangled Tale only bites something that has a cooldown, and needs the enemy to have used an ability first; a kit of cooldown-free abilities shrugs it off. 110 HP and small numbers: burst kills him before the web matters.

## Readability
One clear effect per ability; the affected ability is named in the log.

## Deviations
Uses `modifyCooldown` with the last-used token (as Emperor Zero does for locks). Tested in `packages/engine/src/scenarios/region6.scenario.test.ts`.
