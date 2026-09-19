import {
  ABILITY_LOCK,
  ENERGY_COST_INCREASE,
  ENERGY_LOCK,
  type Ability,
  type BattleState,
  type CharacterRuntimeState,
  type Cost,
  type EnergyFamily,
  type PlayerAction,
} from "@veilbreak/content";
import { canAfford } from "./energy";
import { canAct, getActiveStatus, getEffectiveMagnitude } from "./statuses";
import { resolveTargets } from "./targeting";
import { createRng } from "./rng";

// spec: "an illegal action is rejected during planning, never silently
// dropped mid-resolution" — resolveTurn (resolver.ts) validates every
// submitted action with this before any effect resolves.
export type ActionValidationError =
  | { code: "unknownCharacter"; characterId: string }
  | { code: "characterNotAlive"; characterId: string }
  | { code: "characterCannotAct"; characterId: string }
  | { code: "characterNotOnPlayersTeam"; characterId: string; playerId: string }
  | { code: "unknownAbility"; abilityId: string }
  | { code: "abilityNotKnown"; characterId: string; abilityId: string }
  | { code: "abilityLocked"; characterId: string; abilityId: string }
  | { code: "abilityOnCooldown"; characterId: string; abilityId: string; turnsRemaining: number }
  | { code: "energyFamilyLocked"; characterId: string; abilityId: string; family: EnergyFamily }
  | { code: "cannotAfford"; characterId: string; abilityId: string }
  | { code: "invalidTarget"; reason: string };

function isEnergyFamily(value: string): value is EnergyFamily {
  return value === "MIGHT" || value === "FOCUS" || value === "SPIRIT" || value === "CHAOS";
}

function costRequiresFamily(cost: Cost, family: EnergyFamily): boolean {
  switch (family) {
    case "MIGHT":
      return cost.might > 0;
    case "FOCUS":
      return cost.focus > 0;
    case "SPIRIT":
      return cost.spirit > 0;
    case "CHAOS":
      return cost.chaos > 0;
  }
}

/** spec/01 Cheaters "change ability costs": Energy Cost Increase adds its effective magnitude onto the NEUTRAL component, the one component any family can pay — a flat surcharge regardless of the ability's own cost mix. */
export function getEffectiveCost(ability: Ability, actor: CharacterRuntimeState): Cost {
  const increase = getEffectiveMagnitude(actor, ENERGY_COST_INCREASE.id);
  return increase <= 0 ? ability.cost : { ...ability.cost, neutral: ability.cost.neutral + increase };
}

export function validateAction(
  state: BattleState,
  action: PlayerAction,
  abilities: Record<string, Ability>,
): ActionValidationError[] {
  const errors: ActionValidationError[] = [];

  const actor = state.characters[action.characterId];
  if (!actor) {
    return [{ code: "unknownCharacter", characterId: action.characterId }];
  }
  if (!actor.alive) {
    errors.push({ code: "characterNotAlive", characterId: action.characterId });
  } else if (!canAct(actor)) {
    // spec/02 Stun/Silence: "Cannot take any action." Only checked once
    // known alive — a dead character is already covered above.
    errors.push({ code: "characterCannotAct", characterId: action.characterId });
  }

  const actingTeam = state.teams.find((team) => team.playerId === action.playerId);
  if (!actingTeam || !actingTeam.characterIds.includes(action.characterId)) {
    errors.push({
      code: "characterNotOnPlayersTeam",
      characterId: action.characterId,
      playerId: action.playerId,
    });
  }

  const ability = abilities[action.abilityId];
  if (!ability) {
    errors.push({ code: "unknownAbility", abilityId: action.abilityId });
    return errors;
  }

  // A character can only use abilities in its own kit (which a transformation
  // may change). Without this a peer in a friend match could use anyone's ability.
  if (!actor.abilityIds.includes(action.abilityId)) {
    errors.push({ code: "abilityNotKnown", characterId: action.characterId, abilityId: action.abilityId });
  }

  // spec/01 Cheaters "lock an ability": Ability Lock's `param` names the
  // specific abilityId it blocks (see ActiveStatus.param, OQ-29's resolution
  // this phase) — every other ability stays usable.
  const abilityLock = getActiveStatus(actor, ABILITY_LOCK.id);
  if (abilityLock?.param === action.abilityId) {
    errors.push({ code: "abilityLocked", characterId: action.characterId, abilityId: action.abilityId });
  }

  const cooldownRemaining = actor.cooldowns[action.abilityId] ?? 0;
  if (cooldownRemaining > 0) {
    errors.push({
      code: "abilityOnCooldown",
      characterId: action.characterId,
      abilityId: action.abilityId,
      turnsRemaining: cooldownRemaining,
    });
  }

  const effectiveCost = getEffectiveCost(ability, actor);

  // spec/01 Cheaters "steal energy" / Energy Lock: blocks casting any
  // ability that needs the locked family, even though the pool itself is
  // shared per-player — the lock targets the character, not the pool.
  const energyLock = getActiveStatus(actor, ENERGY_LOCK.id);
  if (energyLock?.param && isEnergyFamily(energyLock.param) && costRequiresFamily(effectiveCost, energyLock.param)) {
    errors.push({
      code: "energyFamilyLocked",
      characterId: action.characterId,
      abilityId: action.abilityId,
      family: energyLock.param,
    });
  }

  const pool = state.energyPools[action.playerId];
  if (!pool || !canAfford(pool, effectiveCost)) {
    errors.push({ code: "cannotAfford", characterId: action.characterId, abilityId: action.abilityId });
  }

  // resolveTargets is the single source of truth for target legality
  // (taunt overrides, untargetable filtering, side/scope rules) — reused
  // here rather than re-implemented, so validation can never approve a
  // target combination execution would then refuse. Validation only cares
  // whether a legal selection exists, not which random pick it would make,
  // so a throwaway RNG state is fine: nothing derived from it is kept.
  const targetResult = resolveTargets(state, ability, action.characterId, action.targetIds, createRng(0));
  if (targetResult.error) {
    errors.push({ code: "invalidTarget", reason: targetResult.error });
  }

  return errors;
}
