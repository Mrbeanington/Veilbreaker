# Phase 13, region 2 (Japanese Folklore / Ink Realm): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region2` (46 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-19-phase13-region2.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 49.2%. Average match 15.9 turns; 119 of 5,000 matches hit the 40-turn limit. Detectors: energy lockout (widespread, pre-existing), one-turn kills 11.

## The 13 new characters (win rate over about 850 games each)
| Character | Win % | Read |
|---|---|---|
| The Mirror Samurai | 63.8 | Above the 60% flag. Tuned (HP 140 to 130, the combo 60 to 50). Counter and reflect mostly stall the bots. |
| Gashadokuro | 63.2 | Above 60%. Tuned (HP 190 to 160, Grasp cooldown 4 to 5, Devour payoff 50 to 60 to offset its own weakness). Stun plus lifesteal. |
| Red Oni | 58.0 | Fine. |
| Blue Oni | 58.0 | Fine (better with Red Oni; bots pick teams at random so the pair is rare). |
| Umbrella Yokai | 55.1 | Fine. |
| Yuki-Onna | 54.4 | Fine. |
| Lantern Spirit | 54.1 | Fine for an 80-HP support. |
| Tengu Swordsman | 51.2 | Fine. |
| The Paper Monk | 46.2 | Fine; a healer that needs a partner. |
| Nekomata | 44.8 | Fine; the resurrection is used rarely by the bot. |
| The Painted Ronin | 41.3 | Low: four Ink is slow to build. Watch. |
| Kappa Kiro | 39.3 | Low: a small hit empties the dish. Watch. |
| Oni of the Red Gate | 35.8 | Low: the decaying design punishes a bot that does not stall. Buffed once (Cleave 60/40 to 70/50, HP 140 to 160). Watch. |

## What it does to the older roster
Still the pattern seen after region 1 (OQ-71): the most conditional older kits sit at 30-35% (Maestro 29.5%, Malachar 33%, Referee 33%, Moonshot 33%, Koschei 34.5%) and the simplest attackers at the top (Patient Zero 69%, Asterion 66.5%, The Bronze Giant 65%, Nemesis 64%, Cyclops Brontes 64%). Region 2 did not make this worse: the new kits average 51%.

## Template overlap
No pair among the 46 playable characters overlaps by more than 70%. The closest are Icarion / Red Oni, Shiro / Asterion and Tengu Swordsman / The Mirror Samurai at 60%.

## Mechanical coverage
Only **relics** now has no character (down from 5 uncovered after region 1 and 24 before it). Region 2 added resurrection (Nekomata), pets (The Paper Monk), ink (The Painted Ronin, The Paper Monk), energy generation (Lantern Spirit) and ice (Yuki-Onna).
