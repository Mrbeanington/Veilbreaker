import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  ABILITY_LIBRARY,
  ADAGIO,
  ALLEGRO,
  BLACKENED_GUARD,
  BLACK_KNIGHT,
  COLD_BLADE,
  DA_CAPO,
  defaultResourcesFor,
  EMPEROR_ZERO,
  FATHER_BELL,
  FINAL_STROKE,
  FOX_FIRE,
  HUSH,
  MAESTRO_NOCTURNE,
  NINE_TAILED_TRICKSTER,
  OATHBREAKER,
  PENALTY_FLAG,
  RED_CARD,
  RESOURCE_LIBRARY,
  REVOKE,
  SHIRO,
  STACCATO,
  STASIS_FIELD,
  TAIL_LASH,
  THE_NAMELESS_ONE,
  THE_REFEREE,
  THUNDERCLAP,
  ZEIRON,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { validateAction } from "../actions";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-06 batch 3 signature tests: Referee Fouls and ejection, Maestro
// tempo/cooldown manipulation, Black Knight versus a Legend, Emperor Zero
// ability near-removal, and the Nameless One rewind (spec/07's state-restoration list).

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
const hit30 = fixture({ id: "test.hit30", effects: [{ kind: "damage", amount: 30 }] });
const decoy = fixture({ id: "test.decoy", effects: [{ kind: "damage", amount: 10 }] });
const cd3 = fixture({ id: "test.cd3", cooldown: 3, effects: [{ kind: "damage", amount: 10 }] });
const roll = fixture({
  id: "test.roll",
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        branches: [
          { weight: 1, effects: [{ kind: "damage", amount: 10 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 20 }] },
        ],
        rerollable: false,
      },
    },
  ],
});

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return {
    characterId: def.id,
    maxHp: def.baseHp,
    abilityIds: def.abilityIds,
    passiveId: def.passiveId,
    tags: def.tags,
    resources: defaultResourcesFor(def),
    ...overrides,
  };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  const fixtures = Object.fromEntries([lethal, hit30, decoy, cd3, roll].map((a) => [a.id, a]));
  return { ...base, abilities: { ...base.abilities, ...fixtures } };
}
function turn(state: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) {
  return expectOk(resolveTurn(state, a, b, deps())).state;
}
function patch(state: BattleState, id: string, change: Partial<BattleState["characters"][string]>): BattleState {
  return { ...state, characters: { ...state.characters, [id]: { ...state.characters[id]!, ...change } } };
}
const has = (state: BattleState, id: string, statusId: string) =>
  state.characters[id]?.statuses.some((s) => s.statusId === statusId) ?? false;

const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [lethal.id, hit30.id, decoy.id, cd3.id, roll.id] };
const bystander = { characterId: "bystander", maxHp: 900 };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });

