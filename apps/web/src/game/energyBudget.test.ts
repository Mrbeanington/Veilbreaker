import { describe, expect, it } from "vitest";
import { ABILITY_LIBRARY, defaultEnergyRules, type EnergyRules } from "@veilbreak/content";
import { canAfford, getEffectiveCost } from "@veilbreak/engine";
import { remainingPool } from "./energyBudget";
import { startMatch } from "./setup";

const FIXED: EnergyRules = { ...defaultEnergyRules, generation: { perLivingCharacter: 1, minPerTeam: 0, mode: "fixed" }, initiativePlayerSkipsTurnOneGeneration: false };

describe("team energy budget (regression: queued actions could exceed the shared pool)", () => {
  it("subtracts every other queued action, so the last character cannot overspend", () => {
    const state = startMatch(["tortuga-rex", "hydra", "malachar"], ["shiro", "koschei", "father-bell"], 1, FIXED);
    const pool = state.energyPools.playerA!;
    const costly = ABILITY_LIBRARY["ability.tortuga-rex.shell-bash"]!;
    const queued = ["tortuga-rex", "hydra"].map((characterId) => ({ playerId: "playerA", characterId, abilityId: costly.id, targetIds: [] as string[] }));
    const left = remainingPool(state, "playerA", queued, ABILITY_LIBRARY)!;
    const spent = Object.keys(pool).reduce((n, k) => n + (pool[k as keyof typeof pool] - left[k as keyof typeof left]), 0);
    expect(spent).toBeGreaterThan(0);
    // What is left can afford strictly less than the full pool could.
    expect(canAfford(pool, getEffectiveCost(costly, state.characters.malachar!))).toBe(true);
    expect(left).not.toEqual(pool);
  });

  it("excluding a character refunds its own queued action (re-queueing replaces it)", () => {
    const state = startMatch(["tortuga-rex", "hydra", "malachar"], ["shiro", "koschei", "father-bell"], 1, FIXED);
    const bash = ABILITY_LIBRARY["ability.tortuga-rex.shell-bash"]!;
    const queued = [{ playerId: "playerA", characterId: "tortuga-rex", abilityId: bash.id, targetIds: [] as string[] }];
    expect(remainingPool(state, "playerA", queued, ABILITY_LIBRARY, "tortuga-rex")).toEqual(state.energyPools.playerA);
  });
});
