# Phase 11 — Local ranked
**Read first:** spec/06 (local ranked), OQ-05

## Deliverables
- A local ladder against tiered bots: hidden rating (Glicko-2 or Elo), visible divisions, placements, seasons, match history, streaks, usage stats, and personal bests.
- Bot opponents scale in skill and team quality by division and draw from meta-aware team pools built from Phase 07 simulation data.
- A Legend-access policy per OQ-05, and pick/ban against bots at high divisions.
- All state is persisted in IndexedDB and included in save export.

## Acceptance criteria
Tests for the rating math, promotion and demotion, placement flow, and season rollover.

Finish with the end-of-phase report.
