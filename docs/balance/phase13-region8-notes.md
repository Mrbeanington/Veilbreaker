# Phase 13, region 8 (Animals / Weird Characters): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region8` (105 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region8.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 50.6%. Average match 16.9 turns; 115 of 5,000 matches hit the 40-turn limit.

## The 7 new characters
| Character | Win % | Read |
|---|---|---|
| The Honey Badger | 60.7 | At the flag. A cheap bruiser with a cleanse and a hardening passive. |
| King Croak | 57.7 | Fine. |
| The Minotaur King (Legend) | 57.4 | Fine after four rounds (from 75%: HP 130, weaker and slower Wall, dearer Closes). A team stun and a taunt are very efficient for bots. |
| Sir Hopsalot | 57.3 | Fine. |
| General Goose | 50.6 | Fine. |
| The Albino Gorilla | 46.9 | Low; Slam cost cut Might 3 to 2. Watch. |
| Professor Octopus | 44.8 | Low; four small hits and a cooldown reset are hard for bots to use. Watch. |

## Pattern
As before (OQ-71, OQ-80): direct efficient kits and status payoffs test highest; kits that need planning lowest.

## Template overlap and coverage
No pair among the 105 playable characters overlaps by more than 70% (test); three pairs were reworked to get there. All required mechanics remain covered.
