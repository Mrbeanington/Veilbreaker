# Balance report — 2026-09-19

> Recommendations only. Nothing here changes a balance number. 3000 matches, seed 1, bots EXPERT vs EXPERT, 20 playable characters, random 3v3 teams, 40-turn limit. Bot skill shapes these numbers: re-run at a higher level before acting on a finding.

## Summary

- Seat results: playerA 1529, playerB 1460, draws 11
- Initiative: the player moving first wins 50.4% of decided games (1507 vs 1482)
- Match length: average 14.9 turns (min 4, max 40); 84 hit the turn limit
- Engine errors: 0

## Recommendations

- **investigate**: patient-zero wins 74% over 862 games (possible dominant pick).
- **investigate**: black-knight wins 66.1% over 932 games (possible dominant pick).
- **investigate**: baba-yaga wins 62.1% over 875 games (possible dominant pick).
- **investigate**: the-nameless-one wins 61.2% over 915 games (possible dominant pick).
- **watch**: malachar wins only 38.3% over 907 games (check it is situational, not just weak).
- **watch**: moonshot-maddox wins only 36.8% over 907 games (check it is situational, not just weak).
- **watch**: the-referee wins only 36.7% over 889 games (check it is situational, not just weak).
- **watch**: maestro-nocturne wins only 34.7% over 916 games (check it is situational, not just weak).
- **watch**: patient-zero beats behemoth 76.3% of the time (135 games).
- **watch**: patient-zero beats zeiron 77.7% of the time (148 games).
- **watch**: patient-zero beats plague-doctor 76.1% of the time (134 games).
- **watch**: patient-zero beats maestro-nocturne 84.4% of the time (141 games).
- **watch**: patient-zero beats emperor-zero 78% of the time (127 games).
- **watch**: patient-zero beats the-referee 83.2% of the time (119 games).
- **watch**: patient-zero beats hydra 75.4% of the time (134 games).
- **watch**: patient-zero beats mister-whiskers 79.7% of the time (128 games).
- **watch**: patient-zero beats moonshot-maddox 78.2% of the time (142 games).
- **watch**: patient-zero beats koschei 82.3% of the time (141 games).
- **watch**: patient-zero beats malachar 75.9% of the time (133 games).
- **watch**: patient-zero beats father-bell 75.4% of the time (134 games).
- **watch**: the-nameless-one beats zeiron 77% of the time (139 games).
- **watch**: black-knight beats zeiron 75.4% of the time (138 games).
- **watch**: black-knight beats moonshot-maddox 75.2% of the time (145 games).
- **watch**: black-knight beats maestro-nocturne 79.6% of the time (152 games).
- **watch**: nine-tailed-trickster beats maestro-nocturne 77.6% of the time (143 games).
- **watch**: baba-yaga beats zeiron 76% of the time (146 games).
- **watch**: baba-yaga beats maestro-nocturne 76.3% of the time (152 games).
- **watch**: Detector "energy-lockout" fired 1198 time(s).
- **watch**: Detector "one-turn-kill" fired 5 time(s).

## Character win rates

| Character | Games | Wins | Win % | Legend |
|---|---:|---:|---:|:---:|
| patient-zero | 862 | 638 | 74 |  |
| black-knight | 932 | 616 | 66.1 | yes |
| baba-yaga | 875 | 543 | 62.1 |  |
| the-nameless-one | 915 | 560 | 61.2 | yes |
| tortuga-rex | 885 | 515 | 58.2 |  |
| nine-tailed-trickster | 890 | 496 | 55.7 |  |
| hydra | 893 | 474 | 53.1 |  |
| the-gambler | 929 | 470 | 50.6 |  |
| father-bell | 882 | 437 | 49.5 |  |
| plague-doctor | 909 | 450 | 49.5 |  |
| shiro | 938 | 452 | 48.2 | yes |
| mister-whiskers | 909 | 433 | 47.6 |  |
| emperor-zero | 886 | 405 | 45.7 | yes |
| behemoth | 899 | 409 | 45.5 | yes |
| koschei | 868 | 366 | 42.2 |  |
| zeiron | 909 | 378 | 41.6 | yes |
| malachar | 907 | 347 | 38.3 |  |
| moonshot-maddox | 907 | 334 | 36.8 |  |
| the-referee | 889 | 326 | 36.7 |  |
| maestro-nocturne | 916 | 318 | 34.7 |  |

## Legend performance

- Teams containing a Legend: 51.4% over 4094 team-games
- Teams without a Legend: 46.4% over 1906 team-games

## Counter matrix (extremes)

| Character | vs | Games | Win % |
|---|---|---:|---:|
| patient-zero | maestro-nocturne | 141 | 84.4 |
| patient-zero | the-referee | 119 | 83.2 |
| patient-zero | koschei | 141 | 82.3 |
| patient-zero | mister-whiskers | 128 | 79.7 |
| black-knight | maestro-nocturne | 152 | 79.6 |
| patient-zero | moonshot-maddox | 142 | 78.2 |
| patient-zero | emperor-zero | 127 | 78 |
| patient-zero | zeiron | 148 | 77.7 |
| nine-tailed-trickster | maestro-nocturne | 143 | 77.6 |
| the-nameless-one | zeiron | 139 | 77 |
| maestro-nocturne | nine-tailed-trickster | 143 | 22.4 |
| zeiron | the-nameless-one | 139 | 22.3 |
| emperor-zero | patient-zero | 127 | 22 |
| zeiron | patient-zero | 148 | 21.6 |
| moonshot-maddox | patient-zero | 142 | 21.1 |
| mister-whiskers | patient-zero | 128 | 19.5 |
| maestro-nocturne | black-knight | 152 | 19.1 |
| koschei | patient-zero | 141 | 17.7 |
| maestro-nocturne | patient-zero | 141 | 14.9 |
| the-referee | patient-zero | 119 | 14.3 |

## Degenerate-pattern detectors

| Detector | Hits | Example |
|---|---:|---|
| turn-limit | 84 | seed 144638527: reached turn 41 |
| state-loop | 0 |  |
| perpetual-stun | 0 |  |
| energy-lockout | 1198 | seed 887333747: playerB had no legal action for 3 turns (turn 12) |
| one-turn-kill | 5 | seed 199981226: shiro killed from full health on turn 1 |
| resurrection-loop | 0 |  |
| rewind-loop | 0 |  |
| illegal-bot-action | 0 |  |
| engine-error | 0 |  |
| stalled | 0 |  |
