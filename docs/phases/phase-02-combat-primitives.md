# Phase 02 — Combat primitives
**Read first:** spec/01 (damage language), spec/02 (status system, healing classes)

## Deliverables
- Effect handlers: damage (normal/piercing/affliction), heal (with healing classes per OQ-04), shield, damage reduction, invulnerable, untargetable, stun, silence, cooldown set/modify, energy gain/steal/remove, DoT, HoT.
- Status engine: apply, stack (per stack rules and max stacks), tick timing, expiry, dispel, and hidden flag. Implement the **full initial status library** from spec/02 as data definitions; statuses whose behavior needs later systems (Infection, Soul Consecration, Death Prevention) get stubs marked TODO(phase-03).
- The damage pipeline as a documented ordered chain: invulnerable → reflect/counter → amplification/weakness → damage reduction → shield → HP.
- TargetRule evaluation: self, ally, enemy, all enemies, random enemy, lowest HP, taunt override, untargetable filtering.
- Cooldowns, including the cooldown-reduction tier.
- Death checks (HP ≤ 0 → dead), simultaneous death, and the win/draw condition (OQ-09).

## Acceptance criteria
Unit tests for every effect and status, the damage-pipeline order, shields versus DR interaction, stun preventing action, silence, taunt, cooldowns, simultaneous death, and draw.

Finish with the end-of-phase report.
