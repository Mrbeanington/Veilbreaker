# Draugr
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `draugr.ts` · CORE · MYTHOLOGY/UNDEAD/BRUISER · 140 HP

## Identity / win condition
The barrow-dead. Rusted Axe is 20 damage and Bleed; **Grave Chill** cuts an enemy's healing by 20 for 3 turns; Barrow Mound gives Damage Reduction 20 for 2 turns; **Wight's Grip** is 30 and a stun (cooldown 4). **Barrow Hunger**: whenever an enemy falls, he heals 20.

## Counterplay
The heal only happens when an enemy dies, so he wins by finishing, not by lasting. Stun and silence stop the Grip; **The Firebird**'s cleanse and any burst that kills him early beat the plan. Grave Chill is one anti-heal debuff a dispel removes.

## Readability
One passive line and four numbers.

## Deviations
None. Tested in `packages/engine/src/scenarios/region4.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/draugr/baseHp` is now **130**
- `passives/passive.draugr.barrow-hunger/effects/0/amount` is now **10**
