# Phase 13, region 7 (Horror / Monsters / Dead): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region7` (98 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region7.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 51.0%. Average match 16.6 turns; 140 of 5,000 matches hit the 40-turn limit.

## The 8 new characters
| Character | Win % | Read |
|---|---|---|
| The Scarecrow | 57.9 | Fine after tuning (from 63%: HP 130, Stand Stiff cooldown 4). Passive regeneration is efficient for bots. |
| The Collector | 57.4 | Fine. |
| The Grave Digger | 54.5 | Fine; Exhume is rarely available (6-turn cooldown, 4 energy). |
| The Vampire Countess | 48.7 | Fine. |
| The Headless Bride | 48.2 | Fine; Grief needs an ally to fall. |
| Ashmouth | 47.3 | Fine. |
| The Thing Beneath the Bed | 43.9 | Low: the full-health payoff is rarely available after turn 1. HP 100 to 110. Watch. |
| The Marionettist | 37.7 | Low after a buff (40-health puppet, cheaper Dance): summons and slowdowns barely register for heuristic bots. Watch. |

## Pattern
As before (OQ-71, OQ-80): direct efficient kits test highest; setup and control kits lowest.

## Template overlap and coverage
No pair among the 98 playable characters overlaps by more than 70% (test). All required mechanics remain covered.