describe("The Referee — Fouls and ejection", () => {
  const foulsOf = (state: BattleState) => state.characters.attacker?.resources["resource.fouls"] ?? 0;
  const battle = (resources?: Record<string, number>) =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(THE_REFEREE), bystander] },
      { playerId: "playerB", characters: [{ ...attacker, resources }] },
    );
  const use = (state: BattleState, abilityId: string) =>
    turn(state, [], [act("playerB", "attacker", abilityId, ["bystander"])]);

  it("using the same ability twice in a row draws a Foul", () => {
    let state = use(battle(), hit30.id);
    expect(foulsOf(state)).toBe(0);
    state = use(state, hit30.id);
    expect(foulsOf(state)).toBe(1);
  });

  it("varying abilities never draws a Foul", () => {
    let state = battle();
    for (const id of [hit30.id, decoy.id, hit30.id, decoy.id, hit30.id]) state = use(state, id);
    expect(foulsOf(state)).toBe(0);
  });

  it("the third Foul is an ejection: stunned for two turns and the ledger is wiped", () => {
    let state = battle();
    for (let i = 0; i < 3; i += 1) state = use(state, hit30.id);
    expect(foulsOf(state)).toBe(2);
    expect(has(state, "attacker", "status.stun")).toBe(false);
    state = use(state, hit30.id);
    expect(foulsOf(state)).toBe(0);
    expect(has(state, "attacker", "status.stun")).toBe(true);
    expect(validateAction(state, act("playerB", "attacker", hit30.id, ["bystander"]), deps().abilities).some((e) => e.code === "characterCannotAct")).toBe(true);
  });

  it("Penalty Flag adds a Foul whatever the target did", () => {
    const state = turn(battle(), [act("playerA", "the-referee", PENALTY_FLAG.id, ["attacker"])]);
    expect(foulsOf(state)).toBe(1);
  });

  it("Red Card ejects at 2 Fouls, and only adds a Foul before that", () => {
    const early = turn(battle(), [act("playerA", "the-referee", RED_CARD.id, ["attacker"])]);
    expect(foulsOf(early)).toBe(1);
    expect(has(early, "attacker", "status.stun")).toBe(false);
    const ejected = turn(battle({ "resource.fouls": 2 }), [act("playerA", "the-referee", RED_CARD.id, ["attacker"])]);
    expect(foulsOf(ejected)).toBe(0);
    expect(has(ejected, "attacker", "status.stun")).toBe(true);
  });

  it("only enemies are fouled: his own team repeating an ability does nothing", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(THE_REFEREE), { characterId: "mate", maxHp: 200, abilityIds: [hit30.id] }] },
      { playerId: "playerB", characters: [dummy()] },
    );
    for (let i = 0; i < 3; i += 1) state = turn(state, [act("playerA", "mate", hit30.id, ["dummy"])]);
    expect(state.characters.mate?.resources["resource.fouls"] ?? 0).toBe(0);
  });
});

describe("Maestro Nocturne — tempo and cooldowns", () => {
  const battle = () =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(MAESTRO_NOCTURNE), { characterId: "ally", maxHp: 200, abilityIds: [cd3.id] }] },
      { playerId: "playerB", characters: [attacker, dummy()] },
    );
  const cooldown = (state: BattleState, id: string) => state.characters[id]?.cooldowns[cd3.id] ?? 0;

  it("Adagio stops an enemy's cooldowns ticking", () => {
    const start = battle();
    const control = turn(turn(start, [], [act("playerB", "attacker", cd3.id, ["ally"])]), []);
    expect(cooldown(control, "attacker")).toBe(2);
    let slowed = turn(start, [act("playerA", "maestro-nocturne", ADAGIO.id, ["attacker"])], [act("playerB", "attacker", cd3.id, ["ally"])]);
    slowed = turn(slowed, []);
    expect(cooldown(slowed, "attacker")).toBe(3);
  });

  it("Allegro makes an ally's cooldowns tick twice as fast", () => {
    const start = battle();
    const control = turn(turn(start, [act("playerA", "ally", cd3.id, ["dummy"])]), []);
    expect(cooldown(control, "ally")).toBe(2);
    let hasted = turn(start, [act("playerA", "ally", cd3.id, ["dummy"]), act("playerA", "maestro-nocturne", ALLEGRO.id, ["ally"])]);
    hasted = turn(hasted, []);
    expect(cooldown(hasted, "ally")).toBe(1);
  });

  it("Da Capo makes an ally's most recent ability ready again", () => {
    let state = turn(battle(), [act("playerA", "ally", cd3.id, ["dummy"])]);
    expect(cooldown(state, "ally")).toBe(3);
    state = turn(state, [act("playerA", "maestro-nocturne", DA_CAPO.id, ["ally"])]);
    expect(cooldown(state, "ally")).toBe(0);
  });

  it("Da Capo does nothing for an ally who has not used an ability yet", () => {
    const state = turn(battle(), [act("playerA", "maestro-nocturne", DA_CAPO.id, ["ally"])]);
    expect(state.characters.ally?.cooldowns).toEqual({});
  });

  it("Perfect Tempo: each ability he uses shaves a turn off Da Capo's cooldown", () => {
    const start = patch(battle(), "maestro-nocturne", { cooldowns: { [DA_CAPO.id]: 4 } });
    const state = turn(start, [act("playerA", "maestro-nocturne", STACCATO.id, ["dummy"])]);
    expect(state.characters["maestro-nocturne"]?.cooldowns[DA_CAPO.id]).toBe(2); // -1 passive, -1 natural tick
  });
});

