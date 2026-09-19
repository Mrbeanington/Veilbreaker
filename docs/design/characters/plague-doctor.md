# The Plague Doctor
**Data:** `plague-doctor.ts` · CORE · ANTI-HEALER/CONTROLLER · 100 HP

## Identity / win condition
The anti-healing specialist. Bitter Draught (Anti-Heal, 2 turns), Spoiled Tincture (Healing Reduction 10, 3 turns), Miasma Flask (team poison), Cull the Weak (40 vs. an Anti-Healed target, else 15).

## Counterplay
Anti-Heal only blocks the `heal` class (OQ-04): life transfer and HP-setting effects ignore it, and Healing Reduction never touches `setHp`. Short durations mean a healer can wait it out; he has only 100 HP.

## Counters and synergies
Countered by lifetransfer users (**Malachar**'s Borrowed Life) and by burst that kills him first. Synergy: **Behemoth** is already unhealable, but Plague Doctor makes Hydra's Regrow and Tortuga Rex's Ancient Patience matter less.

## Readability
Each ability is one status or one number; Cull the Weak's condition is a single visible status.

## Tests
Anti-Heal vs. each healing class and Healing Reduction vs. each class are asserted in `batch1.scenario.test.ts`.
