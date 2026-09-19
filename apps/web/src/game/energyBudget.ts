import type { Ability } from "@veilbreak/content";
import { getEffectiveCost, payCost, type BattleState, type EnergyPool, type PlayerAction } from "@veilbreak/engine";

/**
 * The whole team draws on ONE energy pool and resolveTurn pays every queued
 * cost up front, so what a character may still afford is the pool minus what
 * the OTHER queued actions already claim. Checking each action against the
 * full pool let a team queue more than it owned and crashed resolution.
 */
export function remainingPool(
  state: BattleState,
  playerId: string,
  queued: Iterable<PlayerAction>,
  abilities: Record<string, Ability>,
  excludeCharacterId?: string,
): EnergyPool | undefined {
  let pool = state.energyPools[playerId];
  if (!pool) return undefined;
  for (const action of queued) {
    if (action.characterId === excludeCharacterId) continue;
    const ability = abilities[action.abilityId];
    const actor = state.characters[action.characterId];
    if (!ability || !actor) continue;
    pool = payCost(pool, getEffectiveCost(ability, actor)) ?? pool;
  }
  return pool;
}
