# Calypsa, Queen Beneath the Sea (Legend)
**Data:** `calypsa.ts` · LEGENDARY · LEGENDARY/FOLKLORE/MYTHOLOGY/MAGE/CONTROLLER · 150 HP

## Identity / win condition
The Tide rises. **Rising Tide**: at the end of each of her turns she gains a Tide (max 6). Undertow is 20; Call the Tide gives 2 more; **Tidal Wave** is 20 to every enemy, or **50 with 3 Tide**, which it spends; **Maelstrom** is **90 to every enemy and a stun with 6 Tide**, which it spends (otherwise only 10).

## Balance levers (spec/03)
A setup requirement: six Tide is six turns of preparation, every one of them visible as a pip. Maelstrom costs Might 3 and Spirit 3 on a 5-turn cooldown, and only its Tide-fed version is a catastrophe. 150 HP and modest baseline damage (20). The Tide is her only real engine, so anything that stops her spending, or her acting, stalls it.

## Counterplay
The catastrophe is telegraphed and answerable:
- **Frost Jötunn**: Winter's Lock freezes her Might, so the Maelstrom (Might 3) cannot be cast (tested).
- **Father Bell**: Hush silences her (tested).
- **Mister Whiskers**-style energy theft starves the 6-energy Maelstrom.
- A team that kills her before six Tide never sees it, and spreading damage does not stop it: the Tide is gained by time, not wounds, so it must be bursted or denied.
Her 150 HP and small baseline mean she is not a threat in the meantime.

## Readability
The Tide pips are visible and both wave abilities print their thresholds.

## Deviations
Only a rising passive is modelled: the spec's flavour that wounds wash the Tide away needs a second passive (a character has one passive slot; OQ-102). She has a Legend trial (`trial.calypsa`, against her, Rusalka and Kappa Kiro). Tested in `packages/engine/src/scenarios/region11.scenario.test.ts`.
