# Father Bell
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `packages/content/src/data/characters/father-bell.ts` · RARE · SUPPORT/CONTROLLER/DEFENDER · 110 HP

## Identity / win condition
A patient support piece. Toll the Bell chips, Hush silences a key enemy, Sanctuary and Last Rites keep him standing. His real value is the passive: anyone pushed below 25% HP while he lives is Consecrated, so their death feeds nothing.

## Counterplay
He is fragile-ish (110 HP) and his passive only works while he is alive: kill or silence-lock him first. Consecration does nothing against characters who don't feed on deaths.

## Counters and synergies
Deliberately obscure (spec/03: the game never says who this answers). Real interaction: **Malachar** gets no Souls from consecrated deaths, and resurrection is blocked (tested in `batch1.scenario.test.ts` with the real characters, not fixtures). Synergy: Tortuga Rex-style stalling to make the Souls economy starve.

## Readability
Toll the Bell: 20 damage. Hush: silence 1 turn. Sanctuary: shield 30. Last Rites: heal 30. All one-clause. Passive: "near-death enemies are consecrated".

## Deviations
Passive keys on `onHpThreshold` (fires with the damage, before the death-check tier) because a dead character can't receive a status; the 25% line is this phase's number. It also consecrates a survivor who dips under 25% and lives — harmless, and only matters if that character is later killed while still marked (statuses persist).

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/father-bell/baseHp` is now **130**
