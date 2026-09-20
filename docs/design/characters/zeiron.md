# Zeiron, the God Who Refused Olympus (Legend)
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `zeiron.ts` · LEGENDARY · MAGE/MYTHOLOGY/ATTACKER · 130 HP

## Identity / win condition
Extremely expensive mass lightning: Thunderclap 30, Chain Lightning 25 to all, Storm Mantle (Counter 20), and **Wrath of the Unchained Sky**: 70 to every enemy for 4 Might + 3 Spirit + 1 Chaos on a 5-turn cooldown.

## Balance levers (spec/03)
Huge cost and cooldown on the payoff; only 130 HP; **Broken Crown** vulnerability — below half HP each wound applies Damage Amplification +5 for a turn.

## Counterplay — concrete counters from the roster
- **Father Bell**: Hush silences him, so Wrath cannot be cast (tested).
- **Mister Whiskers**: Black Cat's Crossing steals the energy Wrath needs.
- **Tortuga Rex**: Fortress Shell's flat Damage Reduction 30 nullifies Thunderclap and Chain Lightning.

## Readability
Four abilities, one big number. The passive is a single condition.

## Deviations
Lightning is `normal` damage (no special type) so ordinary defences apply; elemental typing is not in the engine. Art is `draft` with a Legend reveal prompt; must never resemble a commercial Zeus (recorded in the spec's `avoid`).

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/zeiron/baseHp` is now **140**
- `abilities/ability.zeiron.wrath-of-the-unchained-sky/cost/might` is now **3**
- `abilities/ability.zeiron.wrath-of-the-unchained-sky/cost/spirit` is now **2**
