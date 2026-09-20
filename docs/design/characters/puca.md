# Púca
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `puca.ts` · RARE · MYTHOLOGY/BEAST/CONTROLLER/RANDOM · 100 HP

## Identity / win condition
The trickster. Hoof and Horn is two hits of 10; **Shift Shape** takes a random shape (Damage Reduction 20, untargetable for a turn, or heal 20, one in three each); **Lead Astray** sends an enemy's chosen attack at *him* (a priority-tier target manipulation, like Paw Swap); Wild Ride is 30 and a weakness.

## Counterplay
Lead Astray has a 4-turn cooldown and costs Focus and Chaos. Shift Shape is a gamble that sometimes gives the weakest shape. Single-target only, so an area attack ignores the redirect.

## Readability
The three shapes are printed.

## Deviations
The random result uses the battle's seeded RNG (replays identically). Tested in `packages/engine/src/scenarios/region4.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/puca/baseHp` is now **110**
- `abilities/ability.puca.wild-ride/effects/0/amount` is now **40**
