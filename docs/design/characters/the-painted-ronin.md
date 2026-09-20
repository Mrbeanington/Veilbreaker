# The Painted Ronin
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `the-painted-ronin.ts` · SECRET · FOLKLORE/WARRIOR/ASSASSIN/SECRET · 110 HP

## Identity / win condition
The first **Ink** character. **Brush Stroke** (10 damage, +1 Ink) and **Ink Wash** (two Ink and Damage Reduction 20 for a turn) build it; **Portrait of a Foe** weakens an enemy and, with two Ink spent, slows its cooldowns; **Final Stroke** is 20, or **70 with four Ink** (spent).

## Counterplay
Four Ink takes about three turns, all visible. Ink Wash is his only defence. A silence or stun on him during the build-up wastes the turns; he has 110 HP.

## Readability
Ink is a pip resource with a printed payoff.

## Deviations
"Ink" is a resource, not a status: enemies cannot be inked (no ink-status yet). DISCOVERABLE secret with a silhouette prompt. Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/the-painted-ronin/baseHp` is now **120**
