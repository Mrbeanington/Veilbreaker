# Phase 03 — Advanced systems
**Read first:** spec/02 (all), spec/01 (randomness, Cheaters)

## Deliverables
- **Triggers and Conditions:** onDamaged, onDealDamage, onDeath (any/ally/enemy), onKill, onTurnStart/End, onAbilityUsed (including sequence tracking), onHpThreshold, onStatusApplied, onResourceReached. Conditions: tags, HP, resource value, status presence, last-turn history, team/enemy composition. Add a recursion guard.
- **Custom Resources:** generic named counters with min/max, display hint, and optional "track" mode (for bases, tails, tide, souls, fouls, feedback, song stage).
- **Transformation engine:** trigger → swap definition layer (name, portrait key, HP/max HP rule, abilities, passive, tags, costs, cooldowns, sound/animation keys), preserving identity and statuses per rules.
- **Summons:** attached, temporary fourth unit, absorption counter, totem/relic. Summons get their own targeting and death rules.
- **Death extensions:** death prevention (floor at 1 HP), erasure (bypasses death triggers), resurrection, resurrection lock, consecration flags, soul-eligible deaths, corpse-ability registry.
- **State snapshot and restore** (the foundation for rewind; see OQ-06).
- **RNG manipulation:** force outcome, guarantee min/max, reroll, and weight modification, all implemented as modifiers on RandomOutcome.
- **Cheater hooks:** action-queue modifiers (retarget per OQ-07, cost change, ability lock, repeat detection).

## Acceptance criteria
Tests for: each trigger type, a transformation changing abilities and HP, a summon absorbing damage, death prevention, erasure skipping onDeath, resurrection plus resurrection lock, snapshot/restore round-trip equality (deep-equal over *all* fields), each RNG manipulation, retargeting, ability lock, and the recursion guard.

Finish with the end-of-phase report.
