# Balance patch release-3

Published 2026-09-21 as `packages/content/src/balance-patches/release-3.json` (draft copy: `docs/balance/drafts/release-3.json`). It contains every release-2 change plus 11 more, so it stands alone against `release-1`.

## Why

After release-2, five fighters still won 59 to 65% at both bot levels: Leshy, King Croak, Rusalka, The Honey Badger and Draugr. Two more (The Firebird, The Gatekeeper) were high at Expert.

## What changed (on top of release-2)

| Fighter | Change |
|---|---|
| Leshy | 150 to 130 HP |
| The Honey Badger | 120 to 110 HP; Frenzied Bite cooldown 1 to 2 |
| Draugr | 130 to 120 HP |
| King Croak | Poison Dart cooldown 1 to 2 |
| Rusalka | Cold Whisper cooldown 1 to 2 |
| The Firebird | Glowing Feather cooldown 3 to 4 |
| The Gatekeeper | Halberd Thrust cooldown 1 to 2 |
| Fourth & One | Go For It cooldown 1 to 2 |
| The Storyteller | Once Upon a Time cooldown 0 to 1 |

## Result (same seeds; release-2 against release-3)

| Run | Spread | Highest | Notes |
|---|---|---|---|
| Intermediate, seed 78 | 7.09 to 7.00 | 62.6 to 63.7 | Leshy 57 to 53, King Croak 51 to 47, Draugr 58 to 55 |
| Intermediate, seed 79 | 7.26 to 7.13 | 62.4 to 61.6 | Leshy 62 to 57, King Croak 53 to 48 |
| Expert, 6,000 matches | 8.29 to 8.06 | 68.7 to 68.1 | Rusalka 56 to 50, Honey Badger 60 to 56, King Croak 64 to 59, Leshy 65 to 61 |

## Known limits

This is a small pass. The named fighters moved 3 to 6 points in the intended direction at both bot levels, but the overall spread barely changed (inside the noise for a 6,000-match Expert run). The Firebird (68%), The Ghoul, The Gatekeeper and Anubian Judge are still high at Expert; Fourth & One rose at Intermediate on seed 78, which is probably noise. Malachar stays lowest (30 to 35%). Bots are not people: further tuning by simulation alone has reached diminishing returns, and the next pass should follow real playtests (OQ-110).