describe("The Black Knight — versus a Legend", () => {
  const vsLegend = () =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(BLACK_KNIGHT)] },
      { playerId: "playerB", characters: [member(ZEIRON)] },
    );
  const vsOrdinary = () =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(BLACK_KNIGHT)] },
      { playerId: "playerB", characters: [attacker, dummy(300)] },
    );

  it("Cold Blade deals 55 to a Legend but only 30 to anyone else", () => {
    const legend = turn(vsLegend(), [act("playerA", "black-knight", COLD_BLADE.id, ["zeiron"])]);
    expect(legend.characters.zeiron?.currentHp).toBe(130 - 55);
    const ordinary = turn(vsOrdinary(), [act("playerA", "black-knight", COLD_BLADE.id, ["dummy"])]);
    expect(ordinary.characters.dummy?.currentHp).toBe(300 - 30);
  });

  it("Oathbreaker silences a Legend, but is just a 20 damage blow against anyone else", () => {
    const legend = turn(vsLegend(), [act("playerA", "black-knight", OATHBREAKER.id, ["zeiron"])]);
    expect(has(legend, "zeiron", "status.silence")).toBe(true);
    expect(legend.characters.zeiron?.currentHp).toBe(100);
    const ordinary = turn(vsOrdinary(), [act("playerA", "black-knight", OATHBREAKER.id, ["dummy"])]);
    expect(has(ordinary, "dummy", "status.silence")).toBe(false);
    expect(ordinary.characters.dummy?.currentHp).toBe(280);
  });

  it("Slayer's Resolve: a Legend's hit hardens him, so the next one lands for less", () => {
    let state = turn(vsLegend(), [], [act("playerB", "zeiron", THUNDERCLAP.id, ["black-knight"])]);
    expect(state.characters["black-knight"]?.currentHp).toBe(120);
    expect(has(state, "black-knight", "status.damage-reduction")).toBe(true);
    state = turn(state, [], [act("playerB", "zeiron", THUNDERCLAP.id, ["black-knight"])]);
    expect(state.characters["black-knight"]?.currentHp).toBe(100); // 30 - 10
  });

  it("an ordinary attacker does not trigger Slayer's Resolve", () => {
    const state = turn(vsOrdinary(), [], [act("playerB", "attacker", hit30.id, ["black-knight"])]);
    expect(state.characters["black-knight"]?.currentHp).toBe(120);
    expect(has(state, "black-knight", "status.damage-reduction")).toBe(false);
  });

  it("counterplay: Fox Fire's Burn ticks as unmitigated affliction damage through his Guard", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(BLACK_KNIGHT)] },
      { playerId: "playerB", characters: [member(NINE_TAILED_TRICKSTER)] },
    );
    state = turn(state, [act("playerA", "black-knight", BLACKENED_GUARD.id, ["black-knight"])], [act("playerB", "nine-tailed-trickster", FOX_FIRE.id, ["black-knight"])]);
    expect(has(state, "black-knight", "status.burn")).toBe(true);
    expect(has(state, "black-knight", "status.damage-reduction")).toBe(true);
    const before = state.characters["black-knight"]!.currentHp;
    state = turn(state, []);
    expect(state.characters["black-knight"]!.currentHp).toBeLessThan(before);
  });

  it("counterplay: Father Bell's Hush silences him like anyone else", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(BLACK_KNIGHT)] },
      { playerId: "playerB", characters: [member(FATHER_BELL)] },
    );
    state = turn(state, [], [act("playerB", "father-bell", HUSH.id, ["black-knight"])]);
    expect(validateAction(state, act("playerA", "black-knight", COLD_BLADE.id, ["father-bell"]), ABILITY_LIBRARY).some((e) => e.code === "characterCannotAct")).toBe(true);
  });
});

