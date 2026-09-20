import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  BORROWED_LIFE,
  CORPSE_COMMAND,
  EMBRACE_THE_THRONE,
  MALACHAR,
  MALACHAR_INITIAL_RESOURCES,
  RAISE_THE_FORGOTTEN,
  SOULS_RESOURCE,
  YOU_BELONG_TO_ME,
  type Ability,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { applyEffect } from "../effects";
import { act, expectOk, freshScenarioBattle, scenarioDeps, scenarioResourceLibrary } from "./scenario-support";

// phase-04-first-five.md required mechanic: "Malachar: Souls, Thrall,
// Borrowed Life as lifeTransfer, Corpse Command, You Belong To Me, and the
// Death King transformation. Consecration must block souls, resurrection,
// thralls, and corpse use (tested with a minimal test-fixture Bell effect)."
// docs/design/characters/malachar.md.

// `side: "any"` + `includeSelf: true` so these fixtures can target self,
// an ally, or an enemy — the tests below need a teammate to kill a teammate
// (a death Malachar didn't cause) and a character to consecrate itself.
function fixtureAbility(input: Partial<Ability> & Pick<Ability, "id" | "effects">): Ability {
  return abilitySchema.parse({
    displayName: input.id,
    description: "test fixture",
    cost: {},
    target: { side: "any", scope: "single", count: 1, includeSelf: true, filterTags: [] },
    ...input,
  });
}

// Father Bell's own passive isn't built until his own phase — this stands in
// for it exactly as phase-04-first-five.md itself proposes: applying his
// effect (Soul Consecration) directly, rather than through a real character.
const bellsConsecration = fixtureAbility({
  id: "test.bells-consecration",
  effects: [{ kind: "applyStatus", statusId: "status.soul-consecration" }],
});

const lethalStrike = fixtureAbility({ id: "test.lethal-strike", effects: [{ kind: "damage", amount: 999 }] });

function team(overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}): CreateBattleTeamInput {
  return {
    playerId: "playerA",
    characters: [
      {
        characterId: "malachar",
        maxHp: MALACHAR.baseHp,
        abilityIds: MALACHAR.abilityIds,
        passiveId: MALACHAR.passiveId,
        resources: MALACHAR_INITIAL_RESOURCES,
        ...overrides,
      },
    ],
  };
}
const TEAM_A = team();
const TEAM_B: CreateBattleTeamInput = {
  playerId: "playerB",
  characters: [
    { characterId: "victim", maxHp: 40, abilityIds: [lethalStrike.id, bellsConsecration.id] },
    { characterId: "attacker", maxHp: 300, abilityIds: [lethalStrike.id] },
  ],
};

function deps() {
  const base = scenarioDeps(scenarioResourceLibrary([SOULS_RESOURCE]));
  return {
    ...base,
    abilities: { ...base.abilities, [bellsConsecration.id]: bellsConsecration, [lethalStrike.id]: lethalStrike },
  };
}

function grantSouls(state: ReturnType<typeof freshScenarioBattle>, amount: number) {
  return {
    ...state,
    characters: {
      ...state.characters,
      malachar: {
        ...state.characters.malachar!,
        resources: { ...state.characters.malachar!.resources, [SOULS_RESOURCE.id]: amount },
      },
    },
  };
}

describe("Malachar — The Dead Remember (Souls)", () => {
  it("gains a Soul when any character dies", () => {
    const state = freshScenarioBattle(TEAM_A, TEAM_B);
    // playerB's own attacker kills the victim (a death Malachar didn't cause — relation: "any").
    const result = expectOk(
      resolveTurn(state, [], [act("playerB", "attacker", lethalStrike.id, ["victim"])], deps()),
    );
    expect(result.state.characters.victim?.alive).toBe(false);
    expect(result.state.characters.malachar?.resources[SOULS_RESOURCE.id]).toBe(1);
  });

  it("Consecration (Father Bell's effect) blocks the Soul from that death", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    state = expectOk(
      resolveTurn(state, [], [act("playerB", "victim", bellsConsecration.id, ["victim"])], deps()),
    ).state;
    expect(state.characters.victim?.statuses.some((s) => s.statusId === "status.soul-consecration")).toBe(true);

    const afterDeath = expectOk(
      resolveTurn(state, [], [act("playerB", "attacker", lethalStrike.id, ["victim"])], deps()),
    );
    expect(afterDeath.state.characters.victim?.alive).toBe(false);
    expect(afterDeath.state.characters.malachar?.resources[SOULS_RESOURCE.id]).toBe(0); // no Soul from a consecrated death
  });
});

