# The Tax Collector
**Data:** `the-tax-collector.ts` · RARE · FOLKLORE/CONTROLLER/ASSASSIN · 110 HP

## Identity / win condition
An extremely irritating control character who steals unused resources. **Levy**: at the end of the turn of any enemy under Audit, 1 of the enemy team's richest energy is taken and given to him. **Seize Assets** takes 2 more; **Audit** is 20 and makes everything cost the enemy more for 2 turns; **Lien** locks the enemy's Focus for 2 turns; Red Tape gives Damage Reduction 20.

## Counterplay
The Levy is one energy per audited turn and needs an Audit on the target first, so a team that spends what it earns barely notices it: it punishes hoarding. Seize Assets is a 3-turn cooldown on Chaos, and a dispel removes the cost rise and the lien. He does little direct damage (20) and has 110 HP, so a team that ignores the taxes and kills him wins.

## Readability
Every effect names the energy it takes.

## Deviations
Distinct from **Jiangshi** (a 1-energy thief on an ability) and **The Collector** (Spirit only): the Levy is a passive that fires on an audited enemy's turn end. It was 75% in the first simulation when it fired on every enemy turn end. Tested in `packages/engine/src/scenarios/region11.scenario.test.ts`.
