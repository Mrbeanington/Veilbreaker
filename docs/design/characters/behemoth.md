# Behemoth (Legend)
**Data:** `behemoth.ts` · LEGENDARY · BEAST/BRUISER · 220 HP

## Identity / win condition
A wall of health that cannot be healed: Gore 50, Primordial Stomp 30 to all, Thick Hide (-20 dmg), Rampage (20 to all, 50 when below half HP). Wins by taxing the enemy team's energy while nothing can mend it.

## Balance levers (spec/03)
High costs (3–5 Might), long cooldowns (2–4), no healing ever, no ranged/utility. Its passive re-applies the non-dispellable Unhealable status each turn start, so no heal can land on turn 1 either.

## Counterplay — at least two concrete counters
- **Patient Zero**: Infection ticks as unmitigated affliction damage, and Behemoth cannot heal it back.
- **Mister Whiskers**: Black Cat's Crossing steals the Might it needs; Paw Swap turns Gore onto himself.
Also: **Father Bell**'s Hush shuts down a whole turn.

## Readability
"Cannot be healed" is one status line. Every ability is a single number.

## Deviations
Unhealable blocks only the `heal` class, matching OQ-04 (life transfer and HP-setting still work). New status `status.unhealable` (ADR-013).
