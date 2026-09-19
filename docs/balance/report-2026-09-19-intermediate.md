# Balance report — 2026-09-19

> Recommendations only. Nothing here changes a balance number. 10000 matches, seed 1, bots INTERMEDIATE vs INTERMEDIATE, 20 playable characters, random 3v3 teams, 40-turn limit. Bot skill shapes these numbers: re-run at a higher level before acting on a finding.

## Summary

- Seat results: playerA 4962, playerB 5027, draws 11
- Initiative: the player moving first wins 36.8% of decided games (3673 vs 6316)
- Match length: average 25.2 turns (min 5, max 40); 1463 hit the turn limit
- Engine errors: 0

## Recommendations

- **investigate**: patient-zero wins 73.8% over 2935 games (possible dominant pick).
- **investigate**: hydra wins 70.4% over 2991 games (possible dominant pick).
- **investigate**: plague-doctor wins 62.5% over 3037 games (possible dominant pick).
- **watch**: maestro-nocturne wins only 33.9% over 2999 games (check it is situational, not just weak).
- **watch**: Initiative wins 36.8% of decided games; the first-turn advantage is outside 45-55%.
- **watch**: patient-zero beats zeiron 75% of the time (464 games).
- **watch**: patient-zero beats maestro-nocturne 85.2% of the time (487 games).
- **watch**: patient-zero beats emperor-zero 75.4% of the time (452 games).
- **watch**: patient-zero beats the-gambler 78.7% of the time (455 games).
- **watch**: patient-zero beats the-referee 79.1% of the time (440 games).
- **watch**: patient-zero beats moonshot-maddox 76.7% of the time (463 games).
- **watch**: patient-zero beats koschei 78.7% of the time (465 games).
- **watch**: patient-zero beats malachar 77.1% of the time (442 games).
- **watch**: patient-zero beats father-bell 78% of the time (501 games).
- **watch**: hydra beats zeiron 76.3% of the time (473 games).
- **watch**: hydra beats the-gambler 76.3% of the time (460 games).
- **watch**: hydra beats the-referee 77.4% of the time (473 games).
- **watch**: hydra beats maestro-nocturne 82% of the time (438 games).
- **watch**: hydra beats koschei 79.6% of the time (451 games).
- **watch**: hydra beats malachar 76.5% of the time (497 games).
- **watch**: hydra beats father-bell 75.3% of the time (490 games).
- **watch**: hydra beats moonshot-maddox 79.5% of the time (477 games).
- **watch**: Detector "energy-lockout" fired 12394 time(s).
- **watch**: Detector "one-turn-kill" fired 1 time(s).

## Character win rates

| Character | Games | Wins | Win % | Legend |
|---|---:|---:|---:|:---:|
| patient-zero | 2935 | 2166 | 73.8 |  |
| hydra | 2991 | 2106 | 70.4 |  |
| plague-doctor | 3037 | 1899 | 62.5 |  |
| black-knight | 3003 | 1745 | 58.1 | yes |
| the-nameless-one | 2993 | 1613 | 53.9 | yes |
| baba-yaga | 2988 | 1584 | 53 |  |
| mister-whiskers | 3023 | 1586 | 52.5 |  |
| nine-tailed-trickster | 2999 | 1571 | 52.4 |  |
| shiro | 3097 | 1547 | 50 | yes |
| behemoth | 2992 | 1438 | 48.1 | yes |
| tortuga-rex | 2973 | 1412 | 47.5 |  |
| zeiron | 2982 | 1377 | 46.2 | yes |
| emperor-zero | 2991 | 1350 | 45.1 | yes |
| koschei | 3040 | 1339 | 44 |  |
| malachar | 3000 | 1282 | 42.7 |  |
| father-bell | 3035 | 1280 | 42.2 |  |
| moonshot-maddox | 2902 | 1200 | 41.4 |  |
| the-gambler | 3013 | 1230 | 40.8 |  |
| the-referee | 3007 | 1226 | 40.8 |  |
| maestro-nocturne | 2999 | 1016 | 33.9 |  |

## Legend performance

- Teams containing a Legend: 50.2% over 13577 team-games
- Teams without a Legend: 49.5% over 6423 team-games

## Counter matrix (extremes)

| Character | vs | Games | Win % |
|---|---|---:|---:|
| patient-zero | maestro-nocturne | 487 | 85.2 |
| hydra | maestro-nocturne | 438 | 82 |
| hydra | koschei | 451 | 79.6 |
| hydra | moonshot-maddox | 477 | 79.5 |
| patient-zero | the-referee | 440 | 79.1 |
| patient-zero | the-gambler | 455 | 78.7 |
| patient-zero | koschei | 465 | 78.7 |
| patient-zero | father-bell | 501 | 78 |
| hydra | the-referee | 473 | 77.4 |
| patient-zero | malachar | 442 | 77.1 |
| malachar | patient-zero | 442 | 22.9 |
| the-referee | hydra | 473 | 22.4 |
| father-bell | patient-zero | 501 | 22 |
| the-gambler | patient-zero | 455 | 21.3 |
| koschei | patient-zero | 465 | 21.3 |
| the-referee | patient-zero | 440 | 20.7 |
| moonshot-maddox | hydra | 477 | 20.5 |
| koschei | hydra | 451 | 20.4 |
| maestro-nocturne | hydra | 438 | 17.6 |
| maestro-nocturne | patient-zero | 487 | 14.8 |

## Degenerate-pattern detectors

| Detector | Hits | Example |
|---|---:|---|
| turn-limit | 1463 | seed 887333747: reached turn 41 |
| state-loop | 0 |  |
| perpetual-stun | 0 |  |
| energy-lockout | 12394 | seed 1346631033: playerA had no legal action for 3 turns (turn 3) |
| one-turn-kill | 1 | seed 601428711: moonshot-maddox killed from full health on turn 13 |
| resurrection-loop | 0 |  |
| rewind-loop | 0 |  |
| illegal-bot-action | 0 |  |
| engine-error | 0 |  |
| stalled | 0 |  |
