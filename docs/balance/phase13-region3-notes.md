# Phase 13, region 3 (Slavic / Russian Night): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region3` (56 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region3.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 51.4%. Average match 15.6 turns; 104 of 5,000 matches hit the 40-turn limit.

## The 10 new characters (win rate over about 900 games each)
| Character | Win % | Read |
|---|---|---|
| The Firebird | 64.0 | Above 60%. Tuned twice (HP 90 to 70, rebirth 50 to 40 health, Cinder Storm dearer and slower). A healer that also cannot be killed once. |
| Zmey Gorynych | 62.4 | Above 60%. Tuned twice (from 76%: HP 170 to 130, Roar 90 to 70 and cooldown 5, shorter Burn and poison). The three-head chain is rarely completed; the heads are simply efficient. |
| Marya the Warrior | 61.4 | Slightly above. Tuned (Horse Charge 60 to 50, HP 130). Was 75% overlapping Tortuga Rex by effect before being given a counter and a cooldown status. |
| Domovoi | 61.3 | Slightly above; the ally shield triggers often. Warm Hearth cooldown 1 to 2. |
| The Birch Witch | 60.0 | At the flag. |
| Leshy | 58.8 | Fine. |
| Rusalka | 57.3 | Fine. |
| Father Frost | 56.1 | Fine. |
| The Midnight Tsar | 52.3 | Fine. |
| One-Eyed Likho | 41.8 | Low: her strong plays need a curse and cost her health. Watch. |

## What it does to the older roster
The same pattern as regions 1 and 2 (OQ-71): the most conditional older kits sit lowest (Referee 28%, Moonshot 29%, Maestro 30%, Whiskers 31%, Malachar 32%, Oni of the Red Gate 33%) and simple efficient kits at the top (Patient Zero 70%, Cyclops Brontes 65%, Nemesis 65%). Region 3's new kits average 58%, higher than regions 1 and 2, which is a sign that the design pattern "cheap statuses, one payoff" is systematically stronger for heuristic bots than the older conditional kits.

## Template overlap
No pair among the 56 playable characters overlaps by more than 70%. The closest are Hecate's Disciple / One-Eyed Likho, Icarion / Red Oni, Shiro / Asterion and Tengu Swordsman / The Mirror Samurai at 60%.

## Mechanical coverage
**Every one of the 55 required mechanics now has at least one character** (relics was the last, from The Midnight Tsar). Coverage before region 1 was 24 uncovered, and the test now fails if any mechanic drops to zero.
