# The Nine-Tailed Trickster
**Data:** `nine-tailed-trickster.ts` · RARE · FOLKLORE/MAGE/EVOLUTION · 100 → 150 HP

## Identity / win condition
Tails (1–9) grow with every hit she lands; the ninth triggers **Ascension**: 150 HP and Nine-Flame Nova (25 to all + Burn) replaces Fox Fire. Fox Fire (15 + Burn), Tail Lash (25), Mirror Illusion (untargetable), Confounding Trick (randomly stun or weaken).

## Counterplay
Tails are visible, so opponents can see Ascension coming; she is fragile (100 HP) until then. Mirror Illusion is a 3-turn cooldown. An AoE hit grows several tails at once (a deliberate reward for spreading damage).

## Interactions
Fox Fire is the first implemented **Burn** applier: it cauterizes **Hydra**'s Regrow (tested). Resolves OQ-41's gap.

## Deviations
Ascension is driven by her own passive, not `Transformation.trigger` (OQ-34), the same pattern as Patient Zero. Self-damage from DoT counts as "landing a hit" (the same quirk).
