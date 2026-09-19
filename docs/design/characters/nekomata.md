# Nekomata
**Data:** `nekomata.ts` · RARE · FOLKLORE/BEAST/CURSE/NECROMANCER · 110 HP

## Identity / win condition
The roster's first **resurrection**. **Rise Again** brings a fallen ally back to their feet at 30% health, **once per battle** (a Second Life pip that is spent). It targets the *fallen*, using the new `includeDead` target flag. Claw Swipe is 20; Cursed Purr is 10 and a curse; Lick Wounds heals her 20.

## Counterplay
**Charon**'s Final Fare and any Resurrection Lock or Soul Consecration (**Father Bell**) blocks it (tested). She herself has 110 HP and one revival, so a plan that kills her first removes it. A resurrected ally has only 30% of their HP.

## Readability
Her one pip is visible; the ability text says "once per battle".

## Deviations
Adds `TargetRule.includeDead` (engine, UI and bots): normally only the living can be targeted; a rule with it selects from the fallen instead. Regression tests in the region 2 scenarios. Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.
