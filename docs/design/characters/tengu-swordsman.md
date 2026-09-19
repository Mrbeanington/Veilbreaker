# Tengu Swordsman
**Data:** `tengu-swordsman.ts` · RARE · FOLKLORE/WARRIOR/ASSASSIN · 120 HP

## Identity / win condition
A duel in two moves. **Waiting Blade** makes whoever strikes him next take 30 back for a turn. **Iai Strike** is 20 damage, or **70 if Waiting Blade was his last ability**. Feather Fan is 10 to every enemy; Gale Step shortens his cooldowns and takes 10 off damage for 2 turns.

## Counterplay
The 70 needs a turn of waiting that shows: an enemy that does not attack into the counter loses nothing, and one stun or silence between the two breaks the pair. Iai Strike has a 1-turn cooldown so it cannot chain.

## Readability
The combo is printed on Iai Strike.

## Deviations
Uses the character's own last ability, like the Siren's song; passing does not break it. Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.
