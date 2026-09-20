# Phase 13, region 4 (Northern / Celtic): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region4` (67 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region4.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 51.3%. Average match 16.2 turns; 118 of 5,000 matches hit the 40-turn limit.

## The 11 new characters
| Character | Win % | Read |
|---|---|---|
| The Valkyrie | 65.5 | Above 60%. Tuned from 76% (HP 130 to 100, Winged Descent cooldown 4, Battle Cry cooldown 2, save 30 to 20 health). The once-per-battle ally save is strong on any team. |
| Shieldmaiden Yrsa | 63.5 | Above 60%. Shield Bash 40 to 30, HP 140. |
| Draugr | 62.3 | Above 60%. Barrow Hunger heal 30 to 20, HP 140. |
| The Berserker | 54.3 | Fine. |
| The Dullahan | 53.9 | Fine. |
| Fenris | 52.9 | Fine. |
| Morrigan (Legend) | 50.4 | Fine. Buffed once (Carrion Call 30 to 40): her prophecy needs a hurt enemy. |
| The Wild Huntsman | 49.9 | Fine. |
| Frost Jotunn | 48.2 | Fine. |
| Banshee | 41.9 | Low: mostly small effects. Watch. |
| Puca | 37.6 | Low: Lead Astray is single-target and the gamble sometimes misses. Watch. |

## Pattern
Same as regions 1-3 (OQ-71, OQ-80): the simple kits (Valkyrie, Yrsa, Draugr) test high, the conditional ones lower. The Legend sits at 50%, which is the intent for a controller that needs partners.

## Template overlap and coverage
No pair among the 67 playable characters overlaps by more than 70% (test). All required mechanics remain covered.
