# The Mime
**Data:** `the-mime.ts` · RARE · MUSIC/CONTROLLER/ASSASSIN · 120 HP

## Identity / win condition
A mimic of kinds, not of people (spec/03: copies categories or effects rather than entire characters). **Mimic Guard** turns an enemy's defence into a trick: a shield becomes a Reflect for a turn, Damage Reduction becomes a 20 Counter for 2 turns; **Mimic Strike** is 20, or 60 against an enemy with a shield or Damage Reduction; Silent Slap is 30; Invisible Box silences for a turn (a 3-turn cooldown).

## Counterplay
Against an unprotected enemy Mimic Guard does nothing and Mimic Strike is 20. Reflect and Counter ignore affliction and damage over time, and he has 120 HP.

## Readability
Each ability names the categories it reads.

## Deviations
Reworked once so it did not overlap **Shieldmaiden Yrsa** and **The Storyteller** (shield and stun became Reflect, Counter and silence). It copies effect *categories* by reading the target's statuses, since the engine cannot copy an ability. Tested in `packages/engine/src/scenarios/region10.scenario.test.ts`.
