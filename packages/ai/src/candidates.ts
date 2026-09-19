import type { Ability } from "@veilbreak/content";
import { getEffectiveCost, payCost, validateAction, type BattleState, type EnergyPool, type PlayerAction } from "@veilbreak/engine";

export interface Candidate {
  action: PlayerAction;
  ability: Ability;
}

/** Every legal (ability, target) pair for one character right now. Single-scope abilities need an explicit target guess; other scopes resolve their own. */
export function legalCandidates(
  state: BattleState,
  playerId: string,
  characterId: string,
  abilities: Record<string, Ability>,
): Candidate[] {
  const character = state.characters[characterId];
  if (!character?.alive) return [];
  const everyCharacterId = state.teams.flatMap((team) => team.characterIds);
  const candidates: Candidate[] = [];
  for (const abilityId of character.abilityIds) {
    const ability = abilities[abilityId];
    if (!ability) continue;
    const guesses: string[][] = ability.target.scope === "single" ? everyCharacterId.map((id) => [id]) : [[]];
    for (const targetIds of guesses) {
      const action: PlayerAction = { playerId, characterId, abilityId, targetIds };
      if (validateAction(state, action, abilities).length === 0) candidates.push({ action, ability });
    }
  }
  return candidates;
}

/** The team shares one energy pool, and resolveTurn pays every cost up front, so a plan must be affordable as a whole, not just action by action. */
export function tryPay(state: BattleState, playerId: string, pool: EnergyPool, c: Candidate): EnergyPool | null {
  const actor = state.characters[c.action.characterId];
  if (!actor) return null;
  return payCost(pool, getEffectiveCost(c.ability, actor));
}

export function teamCharacterIds(state: BattleState, playerId: string): string[] {
  return state.teams.find((t) => t.playerId === playerId)?.characterIds ?? [];
}

export function enemyPlayerId(state: BattleState, playerId: string): string {
  return state.teams.find((t) => t.playerId !== playerId)?.playerId ?? playerId;
}
