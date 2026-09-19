import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  BEHEMOTH,
  BITTER_DRAUGHT,
  CULL_THE_WEAK,
  defaultResourcesFor,
  FATHER_BELL,
  FINAL_STROKE,
  GORE,
  HYDRA,
  INK_SLASH,
  MALACHAR,
  MALACHAR_INITIAL_RESOURCES,
  PLAGUE_DOCTOR,
  REGROW,
  RESOURCE_LIBRARY,
  SERPENT_BITE,
  SHIRO,
  STATUS_LIBRARY,
  type Ability,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { applyEffect, type EffectContext, type EffectState } from "../effects";
import { createRng } from "../rng";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-06 batch 1 required signature tests: Malachar <-> Father Bell (real
// characters), Plague Doctor anti-heal vs each healing class, Behemoth no-heal,
// Shiro erasure vs death triggers, Hydra heads.

function fixture(input: Partial<Ability> & Pick<Ability, "id" | "effects">): Ability {
  return abilitySchema.parse({
    displayName: input.id,
    description: "test fixture",
    cost: {},
    target: { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] },
    ...input,
  });
}
const lethal = fixture({ id: "test.lethal", effects: [{ kind: "damage", amount: 999 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return {
    characterId: def.id,
    maxHp: def.baseHp,
    abilityIds: def.abilityIds,
    passiveId: def.passiveId,
    resources: defaultResourcesFor(def),
    ...overrides,
  };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [lethal.id]: lethal } };
}
function withHp<T extends ReturnType<typeof freshScenarioBattle>>(state: T, id: string, hp: number): T {
  return { ...state, characters: { ...state.characters, [id]: { ...state.characters[id]!, currentHp: hp } } };
}

describe("Malachar <-> Father Bell (real characters)", () => {
  const killer = { characterId: "killer", maxHp: 100, abilityIds: [lethal.id] };
  const malachar = member(MALACHAR, { resources: MALACHAR_INITIAL_RESOURCES });
  const victim = { characterId: "victim", maxHp: 40 };

  it("Malachar collects a Soul from a death when Father Bell is absent", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [malachar, killer] },
      { playerId: "playerB", characters: [victim, { characterId: "bystander", maxHp: 50 }] },
    );
    const r = expectOk(resolveTurn(state, [act("playerA", "killer", lethal.id, ["victim"])], [], deps()));
    expect(r.state.characters.victim?.alive).toBe(false);
    expect(r.state.characters["malachar"]?.resources["resource.souls"]).toBe(1);
  });

  it("Father Bell's passive consecrates the death, so Malachar gets no Soul", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [malachar, killer] },
      { playerId: "playerB", characters: [victim, member(FATHER_BELL)] },
    );
    const r = expectOk(resolveTurn(state, [act("playerA", "killer", lethal.id, ["victim"])], [], deps()));
    expect(r.state.characters.victim?.alive).toBe(false);
    expect(r.state.characters.victim?.statuses.some((s) => s.statusId === "status.soul-consecration")).toBe(true);
    expect(r.state.characters["malachar"]?.resources["resource.souls"]).toBe(0);
  });
});

