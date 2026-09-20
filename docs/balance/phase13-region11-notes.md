# Phase 13, region 11 (the Final Seven): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region11` (119 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region11.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 50.3%. Average match 16.5 turns; 118 of 5,000 matches hit the 40-turn limit.

## The 4 new characters
| Character | Win % | Read |
|---|---|---|
| The Lawyer (Secret) | 65.1 | Above the flag after tuning (HP 90, restore 30 to 20, Objection cooldown 5, Sue cooldown 3). A once-only restore is efficient for bots. |
| The Gatekeeper (Secret) | 64.1 | Above the flag after tuning (from 92%: the toll now only runs while the Gate is barred; HP 100, Damage Reduction 20, longer cooldowns). |
| Calypsa (Legend) | 49.8 | Fine for a Legend: six turns of setup, and the interruptions are real counters. |
| The Tax Collector | 46.4 | Fine, a little low (from 75%: the Levy now only taxes enemies under Audit). |

## Pattern
As before (OQ-71, OQ-80): passives that fire on the enemy's actions (Levy, Toll) were far too strong until they were gated behind a setup ability.

## Template overlap and coverage
No pair among the 119 playable characters overlaps by more than 70% (test). All required mechanics remain covered.
