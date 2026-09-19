# Asterion
**Data:** `asterion.ts` · CORE · BEAST/MYTHOLOGY/BRUISER · 160 HP

## Identity / win condition
**Maze** (0-3 pips) is built by Horn Charge (+1) and Into the Maze (+2, and he is untargetable for a turn) and spent by **Goring Rush**: 30 damage, 40 with two pips, 60 with three (spends what it uses). Bellow weakens every enemy by 10. **Rage of the Maze** (berserk): below half health he gains a pip every turn, so a wounded Asterion is more dangerous, not less.

## Counterplay
Maze is a visible pip resource and Goring Rush has a 2-turn cooldown. Into the Maze is a one-turn dodge with a 2-turn cooldown, so it is a tempo trade, not a wall. Burst him before he is wounded, or trade one energy-cheap hit at a time so berserk never starts. **Shiro** erases him through any Maze count. **Tortuga Rex**'s flat Damage Reduction 30 blanks Horn Charge.

## Readability
Everything is a number or a pip. The only rule to remember: "more Maze, harder Rush".

## Deviations
Berserk is modelled as extra Maze rather than a damage bonus, because the engine has no self damage-up status (only Damage Amplification, which raises damage taken). Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
