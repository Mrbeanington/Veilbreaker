# King Croak
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `king-croak.ts` · RARE · FOLKLORE/BEAST/CONTROLLER · 130 HP

## Identity / win condition
A swamp monarch with poisoned courtesies. Tongue Lash is 20; Poison Dart is 10 and Poison for 3 turns; **Frog Curse** silences and weakens for a turn (Spirit 2, a 4-turn cooldown); Lily Pad Throne gives him a 30 shield.

## Counterplay
The silence is one turn on a long cooldown; a dispel removes the poison. **Plague Doctor**-style healing denial does not matter to him, but burst does.

## Readability
One effect per ability.

## Deviations
His tongue constant is prefixed because Umbrella Yokai already exports `TONGUE_LASH`. Tested in `packages/engine/src/scenarios/region8.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/king-croak/baseHp` is now **120**
- `abilities/ability.king-croak.frog-curse/cooldown` is now **5**
