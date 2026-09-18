// packages/engine: the pure, deterministic battle engine (CLAUDE.md rule 4).
// Phase 00 is scaffolding only — resolution logic is explicitly out of scope
// (docs/phases/phase-00-architecture.md "Out of scope") and lands in Phase
// 01. This package re-exports the runtime types the resolver will operate
// on, whose canonical schemas live in @veilbreak/content (CLAUDE.md:
// "packages/content — ...plus zod schemas... bundled into the build").
export type {
  BattleEvent,
  BattleState,
  BattleTeam,
  PlayerAction,
} from "@veilbreak/content";