describe("Emperor Zero — near-removal of an ability", () => {
  const battle = () =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(EMPEROR_ZERO), bystander] },
      { playerId: "playerB", characters: [attacker] },
    );
  const errorsFor = (state: BattleState, abilityId: string) =>
    validateAction(state, act("playerB", "attacker", abilityId, ["bystander"]), deps().abilities).map((e) => e.code);

  it("Revoke locks the ability the enemy used most recently", () => {
    let state = turn(battle(), [], [act("playerB", "attacker", hit30.id, ["bystander"])]);
    state = turn(state, [act("playerA", "emperor-zero", REVOKE.id, ["attacker"])]);
    const lock = state.characters.attacker?.statuses.find((s) => s.statusId === "status.ability-lock");
    expect(lock?.param).toBe(hit30.id);
    expect(lock?.remainingTurns).toBeGreaterThanOrEqual(5);
    expect(errorsFor(state, hit30.id)).toContain("abilityLocked");
    expect(errorsFor(state, decoy.id)).not.toContain("abilityLocked");
  });

  it("counterplay: ending on a throwaway ability makes Revoke hit the decoy", () => {
    let state = turn(battle(), [], [act("playerB", "attacker", hit30.id, ["bystander"])]);
    state = turn(state, [], [act("playerB", "attacker", decoy.id, ["bystander"])]);
    state = turn(state, [act("playerA", "emperor-zero", REVOKE.id, ["attacker"])]);
    expect(state.characters.attacker?.statuses.find((s) => s.statusId === "status.ability-lock")?.param).toBe(decoy.id);
    expect(errorsFor(state, hit30.id)).not.toContain("abilityLocked");
  });

  it("Revoke on an enemy that has used nothing yet does nothing", () => {
    const state = turn(battle(), [act("playerA", "emperor-zero", REVOKE.id, ["attacker"])]);
    expect(has(state, "attacker", "status.ability-lock")).toBe(false);
  });

  it("Stasis Field freezes every enemy's cooldowns", () => {
    const start = battle();
    const control = turn(turn(start, [], [act("playerB", "attacker", cd3.id, ["bystander"])]), []);
    expect(control.characters.attacker?.cooldowns[cd3.id]).toBe(2);
    let frozen = turn(start, [act("playerA", "emperor-zero", STASIS_FIELD.id)], [act("playerB", "attacker", cd3.id, ["bystander"])]);
    frozen = turn(frozen, []);
    expect(frozen.characters.attacker?.cooldowns[cd3.id]).toBe(3);
  });

  it("Failsafe Protocol: below 40% health each wound makes Revoke ready again", () => {
    const start = patch(battle(), "emperor-zero", { currentHp: 60, cooldowns: { [REVOKE.id]: 5 } });
    const state = turn(start, [], [act("playerB", "attacker", hit30.id, ["emperor-zero"])]);
    expect(state.characters["emperor-zero"]?.currentHp).toBe(30);
    expect(state.characters["emperor-zero"]?.cooldowns[REVOKE.id]).toBe(0);
    const healthy = turn(patch(battle(), "emperor-zero", { cooldowns: { [REVOKE.id]: 5 } }), [], [act("playerB", "attacker", hit30.id, ["emperor-zero"])]);
    expect(healthy.characters["emperor-zero"]?.cooldowns[REVOKE.id]).toBe(4);
  });

  it("counterplay: Father Bell's Hush stops him casting Revoke at all", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(EMPEROR_ZERO)] },
      { playerId: "playerB", characters: [member(FATHER_BELL)] },
    );
    state = turn(state, [], [act("playerB", "father-bell", HUSH.id, ["emperor-zero"])]);
    expect(validateAction(state, act("playerA", "emperor-zero", REVOKE.id, ["father-bell"]), ABILITY_LIBRARY).some((e) => e.code === "characterCannotAct")).toBe(true);
  });
});

