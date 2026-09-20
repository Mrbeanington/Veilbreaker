# Phase 13 summary: the roster at 120

**Result:** 120 character definitions, 119 playable (the 120th, Whiskers, Devourer of Worlds, is the final stage of Mister Whiskers). 23 Core, 70 Rare, 14 Secret, 12 Legendary. Every one has data, an art spec and visual bible, a design note (`docs/design/characters/`) and scenario tests. No custom scripts were added.

## Regions (one session each)
| Region | New characters | Notes |
|---|---|---|
| 1 Ancient Mediterranean | 13 | Foretold status; self-damage engine fix; coverage detectors; overlap test |
| 2 Japanese / Ink | 13 | Resurrection targeting (`includeDead`); pet summons; QR pair cap |
| 3 Slavic / Russian Night | 10 | Relics; every required mechanic covered |
| 4 Northern / Celtic | 11 | Morrigan (Legend); Crow Prophecy; status self-target fix |
| 5 Egypt / Desert | 11 | Aurelia (Legend); Sun Guard; all-enemies effect targets |
| 6 World Folklore | 12 | Madame Fortuna (Legend, Cheater); worst-to-best branch order; QR byte budget |
| 7 Horror / Monsters / Dead | 8 | Exhume; cooldown and cost-increase kits |
| 8 Animals / Weird | 7 | The Minotaur King (Legend); QR bitsets; meta-pool floor |
| 9 Sports / Fighters | 5 | Piercing serve; Downs; long bomb |
| 10 Music / Entertainment / Chaos | 5 | Orpheon (Legend); Chef Ramble's Five-Star Fiend (OQ-10 resolved) |
| 11 Final Seven | 4 | Calypsa (Legend, the twelfth); The Lawyer and The Gatekeeper (Secrets) |

## Engine changes over the phase (all with regression tests)
`damage` `target` override honoured (region 1); `TargetRule.includeDead` and a dying character's own death trigger (region 2); `applyStatus` and `removeStatus` `target` override (region 4); `status.sun-guard` and an all-enemies effect target (region 5). Everything else was content.

## Checks that now guard the roster
The coverage matrix fails if any required mechanic has no character; a template-overlap test fails any pair over 70%; the shared roster test kit checks kits, art, secrets, design notes and (for Legends) heavy costs and named counters; the 5,000-match simulation is run and recorded every region.

## Balance
Recommendations only were recorded, never auto-applied. The recurring pattern (OQ-71, OQ-80): simple efficient kits and status-payoff kits test 58-70% against heuristic bots, while older conditional kits, setup kits and gambles test 28-45%. Every region logged its outliers; Phase 15 should re-run at Expert level before touching numbers.

## Scale problems found and fixed on the way
QR transfer codes (pair caps, then bitsets); the meta pool's minimum games per trio; ladder and transfer tests loosened where a bigger roster compressed win rates (OQ-95, OQ-97, OQ-99).

## Open items handed to later phases
OQ-70 to OQ-103 (balance outliers, Curse and Fear have no engine rule, pets have no actions, a second passive slot, ally-all damage). Phase 14 (art specs) and Phase 15 (balance, polish, accessibility, offline, security) are next.
