# Anubian Judge
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `anubian-judge.ts` · SECRET · MYTHOLOGY/CONTROLLER/ATTACKER/SECRET · 140 HP

## Identity / win condition
The weighing of the heart. Feather Strike is 20; **Weigh the Heart** is 20, or **40 against an enemy that has dealt 60 or more damage this battle**; Verdict of Ma'at weakens and exposes; Balance the Scales heals an ally 30. The more you hurt, the heavier you weigh.

## Counterplay
It punishes the enemy's best attacker, not a specific trick: a defensive or support enemy is barely touched. Kill him first or put the damage on a fresh character. DISCOVERABLE secret with a silhouette prompt.

## Readability
The threshold is printed on the ability and the enemy's damage dealt is visible in the log.

## Deviations
Uses `damageDealtAtLeast`, first used in a kit here. Tested in `packages/engine/src/scenarios/region5.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `abilities/ability.anubian-judge.weigh-the-heart/effects/0/ifTrue/0/amount` is now **30**
