import { describe, expect, it } from "vitest";
import { FORTRESS_SHELL, SHELLQUAKE, TORTUGA_REX } from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-04-first-five.md required mechanic: "Tortuga: Shellquake conditional
// on prior defensive setup." docs/design/characters/tortuga-rex.md.

const TEAM_A: CreateBattleTeamInput = {
  playerId: "playerA",
  characters: [{ characterId: "tortuga-rex", maxHp: TORTUGA_REX.baseHp, abilityIds: TORTUGA_REX.abilityIds }],
};
const TEAM_B: CreateBattleTeamInput = {
  playerId: "playerB",
  characters: [{ characterId: "dummy", maxHp: 200 }],
};

describe("Tortuga Rex — Shellquake's conditional setup", () => {
  it("deals only its weak fallback damage with no prior defensive setup", () => {
    const state = freshScenarioBattle(TEAM_A, TEAM_B);
    const result = expectOk(
      resolveTurn(state, [act("playerA", "tortuga-rex", SHELLQUAKE.id, ["dummy"])], [], scenarioDeps()),
    );
    expect(result.state.characters.dummy?.currentHp).toBe(190); // 200 - 10
  });

  it("deals its full damage once Fortress Shell has been used", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    const setupTurn = expectOk(
      resolveTurn(state, [act("playerA", "tortuga-rex", FORTRESS_SHELL.id, ["tortuga-rex"])], [], scenarioDeps()),
    );
    state = setupTurn.state;
    expect(state.characters["tortuga-rex"]?.statuses.some((s) => s.statusId === "status.damage-reduction")).toBe(true);

    const shellquakeTurn = expectOk(
      resolveTurn(state, [act("playerA", "tortuga-rex", SHELLQUAKE.id, ["dummy"])], [], scenarioDeps()),
    );
    expect(shellquakeTurn.state.characters.dummy?.currentHp).toBe(160); // 200 - 40
  });
});
