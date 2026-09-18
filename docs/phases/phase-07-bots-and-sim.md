# Phase 07 — Bots and headless simulation
**Read first:** spec/06 (AI), spec/07 (balance simulation)

## Deliverables
- `packages/ai`: BEGINNER (random legal), INTERMEDIATE (heuristics: kills, energy, defense timing), ADVANCED (shallow lookahead using engine clones), EXPERT (deeper search or MCTS within a time budget, counter/synergy awareness). LEGEND BOSS is a framework only: PvE rule-bending hooks.
- Bots run in a Web Worker with a time budget. Search depth scales down on slow devices; the UI never blocks.
- A headless simulator that runs both as a Node dev CLI and in a browser Worker (shared code), for example the CLI `pnpm sim --matches 10000 --bots expert --seed 1`, producing a JSON and markdown report with character win rates, team win rates, initiative advantage, match length, Legend performance, and counter matrix.
- Degenerate-pattern detectors: turn-limit hits, repeated identical states (loops), perpetual stun, energy lockout, one-turn kills, resurrection/rewind loops.

## Acceptance criteria
10k matches over the 20 prototypes run without engine errors. A report is generated. Findings go in `docs/balance/report-<date>.md` as recommendations only; do not auto-change numbers.

Finish with the end-of-phase report.
