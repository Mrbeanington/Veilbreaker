import { describe, expect, it } from "vitest";
import { ABILITY_LIBRARY, SHELL_BASH, TORTUGA_REX } from "@veilbreak/content";
import { createBattle, type CreateBattleTeamInput } from "@veilbreak/engine";
import { decideSimpleBotActions } from "./simple-bot";

const TEAM_A: CreateBattleTeamInput = {
  playerId: "playerA",
  characters: [{ characterId: "tortuga-rex", maxHp: TORTUGA_REX.baseHp, abilityIds: TORTUGA_REX.abilityIds }],
};
const TEAM_B: CreateBattleTeamInput = {
  playerId: "playerB",
  characters: [{ characterId: "dummy", maxHp: 100, abilityIds: [SHELL_BASH.id] }],
};

function freshState(seed = 1) {
  return createBattle([TEAM_A, TEAM_B], seed, {
    balanceVersionId: "test",
    matchFormat: { teamSize: 1, maxTurns: 40 },
    energyRules: { generation: { perLivingCharacter: 5, mode: "fixed" }, poolCap: 20, carryover: true, initiativePlayerSkipsTurnOneGeneration: false },
  });
}

describe("decideSimpleBotActions", () => {
  it("returns one legal action per living character on the bot's team", () => {
    const state = freshState();
    const actions = decideSimpleBotActions(state, "playerB", ABILITY_LIBRARY);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.characterId).toBe("dummy");
    expect(actions[0]?.playerId).toBe("playerB");
  });

  it("never proposes an action for a dead character", () => {
    const state = freshState();
    const dead = { ...state, characters: { ...state.characters, dummy: { ...state.characters.dummy!, alive: false, currentHp: 0 } } };
    const actions = decideSimpleBotActions(dead, "playerB", ABILITY_LIBRARY);
    expect(actions).toHaveLength(0);
  });

  it("prefers a lethal-looking option when one exists", () => {
    const state = freshState();
    // A 999-HP-costing... rather, set the bot's own target (tortuga) to 1 HP so Shell Bash (30 damage) looks lethal.
    const lowHp = { ...state, characters: { ...state.characters, "tortuga-rex": { ...state.characters["tortuga-rex"]!, currentHp: 1 } } };
    const actions = decideSimpleBotActions(lowHp, "playerB", ABILITY_LIBRARY);
    expect(actions[0]?.abilityId).toBe(SHELL_BASH.id);
    expect(actions[0]?.targetIds).toEqual(["tortuga-rex"]);
  });

  it("returns no actions for an unknown player", () => {
    const state = freshState();
    expect(decideSimpleBotActions(state, "nope", ABILITY_LIBRARY)).toEqual([]);
  });
});