describe("The Nameless One — rewind (OQ-06)", () => {
  const nameless = () => member(THE_NAMELESS_ONE);
  const duel = () =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [nameless()] },
      { playerId: "playerB", characters: [attacker] },
    );
  const kill = (state: BattleState) => resolveTurn(state, [], [act("playerB", "attacker", lethal.id, ["the-nameless-one"])], deps());

  it("when he would die, the turn is rewound: same turn number, full health, charge spent", () => {
    const start = duel();
    const r = expectOk(kill(start));
    expect(r.state.turn).toBe(start.turn);
    expect(r.state.initiativePlayerId).toBe(start.initiativePlayerId);
    const c = r.state.characters["the-nameless-one"]!;
    expect(c.alive).toBe(true);
    expect(c.currentHp).toBe(170);
    expect(c.resources["resource.rewind"]).toBe(0);
    expect(r.state.energyPools).toEqual(start.energyPools);
  });

  it("the rewind is announced in the battle log (rule 9)", () => {
    const r = expectOk(kill(duel()));
    expect(r.events.some((e) => e.type === "rewindRequested")).toBe(true);
    expect(r.events.some((e) => e.type === "turnRewound" && e.sourceId === "the-nameless-one")).toBe(true);
    expect(r.state.eventLog.some((e) => e.type === "turnRewound")).toBe(true);
  });

  it("restores every state field except the RNG stream, the log and his spent charge", () => {
    const base = freshScenarioBattle(
      { playerId: "playerA", characters: [nameless(), { characterId: "ally", maxHp: 120, abilityIds: [hit30.id] }] },
      {
        playerId: "playerB",
        characters: [
          attacker,
          member(NINE_TAILED_TRICKSTER, { resources: { "resource.tails": 8 } }),
          { characterId: "roller", maxHp: 100, abilityIds: [roll.id] },
        ],
      },
    );
    let pre = patch(base, "the-nameless-one", {
      currentHp: 100,
      cooldowns: { "ability.the-nameless-one.redact": 2 },
      statuses: [{ statusId: "status.damage-reduction", remainingTurns: 2, stacks: 1, magnitude: 10 }],
      abilityHistory: ["ability.the-nameless-one.unwritten-strike"],
      stats: { damageDealt: 50, damageReceived: 70, healingDone: 0, kills: 1, deaths: 0 },
    });
    pre = patch(pre, "ally", { currentHp: 60, pendingRngModifiers: [{ mode: "guaranteeMax" }] });
    pre = {
      ...pre,
      energyPools: { ...pre.energyPools, playerA: { ...pre.energyPools.playerA!, MIGHT: 7 } },
      summons: {
        "attacker:test": {
          instanceId: "attacker:test",
          summonId: "summon.test",
          ownerCharacterId: "attacker",
          occupiesSlot: false,
          currentHp: 20,
          maxHp: 40,
          alive: true,
          remainingTurns: 3,
        },
      },
    };
    const r = expectOk(
      resolveTurn(
        pre,
        [act("playerA", "ally", hit30.id, ["roller"])],
        [
          act("playerB", "attacker", lethal.id, ["the-nameless-one"]),
          act("playerB", "nine-tailed-trickster", TAIL_LASH.id, ["ally"]),
          act("playerB", "roller", roll.id, ["ally"]),
        ],
        deps(),
      ),
    );
    const expected = {
      ...pre,
      characters: {
        ...pre.characters,
        "the-nameless-one": {
          ...pre.characters["the-nameless-one"]!,
          resources: { ...pre.characters["the-nameless-one"]!.resources, "resource.rewind": 0 },
        },
      },
    };
    expect({ ...r.state, rngState: pre.rngState, eventLog: pre.eventLog }).toEqual(expected);
    // Transformation stage: the Trickster's ninth tail this turn was undone.
    expect(r.state.characters["nine-tailed-trickster"]?.resources["resource.tails"]).toBe(8);
    expect(r.state.characters["nine-tailed-trickster"]?.maxHp).toBe(100);
    // The RNG stream advanced: no identical re-roll.
    expect(r.state.rngState).not.toBe(pre.rngState);
  });

  it("is once per battle: the second lethal blow kills him", () => {
    const rewound = expectOk(kill(duel())).state;
    const second = expectOk(kill(rewound));
    expect(second.state.characters["the-nameless-one"]?.alive).toBe(false);
    expect(second.state.turn).toBe(rewound.turn + 1);
    expect(second.events.some((e) => e.type === "turnRewound")).toBe(false);
  });

  it("the charge stays spent even if the replayed turn kills him again", () => {
    const rewound = expectOk(kill(duel())).state;
    expect(rewound.characters["the-nameless-one"]?.resources["resource.rewind"]).toBe(0);
    const again = expectOk(kill(rewound)).state;
    expect(again.characters["the-nameless-one"]?.resources["resource.rewind"]).toBe(0);
  });

  it("death prevention takes precedence: a lethal blow leaves him at 1 HP and the charge unspent", () => {
    const protectedStart = patch(duel(), "the-nameless-one", {
      statuses: [{ statusId: "status.death-prevention", remainingTurns: null, stacks: 1, magnitude: 0 }],
    });
    const r = expectOk(kill(protectedStart));
    expect(r.state.characters["the-nameless-one"]?.currentHp).toBe(1);
    expect(r.state.characters["the-nameless-one"]?.resources["resource.rewind"]).toBe(1);
    expect(r.state.turn).toBe(protectedStart.turn + 1);
  });

  it("simultaneous death: the rewind spares the other side too, then the second time both fall", () => {
    const start = freshScenarioBattle(
      { playerId: "playerA", characters: [{ ...nameless(), abilityIds: [...nameless().abilityIds, lethal.id] }] },
      { playerId: "playerB", characters: [attacker] },
    );
    const both = () => [act("playerA", "the-nameless-one", lethal.id, ["attacker"])];
    const enemy = () => [act("playerB", "attacker", lethal.id, ["the-nameless-one"])];
    const first = expectOk(resolveTurn(start, both(), enemy(), deps()));
    expect(first.state.characters.attacker?.alive).toBe(true);
    expect(first.state.characters.attacker?.currentHp).toBe(300);
    expect(first.events.some((e) => e.type === "matchEndedInDraw")).toBe(false);
    const second = expectOk(resolveTurn(first.state, both(), enemy(), deps()));
    expect(second.events.some((e) => e.type === "matchEndedInDraw")).toBe(true);
  });

  it("erasure bypasses it: Shiro's Final Stroke ends him with the charge unspent (a roster counter)", () => {
    const start = freshScenarioBattle(
      { playerId: "playerA", characters: [nameless()] },
      { playerId: "playerB", characters: [member(SHIRO)] },
    );
    const weak = patch(start, "the-nameless-one", { currentHp: 40 });
    const r = expectOk(resolveTurn(weak, [], [act("playerB", "shiro", FINAL_STROKE.id, ["the-nameless-one"])], deps()));
    expect(r.state.characters["the-nameless-one"]?.alive).toBe(false);
    expect(r.state.characters["the-nameless-one"]?.resources["resource.rewind"]).toBe(1);
    expect(r.events.some((e) => e.type === "turnRewound")).toBe(false);
  });

  it("an ordinary non-lethal turn is untouched", () => {
    const r = expectOk(resolveTurn(duel(), [], [act("playerB", "attacker", hit30.id, ["the-nameless-one"])], deps()));
    expect(r.state.turn).toBe(2);
    expect(r.state.characters["the-nameless-one"]?.currentHp).toBe(140);
    expect(r.state.characters["the-nameless-one"]?.resources["resource.rewind"]).toBe(1);
  });

  it("replay determinism across a rewind: the same seed and actions give an identical result", () => {
    const run = () => {
      let state = freshScenarioBattle(
        { playerId: "playerA", characters: [nameless()] },
        { playerId: "playerB", characters: [attacker] },
        7,
      );
      state = expectOk(resolveTurn(state, [], [act("playerB", "attacker", roll.id, ["the-nameless-one"])], deps())).state;
      state = expectOk(kill(state)).state; // rewound
      state = expectOk(resolveTurn(state, [], [act("playerB", "attacker", roll.id, ["the-nameless-one"])], deps())).state;
      return JSON.stringify(state);
    };
    expect(run()).toBe(run());
  });
});
