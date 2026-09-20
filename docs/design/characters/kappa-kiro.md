# Kappa Kiro
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `kappa-kiro.ts` · RARE · FOLKLORE/CONTROLLER/BEAST · 120 HP

## Identity / win condition
**The dish** (Water 0-3, starts full). Riverbank Grab is 30 damage with two Water and 10 without; Sumo Throw is 40 and spills one Water; Refill the Dish restores it and heals 10; **Drag Under** stuns for a turn with a full dish (spending two) and only weakens otherwise. **The Dish Spills**: every wound loses a Water, and with the dish empty he takes 10 more damage for 2 turns.

## Counterplay
Small hits empty the dish fast, so many-hit attackers (**Cerberus**'s Three Bites, DoTs) undo him. Water is a visible pip, so the opponent knows when the stun is coming.

## Readability
"Full dish: strong; empty dish: hurt" is the whole rule.

## Deviations
"Water/tides" flavour is in the names and text, not a special damage type. Tested in `packages/engine/src/scenarios/region2.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/kappa-kiro/baseHp` is now **145**
