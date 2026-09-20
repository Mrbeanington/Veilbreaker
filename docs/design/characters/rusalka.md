# Rusalka
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `rusalka.ts` · RARE · FOLKLORE/MAGE/CURSE/CONTROLLER · 100 HP

## Identity / win condition
She curses, then drinks the cursed. Cold Whisper is 10 damage and a curse; **Drowning Embrace** is 20 damage, or on a cursed enemy 50 damage and a 20 life transfer to her. Willow Veil is Damage Reduction 20 and a heal; Song of the River hits and weakens every enemy.

## Counterplay
The 50 needs the curse first (two abilities), and a dispel removes it. Fragile at 100 HP. **The Plague Doctor** and **Behemoth** blank the life transfer.

## Readability
"Cursed enemy: 50 and a heal" is printed.

## Deviations
None. Tested in `packages/engine/src/scenarios/region3.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `abilities/ability.rusalka.drowning-embrace/effects/0/ifTrue/0/amount` is now **40**
