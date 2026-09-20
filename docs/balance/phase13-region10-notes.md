# Phase 13, region 10 (Music / Entertainment / Chaos): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region10` (115 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region10.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 51.0%. Average match 16.6 turns; 116 of 5,000 matches hit the 40-turn limit.

## The 5 new characters
| Character | Win % | Read |
|---|---|---|
| DJ Cataclysm | 59.1 | Slightly above; the area drop is efficient. |
| Orpheon (Legend) | 58.3 | Fine for a Legend; the interruptions are real counters. |
| Chef Ramble | 54.9 | Fine after four rounds (from 77%: base recipe steps weakened, HP 110, a lighter Fiend with a longer Kitchen Nightmare cooldown). |
| Johnny Feedback | 44.0 | Low; Power Chord threshold cut to 2 Feedback and the cap cost to 10. Watch. |
| The Mime | 43.8 | Low; buffed twice (HP 120, a cheaper 30 slap, a 60 Mimic Strike). Reflect and Counter rarely matter to bots. Watch. |

## Pattern
As before (OQ-71, OQ-80): area and chained payoffs test highest; copy and resource-balancing kits lowest.

## Template overlap and coverage
No pair among the 115 playable characters overlaps by more than 70% (test); the Mime was reworked to get there. All required mechanics remain covered.
