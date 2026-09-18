// packages/engine: the pure, deterministic battle engine (CLAUDE.md rule 4).
// Canonical schemas for the types below live in @veilbreak/content
// (CLAUDE.md: "packages/content — ...plus zod schemas... bundled into the
// build"); this package implements the behavior that operates on them.
export type {
  ActiveStatus,
  BattleEvent,
  BattleState,
  BattleTeam,
  CharacterRuntimeState,
  PlayerAction,
  SummonRuntimeState,
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
  richestFamily,
  type EnergyPool,
} from "./energy";

export type { AppliedEvent } from "./types";

export {
  canAct,
  computeTicks,
  decrementStatusDurations,
  dispelCharacter,
  getActiveStatus,
  getEffectiveMagnitude,
  hasStatus,
  removeStatusFromCharacter,
  setStatusMagnitude,
  applyStatusToCharacter,
  type ApplyStatusParams,
} from "./statuses";

export { resolveDamage, resolveHeal, type CharacterMapResult, type DamageResolution } from "./damage";

export { resolveTargets, type ResolveTargetsResult } from "./targeting";

export { evaluateCondition, type ConditionContext, type ConditionState } from "./conditions";

export { snapshotBattleState, restoreFromSnapshot, type BattleStateSnapshot } from "./snapshot";

export {
  consumeRngModifier,
  queueRngModifier,
  selectRandomOutcomeBranch,
} from "./rng-modifiers";

export {
  createSummonRuntimeState,
  decrementSummonDurations,
  findAbsorbingSummon,
  nextSummonInstanceId,
} from "./summons";

export { applyTransformation } from "./transformations";

export {
  deriveGameEvents,
  evaluateEvent,
  type GameEvent,
  type TriggerDeps,
  type TriggerResult,
} from "./triggers";

export { getEffectiveCost, validateAction, type ActionValidationError } from "./actions";

export {
  applyEffect,
  type EffectContext,
  type EffectResult,
  type EffectState,
  type QueuedRetarget,
} from "./effects";

export {
  COOLDOWN_REDUCTION_TIER_ID,
  createBattle,
  DAMAGE_OVER_TIME_TIER_ID,
  DEATH_CHECK_TIER_ID,
  HEALING_OVER_TIME_TIER_ID,
  POST_TURN_EFFECTS_TIER_ID,
  RESOURCE_GENERATION_TIER_ID,
  resolveTurn,
  STANDARD_RESOLUTION_TIER_ID,
  type CreateBattleCharacterInput,
  type CreateBattleConfig,
  type CreateBattleTeamInput,
  type ResolveTurnDeps,
  type ResolveTurnResult,
} from "./resolver";
