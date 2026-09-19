# Icarion
**Data:** `icarion.ts` · SECRET · MYTHOLOGY/ATTACKER/SECRET · 90 HP

## Identity / win condition
**Altitude** (0-5) from Feather Volley (+1) and Soar (+2). **Wax Wing Dive** deals 20, 50 with two Altitude, or 90 with four at the cost of 30 of his own health (HP sacrifice) and spends what it uses. **Plummet** falls on every enemy for 20 (40 from three Altitude), hurts him for 10 and empties the Altitude. **Melting Wax**: at four Altitude or more he starts each turn burning.

## Counterplay
90 HP, and the big dive costs a third of it. Holding four Altitude means Burn every turn: greed is punished. **Cerberus**-style armour and any silence stop the climb. DISCOVERABLE secret, with a silhouette prompt.

## Readability
The height/price trade is on the ability text.

## Deviations
The self-damage is real: it fixed an engine gap where a damage effect's `target` override was ignored (phase 13 regression test). Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
