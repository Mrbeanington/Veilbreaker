# Release-3 balance check (2026-09-21)

Fresh runs on the shipped balance (release-3): 20,000 Intermediate matches (seed 101) and 6,000 Expert matches (seed 102). Full reports: `report-2026-09-21-release3-intermediate.md` and `report-2026-09-21-release3-expert.md`. 0 engine errors in both.

| | Intermediate | Expert |
|---|---|---|
| Spread of fighter win rates (std dev) | 7.0 | 8.6 |
| Lowest to highest | 34.5 to 62.7 | 28.1 to 72.3 |
| Fighters above 58% / below 42% | 13 / 25 | 20 / 28 |
| First-player win rate | 51.9% | 51.9% |
| Average length | 15.5 turns | 14.1 turns |
| Legend teams vs teams without a Legend | 48.3% vs 49.1% | 45.6% vs 50.2% |

## Findings

1. **Legends are not out-performing, and some are weak.** A Legend is a reward players work towards, so it should feel strong. At Expert, Legend teams win less than teams without one. Weakest: Shiro (38%), Aurelia (37%), Zeiron (36 to 44%), Morrigan (45%), Emperor Zero (40% at Expert), Calypsa (43% at Expert). Strongest: Behemoth (54 to 57%) and Orpheon (54 to 59%). This is the best candidate for the next patch.
2. **Still too strong:** The Firebird (60% Intermediate, 72% Expert), Patient Zero (63% Intermediate), Fourth & One, The Gatekeeper, Anubian Judge, The Ghoul, Leshy, Asterion at Expert.
3. **Still too weak:** Malachar (37% / 29%), Oni of the Red Gate (28% at Expert), Mister Whiskers (35%), The Painted Ronin, Plague Doctor and Frost Jotunn at Expert, The Sphinx, One-Eyed Likho.
4. **Health of the system:** first-player advantage is small (52%), no loops or stalls, one-turn kills are rare (56 of 20,000). About 2.7% of Intermediate matches (549) still have a team with no legal action for three turns (a survivor with only expensive abilities), unchanged from before.

## Suggestion

Fold a Legend buff into the next patch (release-4) together with a trim for The Firebird and Patient Zero, but only after real playtests, since bot-only tuning has reached diminishing returns (ADR-045). Expert-level results have about 3.5 points of noise per fighter at 6,000 matches.