describe("Malachar — Borrowed Life (lifeTransfer)", () => {
  it("damages the enemy and restores that HP to Malachar himself", () => {
    const hurt = { ...freshScenarioBattle(TEAM_A, TEAM_B) };
    const state = { ...hurt, characters: { ...hurt.characters, malachar: { ...hurt.characters.malachar!, currentHp: 50 } } };
    const result = expectOk(resolveTurn(state, [act("playerA", "malachar", BORROWED_LIFE.id, ["victim"])], [], deps()));
    expect(result.state.characters.victim?.currentHp).toBe(10); // 40 - 30 damage (phase 15: was 20)
    expect(result.state.characters.malachar?.currentHp).toBe(70); // 50 + 20 restored, not the victim
  });
});

describe("Malachar — Raise the Forgotten (Thrall) and Corpse Command, fueled by Souls", () => {
  it("Raise the Forgotten does nothing without enough Souls, but summons a Thrall once he has them", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    const noSouls = expectOk(resolveTurn(state, [act("playerA", "malachar", RAISE_THE_FORGOTTEN.id, ["malachar"])], [], deps()));
    expect(Object.keys(noSouls.state.summons)).toHaveLength(0);

    state = grantSouls(state, 2);
    const withSouls = expectOk(resolveTurn(state, [act("playerA", "malachar", RAISE_THE_FORGOTTEN.id, ["malachar"])], [], deps()));
    expect(Object.values(withSouls.state.summons).some((s) => s.summonId === "summon.malachar.thrall")).toBe(true);
    expect(withSouls.state.characters.malachar?.resources[SOULS_RESOURCE.id]).toBe(0); // spent
  });

  it("Corpse Command deals its bonus damage only when Souls are available, and spends them", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    const weak = expectOk(resolveTurn(state, [act("playerA", "malachar", CORPSE_COMMAND.id, ["victim"])], [], deps()));
    expect(weak.state.characters.victim?.currentHp).toBe(25); // 40 - 15, the fallback

    state = grantSouls(state, 3);
    const strong = expectOk(resolveTurn(state, [act("playerA", "malachar", CORPSE_COMMAND.id, ["victim"])], [], deps()));
    expect(strong.state.characters.victim?.currentHp).toBe(10); // 40 - 30, the Soul-fueled version
    expect(strong.state.characters.malachar?.resources[SOULS_RESOURCE.id]).toBe(0); // spent
  });

  it("Consecration also blocks a resurrection outright (spec/03's fourth block)", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    state = expectOk(resolveTurn(state, [], [act("playerB", "victim", bellsConsecration.id, ["victim"])], deps())).state;
    state = expectOk(resolveTurn(state, [], [act("playerB", "attacker", lethalStrike.id, ["victim"])], deps())).state;
    expect(state.characters.victim?.alive).toBe(false);

    const result = applyEffect(
      { characters: state.characters, energyPools: state.energyPools, summons: state.summons },
      { kind: "resurrect" },
      { sourceId: "malachar", targetIds: ["victim"], teams: state.teams, turn: state.turn, statusLibrary: deps().statusLibrary, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      state.rngState,
    );
    expect(result.state.characters.victim?.alive).toBe(false);
    expect(result.events[0]?.type).toBe("resurrectionBlocked");
  });
});

describe("Malachar — You Belong to Me (a temporary fourth fighter)", () => {
  it("summons a slot-occupying Bound Thrall once he has 6 Souls", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    state = grantSouls(state, 6);
    const result = expectOk(resolveTurn(state, [act("playerA", "malachar", YOU_BELONG_TO_ME.id, ["malachar"])], [], deps()));
    const bound = Object.values(result.state.summons).find((s) => s.summonId === "summon.malachar.bound-thrall");
    expect(bound?.occupiesSlot).toBe(true);
    expect(result.state.characters.malachar?.resources[SOULS_RESOURCE.id]).toBe(0);
  });
});

describe("Malachar — Embrace the Throne (the Death King transformation)", () => {
  it("ascends once 8 Souls are collected", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    state = grantSouls(state, 8);
    const result = expectOk(resolveTurn(state, [act("playerA", "malachar", EMBRACE_THE_THRONE.id, ["malachar"])], [], deps()));
    expect(result.state.characters.malachar?.maxHp).toBe(150);
  });

  it("does nothing without enough Souls", () => {
    const state = freshScenarioBattle(TEAM_A, TEAM_B);
    const result = expectOk(resolveTurn(state, [act("playerA", "malachar", EMBRACE_THE_THRONE.id, ["malachar"])], [], deps()));
    expect(result.state.characters.malachar?.maxHp).toBe(MALACHAR.baseHp);
  });
});
