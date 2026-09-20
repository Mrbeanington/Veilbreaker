# El Magnífico
**Data:** `el-magnifico.ts` · RARE · ATHLETE/ATTACKER/CONTROLLER · 130 HP

## Identity / win condition
A masked wrestling showman. **Body Slam** is 20 and stuns for a turn (a 3-turn cooldown); **Flying Elbow** is 30, or **70 against a stunned enemy**; Taunt the Crowd draws single-target attacks to him and gives Damage Reduction 20; Second Wind heals 20.

## Counterplay
The 70 needs a stun first, and the slam is a 3-turn cooldown, so the combo is slow and visible. Anti-Heal ends his sustain. Any stun on him stops the slam.

## Readability
The stun requirement is printed on the elbow.

## Deviations
The elbow reads the target's Stun status, so **Bewitch**, **Glass Case** and other teammates' stuns power it too. Tested in `packages/engine/src/scenarios/region9.scenario.test.ts`.
