import {
  ABILITY_LIBRARY,
  CHARACTER_LIBRARY,
  PASSIVE_LIBRARY,
  RESOURCE_LIBRARY,
  STATUS_LIBRARY,
  SUMMON_LIBRARY,
  TRANSFORMATION_LIBRARY,
  defaultEnergyRules,
  defaultMatchFormat,
  defaultResolutionOrder,
  defaultResourcesFor,
} from "@veilbreak/content";
import type { EnergyRules } from "@veilbreak/content";
import { createBattle, type BattleState, type CreateBattleTeamInput, type ResolveTurnDeps } from "@veilbreak/engine";

// phase-05-local-playable.md acceptance criterion: "the UI never computes
// combat results itself." Every function here either builds inputs for the
// real engine (createBattle/resolveTurn) or reads its outputs — nothing in
// apps/web ever touches HP, statuses, or resources directly.

export const BALANCE_VERSION_ID = "phase-05-v1";

export function buildTeamInput(playerId: string, characterIds: readonly string[]): CreateBattleTeamInput {
  return {
    playerId,
    characters: characterIds.map((id) => {
      const definition = CHARACTER_LIBRARY[id];
      if (!definition) {
        throw new Error(`startMatch: unknown character "${id}" — is it in PICKABLE_CHARACTERS?`);
      }
      return {
        characterId: id,
        maxHp: definition.baseHp,
        abilityIds: definition.abilityIds,
        passiveId: definition.passiveId,
        tags: definition.tags,
        resources: defaultResourcesFor(definition),
      };
    }),
  };
}

export function startMatch(
  playerAIds: readonly string[],
  playerBIds: readonly string[],
  seed: number,
  energyRules: EnergyRules = defaultEnergyRules,
): BattleState {
  return createBattle([buildTeamInput("playerA", playerAIds), buildTeamInput("playerB", playerBIds)], seed, {
    balanceVersionId: BALANCE_VERSION_ID,
    matchFormat: defaultMatchFormat,
    energyRules,
  });
}

// `energyRules` defaults to the real spec/01 config; component tests pass a
// deterministic override (e.g. "fixed" mode) so an ability's affordability
// doesn't depend on the same random draw the match itself uses.
export function matchDeps(energyRules: EnergyRules = defaultEnergyRules): ResolveTurnDeps {
  return {
    abilities: ABILITY_LIBRARY,
    resolutionOrder: defaultResolutionOrder,
    energyRules,
    statusLibrary: STATUS_LIBRARY,
    passives: PASSIVE_LIBRARY,
    summonLibrary: SUMMON_LIBRARY,
    transformationLibrary: TRANSFORMATION_LIBRARY,
    resourceLibrary: RESOURCE_LIBRARY,
  };
}
