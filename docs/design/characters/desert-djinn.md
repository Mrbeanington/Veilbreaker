# Desert Djinn
**Data:** `desert-djinn.ts` · RARE · MYTHOLOGY/MAGE/RANDOM · 100 HP

## Identity / win condition
Wishes that come true and never quite as asked. Sandstorm is 10 to every enemy; **Grant a Wish** gives an ally one of three boons at random (shield 30, heal 30, Damage Reduction 20); **Twisted Wish** does one of three things to an enemy (40 damage, a stun, or a heal of 20); Whirlwind Lift makes an ally untargetable for a turn.

## Counterplay
Twisted Wish can heal the enemy, so it is a gamble with a real downside. Every outcome is printed. 100 HP and small numbers: burst kills the Djinn before the wishes add up.

## Readability
Every random branch is listed on the ability.

## Deviations
Random outcomes use the battle's seeded RNG (replays identically). Tested in `packages/engine/src/scenarios/region5.scenario.test.ts`.
