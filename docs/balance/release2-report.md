# Balance patch release-2

Published 2026-09-20 as `packages/content/src/balance-patches/release-2.json` (draft copy: `docs/balance/drafts/release-2.json`), 38 numeric changes on top of `release-1`. New matches, the UI and the bots use it; replays recorded under `release-1` keep resolving under their own numbers.

## Why

A 20,000-match INTERMEDIATE run of release-1 (seed 77) showed fighters from 30% to 65%. The top was Shieldmaiden Yrsa, Domovoi, The Valkyrie, El Magnífico, The Living Sarcophagus and Madame Fortuna (all 64-65%). The bottom was Malachar (30%), Kappa Kiro, Nekomata, The Gunslinger QB, Moonshot Maddox and The Gambler (34-35%). Two of the top were Core starters new players meet first.

## What changed

| Fighter | Change |
|---|---|
| Shieldmaiden Yrsa | 140 to 120 HP; Cover an Ally cooldown 2 to 3 |
| Domovoi | 110 to 100 HP; Warm Hearth cooldown 2 to 3 |
| The Valkyrie | Chooser of the Slain 20 to 10; Battle Cry cooldown 2 to 3; Shield of the Slain 20 to 10 |
| El Magnífico | 130 to 110 HP |
| The Living Sarcophagus | 180 to 160 HP |
| Madame Fortuna | Turn the Card cooldown 0 to 1 |
| Tortuga Rex, Asterion | 140 to 130 HP, 160 to 150 HP |
| Patient Zero | Festering Wound stacks 3 to 2 |
| Malachar | 130 to 140 HP; Raise the Forgotten cooldown 2 to 1 |
| Kappa Kiro | Riverbank Grab weak hit 10 to 20; Drag Under cooldown 4 to 3 |
| The Gunslinger QB | 100 to 110 HP; Long Bomb loses its Focus cost |
| Nekomata | Claw Swipe 20 to 30 |
| Moonshot Maddox | 110 to 120 HP; Home Run weak hit 10 to 20; Double Down the Line costs 1 Focus not 2 |
| The Gambler | Cash Out weak hit 10 to 20; Loaded Dice costs 1 Chaos not 2 |
| The Painted Ronin | 120 to 130 HP; Portrait of a Foe cooldown 3 to 2 |
| The Sphinx | Stone Silence cooldown 4 to 3 |
| Medusa | Snake Bite 10 to 20; Gorgon's Glare cooldown 6 to 5 |
| Oni of the Red Gate | 170 to 190 HP |
| The Firebird | Rise from Ashes 30 to 20 |
| King Croak | 120 to 110 HP; Lily Pad Throne 30 to 20 |
| The Ghoul | Shroud of Dirt 30 to 20 |
| El Magnífico (again) | Second Wind cooldown 3 to 4 |
| Hydra | Many-Mouthed Lunge costs 2 Might not 3 |
| The Siren | Lure 10 to 20 |

## Result (20,000 INTERMEDIATE matches per run, same seeds before and after)

| Seed | Spread (std dev of win rate) | Lowest to highest | Fighters above 58% |
|---|---|---|---|
| 78, release-1 | 7.87 | 33.4 to 65.7 | 20 |
| 78, release-2 | 7.09 | 35.1 to 62.6 | 15 |
| 79, release-1 | 8.26 | 33.0 to 64.5 | 24 |
| 79, release-2 | 7.26 | 35.5 to 62.4 | 16 |

EXPERT bots, 6,000 matches (a smaller sample, so each fighter is about 3.5 points uncertain): spread 8.95 to 8.29, highest 73.7 to 68.7, fighters above 58% 21 to 17.

First-player win rate (INTERMEDIATE) stayed 50.8 to 51.5%, average length 15.5 turns, Legend teams 48 to 49.5% (was 49 to 50%). 0 engine errors.

## Known limits

- The gain is modest and partly zero-sum: lifting the bottom pushes others up. Nekomata (48%) and Medusa (45%) went further than intended because one change moved a lot; watch them.
- Malachar (35%), Mister Whiskers, Shiro, Father Bell, The Sphinx, The Painted Ronin and Oni of the Red Gate stay near 35 to 38%. They are situational or rely on setup that heuristic bots play badly (OQ-110).
- The Valkyrie fell from 65% to 53 to 54%, so the pass may have overshot her.
- At EXPERT The Firebird (69%), The Gatekeeper (66%), King Croak (64%), Leshy, The Ghoul and Draugr still win a lot; Draugr rose from 60 to 64% as others fell. Expect to trim them after playtests.
- Bots are not people. Treat this as a first pass and re-check after real playtests.
