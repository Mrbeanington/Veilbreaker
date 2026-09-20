# The Minotaur King (Legend)
**Data:** `minotaur-king.ts` · LEGENDARY · LEGENDARY/FOLKLORE/MYTHOLOGY/TANK/CONTROLLER · 130 HP

## Identity / win condition
An extreme tank who runs a Labyrinth. **Labyrinth Wall** (a 4-turn cooldown) draws single-target attacks to him for a turn and gives Damage Reduction 20 for 2 turns; **Lost in the Maze** sends an enemy's chosen attack the wrong way, onto him; Bronze Axe is 30; and on his one great turn **The Labyrinth Closes**: every enemy is stunned for a turn.

## Balance levers (spec/03)
The Labyrinth Closes costs Spirit 3 and Chaos 3 on a 7-turn cooldown; Lost in the Maze costs Focus and Chaos on a 5-turn cooldown and only reaches single-target attacks. His damage is modest (a 30 axe). **Cracked Crown**: below half health every wound leaves him more exposed (Damage Amplification 10 for a turn). Only stun, not damage, wins him the game, and the stun lasts a turn.

## Counterplay
The Labyrinth is powerful and answerable:
- **Father Bell**: Hush silences him, so he cannot close the maze or turn an attack (tested).
- **Mister Whiskers**: steals the Spirit and Chaos that the big abilities cost.
- Area and damage-over-time attacks ignore Lost in the Maze and the taunt; affliction damage ignores his Damage Reduction.
- The stun is one turn, on a 7-turn cooldown, and he must save six energy for it.
He is the roster's only guaranteed team-wide stun, and the price shows.

## Readability
Every ability names what it does; the redirect is a logged event.

## Deviations
The redirect uses `retargetQueuedAction` in the priority tier, as Púca's Lead Astray does. It sends the attack to the Minotaur King himself (the effect's default), not to a chosen target. He has a Legend trial (`trial.minotaur-king`, against him, Asterion and Cyclops Brontes). Tested in `packages/engine/src/scenarios/region8.scenario.test.ts`.
