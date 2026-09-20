# The Dullahan
**Data:** `the-dullahan.ts` · RARE · MYTHOLOGY/UNDEAD/ATTACKER/ASSASSIN · 140 HP

## Identity / win condition
The headless rider and executioner. Whip of Bone is 20 and Bleed; **Death's Summons** curses and frightens; **Headless Charge** is 40 damage, or **100 against an enemy below 30% health** (the roster's first execute); Dead Man's Road makes him untargetable for a turn.

## Counterplay
The execute needs the enemy already hurt, and the Charge is Might 2 and Chaos 1 on a 3-turn cooldown. Healing an enemy above 30% denies it (**The Firebird**, **Domovoi**), and a stun on him stops the setup.

## Readability
"Below 30%" is printed on the ability.

## Deviations
The threshold uses a percentage of maximum health, so a big-HP enemy is executed at a bigger number. Tested in `packages/engine/src/scenarios/region4.scenario.test.ts`.
