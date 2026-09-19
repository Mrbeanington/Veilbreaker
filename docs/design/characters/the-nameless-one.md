# The Nameless One (Final Legend)
**Data:** `the-nameless-one.ts` · LEGENDARY · CONTROLLER/ATTACKER · 170 HP

## Identity / win condition
Once per battle, when he would die, the turn is rewound (OQ-06, ADR-015). His passive **Not Yet Written** fires on the new `onWouldDie` event in the death-check tier, spends his single **Unwritten Turn** pip and requests the rewind. Everyone returns to how they were at the start of the turn (HP, energy, cooldowns, statuses, summons, resources, transformation stage, death flags); the RNG stream keeps moving so nothing re-rolls identically; nothing carries over except his spent charge; both players plan the turn again. Kit: Unwritten Strike 30, Absence (untargetable for a turn), Redact (silence), Fracture (25 to all).

## Balance levers
The rewind fires once, is spent even if the replayed turn kills him again, and gives his opponents full information about the turn. 170 HP and a modest kit.

## Counterplay — concrete counters from the roster
- **Shiro**: Final Stroke erases, and erasure bypasses death triggers, so the rewind never fires (tested).
- **Mister Whiskers**: energy theft starves the Chaos that Redact and Fracture need.
- **Spend it, then finish him**: any lethal turn burns the charge (a decoy lethal threat is enough), after which he is an ordinary 170 HP body.
- Death Prevention resolves first and leaves him at 1 HP with the charge intact, so stacking protections on him is worse for him than it looks.

## Readability
One visible pip. The log says exactly when the turn is unwritten.

## Deviations
The event log is append-only across a rewind (players saw those events), which differs from spec/07's wording about restoring the log. Locked/unlocked art is specified in the art spec (secret silhouette with one white fracture; the unlocked reveal never resolves fully). Unlocking is Phase 09+.
