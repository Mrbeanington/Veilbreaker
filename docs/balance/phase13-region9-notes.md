# Phase 13, region 9 (Sports / Fighters): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region9` (110 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region9.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 50.8%. Average match 17.0 turns; 154 of 5,000 matches hit the 40-turn limit.

## The 5 new characters
| Character | Win % | Read |
|---|---|---|
| El Magnífico | 57.8 | Fine. |
| Fourth & One | 55.8 | Fine after tuning (from 65%: HP 120, Go For It 80 to 70). |
| Ace | 51.6 | Fine. |
| The Contender | 49.8 | Fine. |
| The Gunslinger QB | 37.2 | Low: 1 in 5 throws cost 20 of 100 HP. Buffed once. Watch. |

## Pattern
As before (OQ-71, OQ-80): timer-fed and status-payoff kits test highest; gambles lowest.

## Template overlap and coverage
No pair among the 110 playable characters overlaps by more than 70% (test). All required mechanics remain covered.
