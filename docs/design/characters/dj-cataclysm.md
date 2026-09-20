# DJ Cataclysm
**Data:** `dj-cataclysm.ts` · RARE · MUSIC/CONTROLLER/SUPPORT · 110 HP

## Identity / win condition
A turntable sorcerer. Build Up is 10; **Bass Drop** is 20 to every enemy, or **50 right after Build Up**; Record Scratch silences for a turn; Crowd Surge shields every ally for 20.

## Counterplay
The drop needs a Build Up the turn before, which the enemy sees. A stun or silence resets it, and Record Scratch is a 4-turn cooldown. Distinct from **Maestro Nocturne** (who manipulates cooldowns) and **The Storyteller** (a single-target chain): the drop hits every enemy.

## Readability
The chain is printed on Bass Drop.

## Deviations
Uses `usedAbilityLastTurn` on an area ability. Tested in `packages/engine/src/scenarios/region10.scenario.test.ts`.
