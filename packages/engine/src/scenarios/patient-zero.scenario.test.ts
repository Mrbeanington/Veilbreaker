import { describe, expect, it } from "vitest";
import { BITE, FESTERING_WOUND, OUTBREAK_PROGRESS_RESOURCE, PATIENT_ZERO, PATIENT_ZERO_INITIAL_RESOURCES } from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { act, expectOk, freshScenarioBattle, scenarioDeps, scenarioResourceLibrary } from "./scenario-support";

// phase-04-first-five.md required mechanic: "Patient Zero: Infection
// spreading → The Infected → The Outbreak." docs/design/characters/
// patient-zero.md.

const TEAM_A: CreateBattleTeamInput = {
  playerId: "playerA",
  characters: [
    {
      characterId: "patient-zero",
      maxHp: PATIENT_ZERO.baseHp,
      abilityIds: PATIENT_ZERO.abilityIds,
      passiveId: PATIENT_ZERO.passiveId,
      resources: PATIENT_ZERO_INITIAL_RESOURCES,
    },
  ],
};
const TEAM_B: CreateBattleTeamInput = { playerId: "playerB", characters: [{ characterId: "victim", maxHp: 500 }] };

function deps() {
  return scenarioDeps(scenarioResourceLibrary([OUTBREAK_PROGRESS_RESOURCE]));
}

describe("Patient Zero — Infection ticks and spreads, driving a dramatic evolution", () => {
  it("Bite applies a real, ticking Infection status", () => {
    const state = freshScenarioBattle(TEAM_A, TEAM_B);
    const result = expectOk(resolveTurn(state, [act("playerA", "patient-zero", BITE.id, ["victim"])], [], deps()));
    const victim = result.state.characters.victim;
    expect(victim?.statuses.some((s) => s.statusId === "status.infection")).toBe(true);
    // 500 - 15 direct damage - 5 (the DoT tier already runs later in this
    // same turn, magnitude(5) * stacks(1)).
    expect(victim?.currentHp).toBe(480);

    const nextTurn = expectOk(resolveTurn(result.state, [], [], deps()));
    // Ticks again for another 5 at the start of the following turn.
    expect(nextTurn.state.characters.victim?.currentHp).toBe(475);
  });

  it("evolves into The Infected after enough Outbreak Progress, then into The Outbreak", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    // Every landed hit is +1 Outbreak Progress (the-hunger-grows passive).
    // Four Bites clears the "at least 4" threshold for The Infected.
    for (let i = 0; i < 4; i++) {
      state = expectOk(resolveTurn(state, [act("playerA", "patient-zero", BITE.id, ["victim"])], [], deps())).state;
    }
    expect(state.characters["patient-zero"]?.resources[OUTBREAK_PROGRESS_RESOURCE.id]).toBeGreaterThanOrEqual(4);
    expect(state.characters["patient-zero"]?.maxHp).toBe(140); // The Infected's buffed HP
    expect(state.characters["patient-zero"]?.currentHp).toBe(140); // ratio-rescaled from a full-HP base form

    // Four more landed hits push past 8 total (Festering Wound has a 1-turn
    // cooldown, so it alternates with Bite rather than spamming one ability).
    for (let i = 0; i < 4; i++) {
      const abilityId = i % 2 === 0 ? FESTERING_WOUND.id : BITE.id;
      state = expectOk(resolveTurn(state, [act("playerA", "patient-zero", abilityId, ["victim"])], [], deps())).state;
    }
    expect(state.characters["patient-zero"]?.resources[OUTBREAK_PROGRESS_RESOURCE.id]).toBeGreaterThanOrEqual(8);
    expect(state.characters["patient-zero"]?.maxHp).toBe(180); // The Outbreak's buffed HP
    // The Outbreak's kit swaps Outbreak Pulse for the stronger Cataclysmic Spread.
    expect(state.characters["patient-zero"]?.abilityIds).toContain("ability.patient-zero.the-outbreak.cataclysmic-spread");
    expect(state.characters["patient-zero"]?.abilityIds).not.toContain("ability.patient-zero.outbreak-pulse");
  });
});
