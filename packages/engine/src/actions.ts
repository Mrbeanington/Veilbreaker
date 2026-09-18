import type { Ability, BattleState, PlayerAction } from "@veilbreak/content";
import { canAfford } from "./energy";

// spec: "an illegal action is rejected during planning, never silently
// dropped mid-resolution" — resolveTurn (resolver.ts) validates every
// submitted action with this before any effect resolves. Target-rule
// checking here is deliberately a placeholder (phase-01-battle-core.md):
// it confirms a target exists, is alive, and matches the ability's
// ally/enemy/self side, but not richer scope rules like adjacency or
// lowest/highest-HP selection, which need real content to test against and
// belong to Phase 02.
export type ActionValidationError =
  | { code: "unknownCharacter"; characterId: string }
  | { code: "characterNotAlive"; characterId: string }
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

  errors.push(...validateTargets(state, action, ability));

  return errors;
}

function validateTargets(
  state: BattleState,
  action: PlayerAction,
  ability: Ability,
): ActionValidationError[] {
  const errors: ActionValidationError[] = [];

  if (ability.target.scope !== "single" || ability.target.side !== "self") {
    if (action.targetIds.length === 0) {
      errors.push({ code: "invalidTarget", reason: "ability requires at least one target" });
    }
  }

  for (const targetId of action.targetIds) {
    const target = state.characters[targetId];
    if (!target) {
      errors.push({ code: "invalidTarget", reason: `unknown target "${targetId}"` });
      continue;
    }
    if (!target.alive) {
      errors.push({ code: "invalidTarget", reason: `target "${targetId}" is not alive` });
    }

    if (ability.target.side === "self") {
      if (targetId !== action.characterId) {
        errors.push({ code: "invalidTarget", reason: "this ability can only target the caster" });
      }
      continue;
    }

    const targetTeam = state.teams.find((team) => team.characterIds.includes(targetId));
    const isAlly = targetTeam?.playerId === action.playerId;
    if (ability.target.side === "ally" && !isAlly) {
      errors.push({ code: "invalidTarget", reason: `target "${targetId}" is not an ally` });
    }
    if (ability.target.side === "enemy" && isAlly) {
      errors.push({ code: "invalidTarget", reason: `target "${targetId}" is not an enemy` });
    }
  }

  return errors;
}
