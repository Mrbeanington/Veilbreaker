# The Firebird
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `the-firebird.ts` · RARE · FOLKLORE/SUPPORT/MAGE/HEALER · 70 HP

## Identity / win condition
**Rise from Ashes**: once per battle, when she would fall, she is reborn at 40 health (an `onWouldDie` passive, like The Nameless One's rewind). Ember Lash is 10 and Burn; Glowing Feather heals 20 and strengthens healing; **Dawn Light** removes every harmful effect from an ally and heals 10; Cinder Storm is 10 to every enemy.

## Counterplay
70 HP is the lowest tank-free body on the roster; two lethal hits in one turn beat the rebirth (the first sets her to 40, the second kills). Erasure (**Shiro**) skips death triggers entirely.

## Readability
The rebirth is a visible pip.

## Deviations
The rebirth uses the `setHp` heal class, so Anti-Heal cannot stop it. Tested in `packages/engine/src/scenarios/region3.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `passives/passive.the-firebird.rise-from-ashes/effects/1/amount` is now **30**
- `abilities/ability.the-firebird.dawn-light/cooldown` is now **4**
- `abilities/ability.the-firebird.glowing-feather/cooldown` is now **3**
