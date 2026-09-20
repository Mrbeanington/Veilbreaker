# Fourth & One
**Data:** `fourth-and-one.ts` · RARE · ATHLETE/BRUISER/ATTACKER · 120 HP

## Identity / win condition
A running back who lives on the fourth down. **Down and Distance**: he gains a Down at the end of each of his turns (max 3). **Go For It** is 20, or **70 with 3 Downs**, which it spends. Shoulder Charge is 30; Stiff Arm is 20 and weakens; Huddle Up gives every ally Damage Reduction 20 for 2 turns.

## Counterplay
The big hit is visible three turns ahead (the Downs pips), costs Chaos as well as Might, and can be answered by a stun or by an enemy that simply out-trades him in the meantime. Damage Reduction and shields blunt the 70.

## Readability
The pips and both numbers are printed.

## Deviations
The Downs count up on a timer, not by using abilities (unlike The Scarab King's Swarm), so a stalled fight still charges him. Tested in `packages/engine/src/scenarios/region9.scenario.test.ts`.
