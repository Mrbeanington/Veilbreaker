# The Gambler
**Data:** `the-gambler.ts` · SECRET Cheater · RANDOM · 100 HP

## Identity / win condition
High Stakes: 3-in-4 a 10-damage hit that banks a **Chip**, 1-in-4 a 60-damage jackpot. Cash Out spends 3 Chips for 50 (else 10). Cold Deck weakens. Loaded Dice is the rule-break.

## Cheater rule-break and counterplay
**Rule broken:** Loaded Dice forces his next random outcome to its best branch. **Counterplay:** 2 Chaos, 3-turn cooldown, logged when queued (`rngModifierQueued`), consumed by his very next roll, and useless for his non-random abilities. The house edge means he is weakest before he has Chips.

## Tests
Roll consistency across 25 seeds (small hit always banks a Chip, jackpot never), determinism, Loaded Dice guaranteeing 60 then being spent, and Cash Out tiers, in `batch2.scenario.test.ts`.

## Deviations
Distinct from **Mister Whiskers** (who also manipulates odds): the Gambler's economy is Chips; Whiskers' is survival and targeting.
