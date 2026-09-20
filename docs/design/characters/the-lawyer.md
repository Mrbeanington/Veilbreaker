# The Lawyer
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `the-lawyer.ts` · SECRET · FOLKLORE/CONTROLLER/CHEATER/SECRET · 90 HP

## Identity / win condition
An absurd but ranked-viable Cheater. **Technicality** (the rule-break): once per battle, when he would fall, a ruling goes his way and he is restored to **20 health**. **Objection!** sends an enemy's chosen attack at him; Sue is 10 and takes 1 energy (a 3-turn cooldown); Class Action weakens and exposes every enemy; Cross-Examine is 20 and silences.

## Cheater rule-break and counterplay
**Rule broken:** he is allowed to lose and not lose. **Counterplay:** it happens once, is a visible `Appeal` pip and is logged when it fires; erasure ignores it (tested); a second lethal hit in the same turn or after it beats it; Resurrection Lock still applies. With 90 HP and small numbers he has few ways to punish a team that expects the technicality.

## Counterplay
See above: the Appeal pip shows whether it is still available; erasure (**Shiro**'s Final Stroke) and burst kill through it.

## Readability
The pip and the passive text say once per battle.

## Deviations
The same restore-at-health mechanism as The Firebird's rebirth (an `onWouldDie` passive with `setHp`), used here as a Cheater rule-break. DISCOVERABLE secret with a silhouette prompt. Tested in `packages/engine/src/scenarios/region11.scenario.test.ts`.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `abilities/ability.the-lawyer.cross-examine/cooldown` is now **4**
- `abilities/ability.the-lawyer.sue/cooldown` is now **4**
- `characters/the-lawyer/baseHp` is now **80**
