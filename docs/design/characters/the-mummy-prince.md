# The Mummy Prince
**Data:** `the-mummy-prince.ts` · RARE · MYTHOLOGY/UNDEAD/CURSE · 130 HP

## Identity / win condition
A bound heir. Wrapped Fist is 20; **Bind in Linen** stuns for a turn (cooldown 4); Royal Curse curses and adds Damage Amplification 10; Preserved by Salt gives Damage Reduction 30 for a turn. **The Curse Follows**: when he falls every enemy is cursed and weakened for 2 turns.

## Counterplay
Killing him is the cost of the curse, so a team can simply not finish him, or spread damage. A dispel clears Curse and Weakness. Curse itself has no engine rule yet, so the real payoff is the Weakness.

## Readability
The death curse is printed on the passive.

## Deviations
First passive whose effect widens to every enemy from a death trigger: an effect `target` of ENEMY_ALL is now honoured (ADR-026). Curse is still a marker status (OQ-86). Tested in `packages/engine/src/scenarios/region5.scenario.test.ts`.
