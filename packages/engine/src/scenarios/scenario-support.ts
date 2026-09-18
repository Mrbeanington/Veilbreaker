import {
  ABILITY_LIBRARY,
  defaultMatchFormat,
  defaultResolutionOrder,
  PASSIVE_LIBRARY,
  STATUS_LIBRARY,
  SUMMON_LIBRARY,
  TRANSFORMATION_LIBRARY,
  type EnergyRules,
  type MatchFormat,
  type Resource,
} from "@veilbreak/content";
import { createBattle, type CreateBattleConfig, type CreateBattleTeamInput, type ResolveTurnDeps, type ResolveTurnResult } from "../resolver";
import type { BattleState, PlayerAction } from "@veilbreak/content";

// phase-04-first-five.md "Each signature mechanic has scenario tests
// (scripted multi-turn battles)" — every scenario test drives the exact same
// createBattle/resolveTurn the real game will, using the real content
// libraries (never a hand-rolled subset), so a scenario test failing means
// the shipped character kit is actually broken, not a test fixture drifting
// from it.

// "fixed" generation grants every family the same deterministic amount each
// turn (no RNG draw — see energy.ts) so a scenario doesn't have to account
// for which family a random roll happened to land in. The rate is generous
// enough that every ability cost in this phase's five kits is affordable
// within a turn or two of saving, matching how these characters were
// actually designed (docs/design/characters/*.md).
export const SCENARIO_ENERGY_RULES: EnergyRules = {
  generation: { perLivingCharacter: 4, mode: "fixed" },
  poolCap: 20,
  carryover: true,
  initiativePlayerSkipsTurnOneGeneration: false,
};

export function scenarioResourceLibrary(resources: Resource[]): Record<string, Resource> {
  return Object.fromEntries(resources.map((r) => [r.id, r]));
}

export function scenarioDeps(resourceLibrary: Record<string, Resource> = {}): ResolveTurnDeps {
  return {
    abilities: ABILITY_LIBRARY,
    resolutionOrder: defaultResolutionOrder,
    energyRules: SCENARIO_ENERGY_RULES,
    statusLibrary: STATUS_LIBRARY,
    passives: PASSIVE_LIBRARY,
    summonLibrary: SUMMON_LIBRARY,
    transformationLibrary: TRANSFORMATION_LIBRARY,
    resourceLibrary,
  };
}

export function freshScenarioBattle(
  teamA: CreateBattleTeamInput,
  teamB: CreateBattleTeamInput,
  seed = 1,
  matchFormat: MatchFormat = defaultMatchFormat,
  configOverrides: Partial<CreateBattleConfig> = {},
): BattleState {
  return createBattle([teamA, teamB], seed, {
    balanceVersionId: "test-balance-v1",
    matchFormat,
    energyRules: SCENARIO_ENERGY_RULES,
    ...configOverrides,
  });
}

/** Unwraps a ResolveTurnResult, failing the test immediately with the validation errors if the turn was illegal. */
export function expectOk(result: ResolveTurnResult): Extract<ResolveTurnResult, { ok: true }> {
  if (!result.ok) {
    throw new Error(`expected a legal turn, got validation errors: ${JSON.stringify(result.errors)}`);
  }
  return result;
}

export function act(playerId: string, characterId: string, abilityId: string, targetIds: string[] = []): PlayerAction {
  return { playerId, characterId, abilityId, targetIds };
}