describe("Behemoth — cannot receive healing", () => {
  const ally = { characterId: "healer", maxHp: 100 };
  const heal = fixture({
    id: "test.heal",
    target: { side: "ally", scope: "single", count: 1, includeSelf: false, filterTags: [] },
    effects: [{ kind: "heal", healingClass: "heal", amount: 50 }],
  });
  const dispel = fixture({ id: "test.dispel", effects: [{ kind: "removeStatus", dispelAll: true }] });

  it("holds Unhealable from turn 1, so a heal never lands, and a dispel can't remove it", () => {
    const state = withHp(
      freshScenarioBattle(
        { playerId: "playerA", characters: [member(BEHEMOTH), { ...ally, abilityIds: [heal.id] }] },
        { playerId: "playerB", characters: [{ characterId: "purger", maxHp: 100, abilityIds: [dispel.id] }] },
      ),
      "behemoth",
      100,
    );
    const d = { ...deps(), abilities: { ...deps().abilities, [heal.id]: heal, [dispel.id]: dispel } };
    const r = expectOk(
      resolveTurn(state, [act("playerA", "healer", heal.id, ["behemoth"])], [act("playerB", "purger", dispel.id, ["behemoth"])], d),
    );
    expect(r.state.characters.behemoth?.currentHp).toBe(100);
    expect(r.events.some((e) => e.type === "healBlocked")).toBe(true);
    expect(r.state.characters.behemoth?.statuses.some((s) => s.statusId === "status.unhealable")).toBe(true);
  });

  it("Gore hits for 50 through a real turn", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(BEHEMOTH)] },
      { playerId: "playerB", characters: [{ characterId: "dummy", maxHp: 200 }] },
    );
    const r = expectOk(resolveTurn(state, [act("playerA", "behemoth", GORE.id, ["dummy"])], [], deps()));
    expect(r.state.characters.dummy?.currentHp).toBe(150);
  });
});

describe("Plague Doctor — anti-heal versus each healing class", () => {
  const teams: EffectContext["teams"] = [
    { playerId: "playerA", characterIds: ["src"] },
    { playerId: "playerB", characterIds: ["patient"] },
  ];
  function ctx(): EffectContext {
    return {
      sourceId: "src",
      targetIds: ["patient"],
      teams,
      turn: 1,
      statusLibrary: STATUS_LIBRARY,
      summonLibrary: {},
      transformationLibrary: {},
      resourceLibrary: {},
    };
  }
  function patientState(status: string): EffectState {
    const base = freshScenarioBattle(
      { playerId: "playerA", characters: [{ characterId: "src", maxHp: 100 }] },
      { playerId: "playerB", characters: [{ characterId: "patient", maxHp: 100 }] },
    );
    const hurt = { ...base.characters.patient!, currentHp: 40 };
    const applied = applyEffect(
      { characters: { ...base.characters, patient: hurt }, energyPools: base.energyPools, summons: {} },
      { kind: "applyStatus", statusId: status, magnitude: 10 },
      ctx(),
      createRng(1),
    );
    return applied.state;
  }
  const heal = (healingClass: "heal" | "lifeTransfer" | "setHp", amount: number) =>
    ({ kind: "heal", healingClass, amount }) as const;
  const hpAfter = (state: EffectState, e: ReturnType<typeof heal>) =>
    applyEffect(state, e, ctx(), createRng(1)).state.characters.patient?.currentHp;

  it("Anti-Heal blocks `heal` only", () => {
    const s = patientState("status.anti-heal");
    expect(hpAfter(s, heal("heal", 30))).toBe(40);
    expect(hpAfter(s, heal("lifeTransfer", 30))).toBe(70);
    expect(hpAfter(s, heal("setHp", 90))).toBe(90);
  });

  it("Healing Reduction cuts `heal` and `lifeTransfer`, never `setHp`", () => {
    const s = patientState("status.healing-reduction");
    expect(hpAfter(s, heal("heal", 30))).toBe(60);
    expect(hpAfter(s, heal("lifeTransfer", 30))).toBe(60);
    expect(hpAfter(s, heal("setHp", 90))).toBe(90);
  });

  it("Bitter Draught then Cull the Weak deals the punished 40 through real turns", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(PLAGUE_DOCTOR)] },
      { playerId: "playerB", characters: [{ characterId: "dummy", maxHp: 200 }] },
    );
    state = expectOk(resolveTurn(state, [act("playerA", "plague-doctor", BITTER_DRAUGHT.id, ["dummy"])], [], deps())).state;
    const r = expectOk(resolveTurn(state, [act("playerA", "plague-doctor", CULL_THE_WEAK.id, ["dummy"])], [], deps()));
    expect(r.state.characters.dummy?.currentHp).toBe(160);
  });
});

