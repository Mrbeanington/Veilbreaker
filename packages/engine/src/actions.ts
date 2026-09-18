import type { Ability, BattleState, PlayerAction } from "@veilbreak/content";
import { canAfford } from "./energy";
import { canAct } from "./statuses";
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
  | { code: "abilityOnCooldown"; characterId: string; abilityId: string; turnsRemaining: number }
  | { code: "cannotAfford"; characterId: string; abilityId: string }
  | { code: "invalidTarget"; reason: string };

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

  const cooldownRemaining = actor.cooldowns[action.abilityId] ?? 0;
  if (cooldownRemaining > 0) {
    errors.push({
      code: "abilityOnCooldown",
      characterId: action.characterId,
      abilityId: action.abilityId,
      turnsRemaining: cooldownRemaining,
    });
  }

  const pool = state.energyPools[action.playerId];
  if (!pool || !canAfford(pool, ability.cost)) {
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
