# Oni of the Red Gate
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `oni-of-the-red-gate.ts` · SECRET · FOLKLORE/BRUISER/SECRET · 160 HP

## Identity / win condition
A **decaying** character: he starts with three **Red Gate** pips and loses one at the start of every turn. **Crimson Cleave** is 70 damage with three pips, 50 with two, 30 with one, 10 with none. **Open the Gate** costs 20 of his own health (HP sacrifice) and 2 Spirit for two pips; Hold the Threshold is Damage Reduction 20; Ember Curse curses and weakens.

## Counterplay
His burst is front-loaded: stall the first two turns (stun, Damage Reduction, untargetability) and he is a 10-damage character until he pays blood to reopen the gate. The clock is a visible pip resource.

## Readability
A number counting down.

## Deviations
Because the Gate closes at turn start, the strongest Cleave a player can actually cast in turn 1 is 50 (the pip is already gone), which is the design. DISCOVERABLE secret with a silhouette prompt. Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/oni-of-the-red-gate/baseHp` is now **170**
- `abilities/ability.oni-of-the-red-gate.open-the-gate/cost/spirit` is now **1**
- `abilities/ability.oni-of-the-red-gate.open-the-gate/cooldown` is now **3**
- `abilities/ability.oni-of-the-red-gate.crimson-cleave/effects/0/ifTrue/0/amount` is now **80**
- `abilities/ability.oni-of-the-red-gate.crimson-cleave/effects/0/ifFalse/0/ifTrue/0/amount` is now **60**
- `abilities/ability.oni-of-the-red-gate.crimson-cleave/effects/0/ifFalse/0/ifFalse/0/ifTrue/0/amount` is now **40**
- `abilities/ability.oni-of-the-red-gate.crimson-cleave/effects/0/ifFalse/0/ifFalse/0/ifFalse/0/amount` is now **20**