describe("Shiro — erasure versus death triggers", () => {
  const watcher = member(MALACHAR, { resources: MALACHAR_INITIAL_RESOURCES });
  const build = () =>
    withHp(
      freshScenarioBattle(
        { playerId: "playerA", characters: [member(SHIRO)] },
        { playerId: "playerB", characters: [{ characterId: "prey", maxHp: 100 }, watcher] },
      ),
      "prey",
      20,
    );

  it("Final Stroke erases a weakened target and Malachar's on-death passive never fires", () => {
    const r = expectOk(resolveTurn(build(), [act("playerA", "shiro", FINAL_STROKE.id, ["prey"])], [], deps()));
    expect(r.state.characters.prey?.alive).toBe(false);
    expect(r.events.some((e) => e.type === "erased")).toBe(true);
    expect(r.events.some((e) => e.type === "death" && e.targetId === "prey")).toBe(false);
    expect(r.state.characters.malachar?.resources["resource.souls"]).toBe(0);
  });

  it("an ordinary kill of the same target does fire it", () => {
    const r = expectOk(resolveTurn(build(), [act("playerA", "shiro", INK_SLASH.id, ["prey"])], [], deps()));
    expect(r.state.characters.prey?.alive).toBe(false);
    expect(r.state.characters.malachar?.resources["resource.souls"]).toBe(1);
  });

  it("Final Stroke only chips a healthy target", () => {
    const healthy = freshScenarioBattle(
      { playerId: "playerA", characters: [member(SHIRO)] },
      { playerId: "playerB", characters: [{ characterId: "prey", maxHp: 100 }] },
    );
    const r = expectOk(resolveTurn(healthy, [act("playerA", "shiro", FINAL_STROKE.id, ["prey"])], [], deps()));
    expect(r.state.characters.prey?.alive).toBe(true);
    expect(r.state.characters.prey?.currentHp).toBe(80);
  });
});

describe("Hydra — heads", () => {
  const bitesFor = (heads: number) => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(HYDRA, { resources: { "resource.heads": heads } })] },
      { playerId: "playerB", characters: [{ characterId: "dummy", maxHp: 200 }] },
    );
    const r = expectOk(resolveTurn(state, [act("playerA", "hydra", SERPENT_BITE.id, ["dummy"])], [], deps()));
    return 200 - (r.state.characters.dummy?.currentHp ?? 0);
  };

  it("bite damage scales with heads", () => {
    expect(bitesFor(5)).toBe(40);
    expect(bitesFor(3)).toBe(25);
    expect(bitesFor(1)).toBe(12);
  });

  it("being wounded costs a head", () => {
    const hit = fixture({ id: "test.hit", effects: [{ kind: "damage", amount: 5 }] });
    const d = { ...deps(), abilities: { ...deps().abilities, [hit.id]: hit } };
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(HYDRA)] },
      { playerId: "playerB", characters: [{ characterId: "foe", maxHp: 100, abilityIds: [hit.id] }] },
    );
    const r = expectOk(resolveTurn(state, [], [act("playerB", "foe", hit.id, ["hydra"])], d));
    expect(r.state.characters.hydra?.resources["resource.heads"]).toBe(2);
  });

  it("Regrow restores heads, but not while burning", () => {
    const base = freshScenarioBattle(
      { playerId: "playerA", characters: [member(HYDRA)] },
      { playerId: "playerB", characters: [{ characterId: "dummy", maxHp: 100 }] },
    );
    const grown = expectOk(resolveTurn(base, [act("playerA", "hydra", REGROW.id, ["hydra"])], [], deps()));
    expect(grown.state.characters.hydra?.resources["resource.heads"]).toBe(5);

    const burning = {
      ...base,
      characters: {
        ...base.characters,
        hydra: { ...base.characters.hydra!, statuses: [{ statusId: "status.burn", remainingTurns: 3, stacks: 1, magnitude: 0 }] },
      },
    };
    const blocked = expectOk(resolveTurn(burning, [act("playerA", "hydra", REGROW.id, ["hydra"])], [], deps()));
    expect(blocked.state.characters.hydra?.resources["resource.heads"]).toBe(3);
  });
});
