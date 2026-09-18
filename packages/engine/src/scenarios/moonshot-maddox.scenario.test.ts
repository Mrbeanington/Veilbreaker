import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  BASES_RESOURCE,
  DOUBLE_DOWN_THE_LINE,
  HOME_RUN_SWING,
  HUSTLE,
  LEADOFF_SINGLE,
  MOONSHOT_MADDOX,
  MOONSHOT_MADDOX_INITIAL_RESOURCES,
  STRIKES_RESOURCE,
  type Ability,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { act, expectOk, freshScenarioBattle, scenarioDeps, scenarioResourceLibrary } from "./scenario-support";

// phase-04-first-five.md required mechanic: "Moonshot: base track, Strikes,
// Home Run payoff." docs/design/characters/moonshot-maddox.md.

// spec/03 "Opponents can inflict STRIKES" — no opposing pitcher character
// exists yet (Phase 06+), so a minimal test-fixture ability stands in, the
// same convention phase-04-first-five.md itself uses for Father Bell.
function fixtureAbility(input: Partial<Ability> & Pick<Ability, "id" | "effects">): Ability {
  return abilitySchema.parse({
    displayName: input.id,
    description: "test fixture",
    cost: {},
    target: { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] },
    ...input,
  });
}

const pitchStrike = fixtureAbility({
  id: "test.pitch-strike",
  effects: [{ kind: "modifyResource", resourceId: STRIKES_RESOURCE.id, amount: 1 }],
});

const TEAM_A: CreateBattleTeamInput = {
  playerId: "playerA",
  characters: [
    {
      characterId: "moonshot-maddox",
      maxHp: MOONSHOT_MADDOX.baseHp,
      abilityIds: MOONSHOT_MADDOX.abilityIds,
      passiveId: MOONSHOT_MADDOX.passiveId,
      resources: MOONSHOT_MADDOX_INITIAL_RESOURCES,
    },
  ],
};
const TEAM_B: CreateBattleTeamInput = { playerId: "playerB", characters: [{ characterId: "pitcher", maxHp: 200, abilityIds: [pitchStrike.id] }] };

function deps() {
  const base = scenarioDeps(scenarioResourceLibrary([BASES_RESOURCE, STRIKES_RESOURCE]));
  return { ...base, abilities: { ...base.abilities, [pitchStrike.id]: pitchStrike } };
}

describe("Moonshot Maddox — the base track advances per ability, and Home Run pays off", () => {
  it("Leadoff Single and Double Down the Line advance the expected number of bases", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    state = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", LEADOFF_SINGLE.id, ["pitcher"])], [], deps())).state;
    expect(state.characters["moonshot-maddox"]?.resources[BASES_RESOURCE.id]).toBe(1);

    state = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", DOUBLE_DOWN_THE_LINE.id, ["pitcher"])], [], deps())).state;
    expect(state.characters["moonshot-maddox"]?.resources[BASES_RESOURCE.id]).toBe(3);
  });

  it("Home Run Swing whiffs weakly with bases not loaded, and pays off big once they are", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    const weakSwing = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", HOME_RUN_SWING.id, ["pitcher"])], [], deps()));
    expect(weakSwing.state.characters.pitcher?.currentHp).toBe(190); // 200 - 10, the fallback

    state = weakSwing.state;
    // Load the bases: Double (2) + Leadoff Single (1) + Hustle (1) = 4.
    state = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", DOUBLE_DOWN_THE_LINE.id, ["pitcher"])], [], deps())).state;
    state = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", LEADOFF_SINGLE.id, ["pitcher"])], [], deps())).state;
    state = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", HUSTLE.id, ["moonshot-maddox"])], [], deps())).state;
    expect(state.characters["moonshot-maddox"]?.resources[BASES_RESOURCE.id]).toBe(4);

    const beforeHomeRun = state.characters.pitcher?.currentHp ?? 0;
    const homeRun = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", HOME_RUN_SWING.id, ["pitcher"])], [], deps()));
    expect(homeRun.state.characters.pitcher?.currentHp).toBe(beforeHomeRun - 60); // the real payoff, not the 10-damage whiff
    expect(homeRun.state.characters["moonshot-maddox"]?.resources[BASES_RESOURCE.id]).toBe(0); // reset after a real home run
  });

  it("three Strikes disrupt his advancement: bases reset and he's stunned", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    state = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", DOUBLE_DOWN_THE_LINE.id, ["pitcher"])], [], deps())).state;
    expect(state.characters["moonshot-maddox"]?.resources[BASES_RESOURCE.id]).toBe(2);

    // The opponent inflicts 3 strikes over 3 turns Moonshot doesn't act.
    for (let i = 0; i < 3; i++) {
      state = expectOk(resolveTurn(state, [], [act("playerB", "pitcher", pitchStrike.id, ["moonshot-maddox"])], deps())).state;
    }
    expect(state.characters["moonshot-maddox"]?.resources[STRIKES_RESOURCE.id]).toBe(3);
    expect(state.characters["moonshot-maddox"]?.resources[BASES_RESOURCE.id]).toBe(2); // not yet disrupted — he hasn't acted

    // His next action is the strikeout check firing first, before that action's own base-advance.
    const strikeoutTurn = expectOk(resolveTurn(state, [act("playerA", "moonshot-maddox", LEADOFF_SINGLE.id, ["pitcher"])], [], deps()));
    const moonshot = strikeoutTurn.state.characters["moonshot-maddox"];
    expect(moonshot?.resources[BASES_RESOURCE.id]).toBe(0);
    expect(moonshot?.resources[STRIKES_RESOURCE.id]).toBe(0);
    expect(moonshot?.statuses.some((s) => s.statusId === "status.stun")).toBe(true);
  });
});
