# Phase 13, region 1 (Ancient Mediterranean): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region1` (33 playable characters, random 3v3 teams, INTERMEDIATE bots on both sides). Full report: `report-2026-09-19-phase13-region1.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15; this file records what the region did to the numbers.

## Health of the run
0 engine errors. First player 50.7%. Average match 14.8 turns; 110 of 5,000 matches hit the 40-turn limit. Detectors: energy lockout (widespread, pre-existing: OQ-48 family), one-turn kills 16, state loop 1.

## The 13 new characters (win rate over about 1,200 games each)
| Character | Win % | Read |
|---|---|---|
| The Forgotten Titan | 67.0 | **Outlier (investigate).** The strongest character on the roster after Patient Zero. Tuned down three times (HP 220 to 150, wake at 5 Stirring, damage 80 to 60); still high because a sleeping Titan is very hard for a heuristic bot to kill before it wakes. Needs a human look in Phase 15. |
| Asterion | 64.2 | Above the 60% flag. Tuned (Horn Charge 30 to 20, Goring Rush 70 to 60). |
| Cyclops Brontes | 64.0 | Above 60%. A sure 70 at two Heat; consider a higher Heat requirement. |
| The Bronze Giant | 63.6 | Above 60%. Burn is his counter, and bots rarely have it. |
| Nemesis | 62.9 | Above 60%. Grudge fills fast on a team that is being hit. |
| Charon | 60.8 | At the flag. |
| Cerberus | 58.6 | Fine. |
| Hecate's Disciple | 56.4 | Fine. |
| Arachne | 53.6 | Fine. |
| Icarion | 52.6 | Fine (the self-damage bug fix mattered: see ADR-022). |
| The Oracle | 47.9 | Fine; a set-up character that needs a partner. |
| Medusa | 41.6 | Low but plausible for a fragile controller; watch. |
| The Siren | 39.3 | Low: the 60-damage combo needs three uninterrupted turns. Watch, do not buff yet. |

## What it does to the older roster
The 13 new kits are simple and cost-efficient, so most sit above 50% and pull down older, more conditional characters (Malachar 31%, Referee 33%, Maestro 32%, Koschei 35%). This is the same pattern as OQ-48. The remedy is a Phase 15 pass on the *older* kits as much as on the new ones.

## Template overlap (phase-13 requirement)
Two kits are "close" when their sets of effect signatures overlap by more than 70% (Jaccard). **No pair among the 33 playable characters is flagged.** The closest pairs are Shiro / Asterion (60%) and Tortuga Rex / Behemoth (50%). Checked by `template overlap` tests in `packages/content/src/coverage.test.ts`.

## Mechanical coverage
Coverage matrix regenerated (`packages/content/coverage.md`): 5 of 55 required mechanics have no character yet (energy generation, resurrection, pets, relics, ink), down from 24 before this region (several were detector gaps; see ADR-022). Region 1 added labyrinths, petrification, prophecy, delayed attacks, songs, musical sequences, HP sacrifice, berserk, fire, lightning, water and tides, reflection and counters.
