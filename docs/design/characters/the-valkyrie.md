# The Valkyrie
**Data:** `the-valkyrie.ts` · RARE · MYTHOLOGY/WARRIOR/SUPPORT · 100 HP

## Identity / win condition
The chooser of the slain. **Chooser of the Slain**: once per battle, when an *ally* would fall, she lifts them back to 20 health (an `onWouldDie` trigger on an ally; it does not save her). Spear Cast is 30; **Winged Descent** is 20 and puts her out of reach for a turn; Battle Cry heals an ally 20; Shield of the Slain gives Damage Reduction 20.

## Counterplay
One save per battle, and only for allies. Two lethal hits in one turn beat it, and erasure (**Shiro**) skips it. She has 100 HP and Winged Descent is a 4-turn cooldown.

## Readability
The save is a visible pip and the text says once per battle.

## Deviations
The passive spends her own charge with a `self`-targeted effect (it used to be impossible to apply a status or damage to the source; see ADR-025). Tested in `packages/engine/src/scenarios/region4.scenario.test.ts`.
