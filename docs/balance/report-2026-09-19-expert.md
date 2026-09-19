# Balance report — 2026-09-19

> Recommendations only. Nothing here changes a balance number. 10000 matches, seed 1, bots EXPERT vs EXPERT, 20 playable characters, random 3v3 teams, 40-turn limit. Bot skill shapes these numbers: re-run at a higher level before acting on a finding.

## Summary

- Seat results: playerA 4984, playerB 5004, draws 12
- Initiative: the player moving first wins 35.8% of decided games (3575 vs 6413)
- Match length: average 23.6 turns (min 6, max 40); 1140 hit the turn limit
- Engine errors: 0

## Recommendations

- **investigate**: patient-zero wins 74% over 2935 games (possible dominant pick).
- **investigate**: hydra wins 67.6% over 2991 games (possible dominant pick).
- **investigate**: plague-doctor wins 60% over 3037 games (possible dominant pick).
- **watch**: maestro-nocturne wins only 34.3% over 2999 games (check it is situational, not just weak).
- **watch**: Initiative wins 35.8% of decided games; the first-turn advantage is outside 45-55%.
- **watch**: patient-zero beats behemoth 77% of the time (469 games).
- **watch**: patient-zero beats zeiron 80.6% of the time (464 games).
- **watch**: patient-zero beats maestro-nocturne 84% of the time (487 games).
- **watch**: patient-zero beats emperor-zero 79.9% of the time (452 games).
- **watch**: patient-zero beats the-referee 76.1% of the time (440 games).
- **watch**: patient-zero beats moonshot-maddox 77.8% of the time (463 games).
- **watch**: patient-zero beats koschei 77.4% of the time (465 games).
- **watch**: patient-zero beats malachar 76.2% of the time (442 games).
- **watch**: patient-zero beats father-bell 78.4% of the time (501 games).
- **watch**: patient-zero beats tortuga-rex 77.9% of the time (456 games).
- **watch**: hydra beats emperor-zero 75.5% of the time (474 games).
- **watch**: hydra beats maestro-nocturne 78.1% of the time (438 games).
- **watch**: hydra beats koschei 75.2% of the time (451 games).
- **watch**: hydra beats moonshot-maddox 76.3% of the time (477 games).
- **watch**: Detector "energy-lockout" fired 12418 time(s).
- **watch**: Detector "one-turn-kill" fired 1 time(s).

## Character win rates

| Character | Games | Wins | Win % | Legend |
|---|---:|---:|---:|:---:|
| patient-zero | 2935 | 2172 | 74 |  |
| hydra | 2991 | 2022 | 67.6 |  |
| plague-doctor | 3037 | 1821 | 60 |  |
| baba-yaga | 2988 | 1764 | 59 |  |
| nine-tailed-trickster | 2999 | 1663 | 55.5 |  |
| mister-whiskers | 3023 | 1672 | 55.3 |  |
| the-nameless-one | 2993 | 1649 | 55.1 | yes |
| black-knight | 3003 | 1626 | 54.1 | yes |
| shiro | 3097 | 1543 | 49.8 | yes |
| the-gambler | 3013 | 1382 | 45.9 |  |
| behemoth | 2992 | 1359 | 45.4 | yes |
| malachar | 3000 | 1358 | 45.3 |  |
| the-referee | 3007 | 1350 | 44.9 |  |
| koschei | 3040 | 1359 | 44.7 |  |
| tortuga-rex | 2973 | 1256 | 42.2 |  |
| moonshot-maddox | 2902 | 1205 | 41.5 |  |
| father-bell | 3035 | 1261 | 41.5 |  |
| zeiron | 2982 | 1237 | 41.5 | yes |
| emperor-zero | 2991 | 1237 | 41.4 | yes |
| maestro-nocturne | 2999 | 1028 | 34.3 |  |

## Legend performance

- Teams containing a Legend: 48.5% over 13577 team-games
- Teams without a Legend: 53% over 6423 team-games

## Counter matrix (extremes)

| Character | vs | Games | Win % |
|---|---|---:|---:|
| patient-zero | maestro-nocturne | 487 | 84 |
| patient-zero | zeiron | 464 | 80.6 |
| patient-zero | emperor-zero | 452 | 79.9 |
| patient-zero | father-bell | 501 | 78.4 |
| hydra | maestro-nocturne | 438 | 78.1 |
| patient-zero | tortuga-rex | 456 | 77.9 |
| patient-zero | moonshot-maddox | 463 | 77.8 |
| patient-zero | koschei | 465 | 77.4 |
| patient-zero | behemoth | 469 | 77 |
| hydra | moonshot-maddox | 477 | 76.3 |
| moonshot-maddox | hydra | 477 | 23.5 |
| behemoth | patient-zero | 469 | 23 |
| koschei | patient-zero | 465 | 22.4 |
| tortuga-rex | patient-zero | 456 | 22.1 |
| moonshot-maddox | patient-zero | 463 | 22 |
| maestro-nocturne | hydra | 438 | 21.9 |
| father-bell | patient-zero | 501 | 21.6 |
| emperor-zero | patient-zero | 452 | 20.1 |
| zeiron | patient-zero | 464 | 19.4 |
| maestro-nocturne | patient-zero | 487 | 15.8 |

## Degenerate-pattern detectors

| Detector | Hits | Example |
|---|---:|---|
| turn-limit | 1140 | seed 887333747: reached turn 41 |
| state-loop | 0 |  |
| perpetual-stun | 0 |  |
| energy-lockout | 12418 | seed 1346631033: playerA had no legal action for 3 turns (turn 3) |
| one-turn-kill | 1 | seed 608052572: nine-tailed-trickster killed from full health on turn 13 |
| resurrection-loop | 0 |  |
| rewind-loop | 0 |  |
| illegal-bot-action | 0 |  |
| engine-error | 0 |  |
| stalled | 0 |  |
