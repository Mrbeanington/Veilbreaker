// packages/engine: the pure, deterministic battle engine (CLAUDE.md rule 4).
// Canonical schemas for the types below live in @veilbreak/content
// (CLAUDE.md: "packages/content — ...plus zod schemas... bundled into the
// build"); this package implements the behavior that operates on them.
export type {
  BattleEvent,
  BattleState,
  BattleTeam,
  CharacterRuntimeState,
  PlayerAction,
} from "@veilbreak/content";

export {
  createRng,
  nextFloat,
  nextUint32,
  pickRandom,
  pickWeighted,
  rollDie,
  type RngState,
  type Weighted,
} from "./rng";

export {
  canAfford,
  createEmptyPool,
  ENERGY_FAMILIES,
  generateEnergy,
  payCost,
  type EnergyPool,
} from "./energy";

export { validateAction, type ActionValidationError } from "./actions";

export { applyEffect, type AppliedEvent, type EffectContext, type EffectResult } from "./effects";

export {
  COOLDOWN_REDUCTION_TIER_ID,
  createBattle,
  DEATH_CHECK_TIER_ID,
  RESOURCE_GENERATION_TIER_ID,
  resolveTurn,
  STANDARD_RESOLUTION_TIER_ID,
  type CreateBattleConfig,
  type CreateBattleTeamInput,
  type ResolveTurnDeps,
  type ResolveTurnResult,
} from "./resolver";
