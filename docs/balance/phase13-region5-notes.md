# Phase 13, region 5 (Egypt / Desert / Ancient Kingdoms): simulation notes

Run: `pnpm sim --matches 5000 --bots intermediate --seed 1 --label phase13-region5` (78 playable characters, random 3v3 teams, INTERMEDIATE bots). Full report: `report-2026-09-20-phase13-region5.md`. **Recommendations only: nothing was auto-adjusted.** Balance polish belongs to Phase 15.

## Health of the run
0 engine errors. First player 50.4%. Average match 16.5 turns; 110 of 5,000 matches hit the 40-turn limit.

## The 11 new characters
| Character | Win % | Read |
|---|---|---|
| Anubian Judge | 61.2 | Above 60%. Payoff cut 60 to 40 (from 64%). Punishes any strong attacker. |
| The Living Sarcophagus | 58.4 | Slightly above. Grave Dust (weaken all) made it 64%, so it now costs Focus and Spirit on a 4-turn cooldown. |
| Ifrit | 57.6 | Fine after three rounds (from 70%: HP 100, Molten Fury 40, Burn 5). |
| Jackal Guardian | 57.1 | Fine. |
| The Pharaoh Without a Tomb | 52.3 | Fine. |
| Sand Assassin | 50.4 | Fine. |
| The Scarab King | 49.5 | Fine. |
| The Mummy Prince | 46.4 | Slightly low; the death curse rarely matters (Curse has no rule). |
| Aurelia (Legend) | 45.7 | A support Legend that does no burst of her own; low is the intent. Buffed once (HP 120 to 140). |
| Desert Djinn | 44.6 | Low: Twisted Wish can heal the enemy. Watch. |
| The Sphinx | 44.0 | Low: the lock only bites one family. HP 130 to 140. Watch. |

## Pattern
Same as regions 1-4 (OQ-71, OQ-80): the simple efficient kits and status-payoff kits test highest.

## Template overlap and coverage
No pair among the 78 playable characters overlaps by more than 70% (test). All required mechanics remain covered.
