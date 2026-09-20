# Johnny Feedback
**Data:** `johnny-feedback.ts` · RARE · MUSIC/ATTACKER/MAGE · 120 HP

## Identity / win condition
A supernatural punk guitarist. **Amp It Up**: every ability he uses adds a **Feedback** (max 5), and **at the maximum every ability also hurts him for 10**. Power Chord is 20, or 40 with 2 or more Feedback; Wall of Sound is 10 to every enemy, or 30 with 3 or more; **Cut the Amp** spends all Feedback and heals him 10; Crowd Surf makes him untargetable for a turn.

## Counterplay
The payoff needs three abilities in a row, the pips are visible, and staying loud costs blood at the cap (affliction damage, so nothing reduces it). A team that stuns or silences him breaks the build; Anti-Heal (**Plague Doctor**) turns off Cut the Amp's heal.

## Readability
The pips and both thresholds are printed.

## Deviations
The spec says high Feedback can hurt allies or himself; only himself is modelled (an effect cannot target the whole allied team for damage yet). Tested in `packages/engine/src/scenarios/region10.scenario.test.ts`.
