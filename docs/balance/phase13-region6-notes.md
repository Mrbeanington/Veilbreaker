# Phase 13, region 6 (World Folklore / Spirits / Tricksters): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region6` (90 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region6.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 51.0%. Average match 16.2 turns; 107 of 5,000 matches hit the 40-turn limit.

## The 12 new characters
| Character | Win % | Read |
|---|---|---|
| The Storyteller | 60.9 | At the flag. Tuned from 71% (HP 90, payoffs 30/40 instead of 40/60). The chain is easy for a bot to run. |
| The Thousand-Faced Stranger | 60.2 | At the flag. Wrath payoff 60 to 50. |
| Madame Fortuna (Legend) | 59.3 | Fine for a Legend: her rigging needs random-ability partners, and her Wheel is a gamble. |
| The Ghoul | 56.7 | Fine (from 62%: HP 120, heal 10). |
| Jiangshi | 55.4 | Fine. |
| Anansi | 54.1 | Fine. |
| The Roc | 52.5 | Fine. |
| The White Fox | 48.9 | Fine. |
| The Monkey Trickster | 47.4 | Slightly low. |
| The Moon Rabbit | 45.2 | Low; Elixir of Life cost cut Spirit 2 to 1. Watch. |
| Dokkaebi | 44.1 | Low: only Chaos energy from its gold. Watch. |
| The Wandering Genie | 42.4 | Low: wishes are front-loaded and then it is a 20-damage lamp. Watch. |

## Pattern
Same as regions 1-5 (OQ-71, OQ-80): simple efficient chains test highest, support and resource-limited kits lowest.

## Template overlap and coverage
No pair among the 90 playable characters overlaps by more than 70% (test); two pairs (Ghoul/Draugr, White Fox/Stranger) were reworked to get there. All required mechanics remain covered.
