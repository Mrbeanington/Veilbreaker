# Balance patch release-4

Published 2026-09-21 as `packages/content/src/balance-patches/release-4.json` (draft: `docs/balance/drafts/release-4.json`). It contains every release-3 change plus 13 more.

## Why

The release-3 check (`release3-check-2026-09-21.md`) found the Legends were the weakest group at both bot levels: Legend teams won 48% against 49% for teams without one at Intermediate, and 46% against 50% at Expert. A Legend is what players work towards, so it has to feel strong.

## What changed (on top of release-3)

| Fighter | Change |
|---|---|
| Shiro | 100 to 120 HP; Final Stroke costs 2 Focus not 3 and has a 3-turn cooldown not 4; Ink Veil costs 1 Spirit not 2 |
| Aurelia | 140 to 150 HP; Zenith Aegis costs 2 Spirit not 3 and has a 5-turn cooldown not 6; Solar Mend heals 30 not 20; Sun's Vigil cooldown 4 to 3 |
| Zeiron | Wrath of the Unchained Sky costs 2 Might not 3 |
| Morrigan | 130 to 140 HP; Storm of Crows cooldown 5 to 4 |
| Emperor Zero | Cold Logic 25 to 30 damage; Revoke cooldown 5 to 4 |
| Calypsa | Maelstrom costs 2 Might not 3 |
| The Firebird | Rise from Ashes 20 to 10 |
| Patient Zero | Outbreak Pulse cooldown 2 to 3 |

A first version also raised Chain Lightning; Zeiron then won 61 to 64% at Intermediate, so that change was dropped.

## Result (same seeds, release-3 against release-4)

| | Release-3 | Release-4 |
|---|---|---|
| Intermediate, Legend teams vs others (seed 78) | 48 vs 49 | 51.8 vs 47.8 |
| Intermediate, Legend teams vs others (seed 101) | 48.3 vs 49.1 | 50.9 vs 48.1 |
| Expert, Legend teams vs others (seed 91) | 46 vs 50 | 48.5 vs 48.8 |
| Spread (std dev, Intermediate seed 78 / Expert seed 91) | 7.00 / 8.06 | 6.94 / 8.06 |
| Aurelia, Shiro (Intermediate seed 78) | 40, 38 | 51, 45 |

Legends now sit at parity or slightly above at both levels. 0 engine errors.

## Known limits

- Zeiron is still strong at Intermediate (58 to 60%) and about even at Expert; Emperor Zero and Calypsa run 55 to 58% at Intermediate.
- Shiro (41 to 45%), Aurelia at Expert (45 to 50%) and Morrigan (46 to 49%) are still on the low side.
- The Firebird stays high at Expert (68%); its trim moved little.
- Bots are not people. Confirm with playtests (`docs/PLAYTEST.md`).
