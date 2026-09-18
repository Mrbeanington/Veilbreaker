# Phase 01 — Battle state, resolver, RNG, energy
**Read first:** spec/01 (turn system, energy, randomness), ARCHITECTURE.md

## Deliverables
- A seeded, serializable PRNG in battle state (e.g., a small PCG or xoshiro implementation) with weighted pick, roll, and pick-random helpers. No `Math.random` anywhere in the engine (enforced by a lint rule).
- `createBattle(teams, seed, balanceVersion, config)` → BattleState.
- Energy: generation driven by EnergyRules, cost payment including NEUTRAL (the payment solver picks the least-damaging assignment, and players may also specify an explicit payment), affordability checks, and caps.
- Action validation: legality, cost, cooldown, and target-rule placeholders.
- Centralized `resolveTurn(state, actionsA, actionsB)` that walks ResolutionOrder tiers and emits BattleEvents. Tiers are handler registries, not switch statements scattered around.
- Turn model config (OQ-01), initiative (OQ-02), timer-expiry handling (OQ-08), max-turn rule (OQ-14).

## Acceptance criteria
- Tests: determinism (same inputs give an identical event log), energy generation and payment (including NEUTRAL edge cases), illegal action rejection, and tier ordering read from config (reordering the config reorders events).
- Temporary test-only abilities (e.g., "deal 30") are defined in test fixtures, not hard-coded in the engine.

Finish with the end-of-phase report.
