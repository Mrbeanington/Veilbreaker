import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  ABILITY_LIBRARY,
  BABA_YAGA,
  CASH_OUT,
  CHIPS_RESOURCE,
  COLD_DECK,
  DEATHLESS_FURY,
  defaultResourcesFor,
  FATHER_BELL,
  FOX_FIRE,
  HIDE_THE_NEEDLE,
  HIGH_STAKES,
  HUT_ON_LEGS,
  HYDRA,
  KOSCHEI,
  LOADED_DICE,
  MORTAR_FLIGHT,
  NINE_TAILED_TRICKSTER,
  REGROW,
  RESOURCE_LIBRARY,
  TAIL_LASH,
  THE_GAMBLER,
  ZEIRON,
  WRATH_OF_THE_UNCHAINED_SKY,
  HUSH,
  type Ability,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { validateAction } from "../actions";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-06 batch 2 signature tests: Koschei Death Seals/Relics, Nine-Tails
// tails -> Ascension, Gambler probability interactions, plus Baba Yaga and the
// Zeiron Legend's costs and counters.

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
  return { ...base, abilities: { ...base.abilities, [lethal.id]: lethal, [hit30.id]: hit30 } };
}
const attacker = { characterId: "attacker", maxHp: 200, abilityIds: [lethal.id, hit30.id] };
const dummy = (hp = 300) => ({ characterId: "dummy", maxHp: hp });

describe("Koschei — Death Seals", () => {
  const battle = (resources = defaultResourcesFor(KOSCHEI)) =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(KOSCHEI, { resources })] },
      { playerId: "playerB", characters: [attacker] },
    );

  it("a Seal turns the next lethal blow into 1 HP, spending the Seal", () => {
    const r = expectOk(resolveTurn(battle(), [], [act("playerB", "attacker", lethal.id, ["koschei"])], deps()));
    expect(r.state.characters.koschei?.alive).toBe(true);
    expect(r.state.characters.koschei?.currentHp).toBe(1);
    expect(r.state.characters.koschei?.resources["resource.death-seals"]).toBe(0);
  });

  it("with no Seals left the same blow kills him", () => {
    const r = expectOk(
      resolveTurn(battle({ "resource.death-seals": 0 }), [], [act("playerB", "attacker", lethal.id, ["koschei"])], deps()),
    );
    expect(r.state.characters.koschei?.alive).toBe(false);
  });

  it("Hide the Needle banks a new Seal", () => {
    const r = expectOk(resolveTurn(battle(), [act("playerA", "koschei", HIDE_THE_NEEDLE.id, ["koschei"])], [], deps()));
    expect(r.state.characters.koschei?.resources["resource.death-seals"]).toBe(1); // 1 -> 0 (charged) -> 1
  });

  it("Deathless Fury hits for 45 while holding 2+ Seals, 20 otherwise", () => {
    const strong = expectOk(
      resolveTurn(
        freshScenarioBattle(
          { playerId: "playerA", characters: [member(KOSCHEI, { resources: { "resource.death-seals": 3 } })] },
          { playerId: "playerB", characters: [dummy()] },
        ),
        [act("playerA", "koschei", DEATHLESS_FURY.id, ["dummy"])],
        [],
        deps(),
      ),
    );
    expect(300 - (strong.state.characters.dummy?.currentHp ?? 0)).toBe(45);
    const weak = expectOk(
      resolveTurn(
        freshScenarioBattle(
          { playerId: "playerA", characters: [member(KOSCHEI, { resources: { "resource.death-seals": 0 } })] },
          { playerId: "playerB", characters: [dummy()] },
        ),
        [act("playerA", "koschei", DEATHLESS_FURY.id, ["dummy"])],
        [],
        deps(),
      ),
    );
    expect(300 - (weak.state.characters.dummy?.currentHp ?? 0)).toBe(20);
  });
});

describe("Nine-Tailed Trickster — tails and Ascension", () => {
  const battle = (tails = 1) =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(NINE_TAILED_TRICKSTER, { resources: { "resource.tails": tails } })] },
      { playerId: "playerB", characters: [dummy(500)] },
    );

  it("every landed hit grows a tail", () => {
    const r = expectOk(resolveTurn(battle(), [act("playerA", "nine-tailed-trickster", TAIL_LASH.id, ["dummy"])], [], deps()));
    expect(r.state.characters["nine-tailed-trickster"]?.resources["resource.tails"]).toBe(2);
  });

  it("the ninth tail Ascends her: more HP and the Nine-Flame Nova replaces Fox Fire", () => {
    const r = expectOk(resolveTurn(battle(8), [act("playerA", "nine-tailed-trickster", TAIL_LASH.id, ["dummy"])], [], deps()));
    const c = r.state.characters["nine-tailed-trickster"]!;
    expect(c.resources["resource.tails"]).toBe(9);
    expect(c.maxHp).toBe(150);
    expect(c.abilityIds).toContain("ability.nine-tailed-trickster.nine-flame-nova");
    expect(c.abilityIds).not.toContain(FOX_FIRE.id);
  });

  it("Fox Fire applies a real Burn — which cauterizes Hydra's Regrow", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(NINE_TAILED_TRICKSTER)] },
      { playerId: "playerB", characters: [member(HYDRA)] },
    );
    state = expectOk(resolveTurn(state, [act("playerA", "nine-tailed-trickster", FOX_FIRE.id, ["hydra"])], [], deps())).state;
    expect(state.characters.hydra?.statuses.some((s) => s.statusId === "status.burn")).toBe(true);
    const headsBefore = state.characters.hydra?.resources["resource.heads"] ?? 0;
    const r = expectOk(resolveTurn(state, [], [act("playerB", "hydra", REGROW.id, ["hydra"])], deps()));
    expect(r.state.characters.hydra?.resources["resource.heads"]).toBeLessThanOrEqual(headsBefore);
  });
});

describe("The Gambler — probability interactions", () => {
  const battle = (seed = 1, resources = defaultResourcesFor(THE_GAMBLER)) =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(THE_GAMBLER, { resources })] },
      { playerId: "playerB", characters: [dummy(500)] },
      seed,
    );

  it("every High Stakes roll is consistent: a small hit always banks a Chip, a jackpot never does", () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 25; seed++) {
      const r = expectOk(resolveTurn(battle(seed), [act("playerA", "the-gambler", HIGH_STAKES.id, ["dummy"])], [], deps()));
      const damage = 500 - (r.state.characters.dummy?.currentHp ?? 0);
      const chips = r.state.characters["the-gambler"]?.resources[CHIPS_RESOURCE.id];
      seen.add(damage);
      expect(damage === 10 ? chips === 1 : damage === 60 && chips === 0).toBe(true);
    }
    expect(seen).toEqual(new Set([10, 60]));
  });

  it("is deterministic: same seed, same result", () => {
    const run = () => expectOk(resolveTurn(battle(7), [act("playerA", "the-gambler", HIGH_STAKES.id, ["dummy"])], [], deps())).state.characters.dummy?.currentHp;
    expect(run()).toBe(run());
  });

  it("Loaded Dice guarantees the jackpot on his next roll, then is spent", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      let state = expectOk(resolveTurn(battle(seed), [act("playerA", "the-gambler", LOADED_DICE.id, ["the-gambler"])], [], deps())).state;
      expect(state.characters["the-gambler"]?.pendingRngModifiers).toHaveLength(1);
      state = expectOk(resolveTurn(state, [act("playerA", "the-gambler", HIGH_STAKES.id, ["dummy"])], [], deps())).state;
      expect(500 - (state.characters.dummy?.currentHp ?? 0)).toBe(60);
      expect(state.characters["the-gambler"]?.pendingRngModifiers).toHaveLength(0);
    }
  });

  it("Cash Out spends 3 Chips for 50, and is a weak 10 without them", () => {
    const rich = expectOk(resolveTurn(battle(1, { "resource.chips": 3 }), [act("playerA", "the-gambler", CASH_OUT.id, ["dummy"])], [], deps()));
    expect(500 - (rich.state.characters.dummy?.currentHp ?? 0)).toBe(50);
    expect(rich.state.characters["the-gambler"]?.resources[CHIPS_RESOURCE.id]).toBe(0);
    const poor = expectOk(resolveTurn(battle(), [act("playerA", "the-gambler", CASH_OUT.id, ["dummy"])], [], deps()));
    expect(500 - (poor.state.characters.dummy?.currentHp ?? 0)).toBe(10);
  });

  it("Cold Deck is a plain Weakness application", () => {
    const r = expectOk(resolveTurn(battle(), [act("playerA", "the-gambler", COLD_DECK.id, ["dummy"])], [], deps()));
    expect(r.state.characters.dummy?.statuses.some((s) => s.statusId === "status.weakness")).toBe(true);
  });
});

describe("Baba Yaga", () => {
  it("her hut absorbs damage meant for her", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(BABA_YAGA)] },
      { playerId: "playerB", characters: [attacker] },
    );
    state = expectOk(resolveTurn(state, [act("playerA", "baba-yaga", HUT_ON_LEGS.id, ["baba-yaga"])], [], deps())).state;
    const r = expectOk(resolveTurn(state, [], [act("playerB", "attacker", hit30.id, ["baba-yaga"])], deps()));
    expect(r.state.characters["baba-yaga"]?.currentHp).toBe(BABA_YAGA.baseHp);
    expect(r.events.some((e) => e.type === "damageAbsorbedBySummon")).toBe(true);
  });

  it("Mortar Flight makes her untargetable next turn", () => {
    const state = expectOk(
      resolveTurn(
        freshScenarioBattle(
          { playerId: "playerA", characters: [member(BABA_YAGA)] },
          { playerId: "playerB", characters: [attacker] },
        ),
        [act("playerA", "baba-yaga", MORTAR_FLIGHT.id, ["baba-yaga"])],
        [],
        deps(),
      ),
    ).state;
    const errors = validateAction(state, act("playerB", "attacker", hit30.id, ["baba-yaga"]), deps().abilities);
    expect(errors.some((e) => e.code === "invalidTarget")).toBe(true);
  });

  it("Old Hunger heals her whenever an enemy dies", () => {
    const base = freshScenarioBattle(
      { playerId: "playerA", characters: [member(BABA_YAGA), { characterId: "killer", maxHp: 100, abilityIds: [lethal.id] }] },
      { playerId: "playerB", characters: [{ characterId: "prey", maxHp: 30 }, dummy(100)] },
    );
    const hurt = { ...base, characters: { ...base.characters, "baba-yaga": { ...base.characters["baba-yaga"]!, currentHp: 50 } } };
    const r = expectOk(resolveTurn(hurt, [act("playerA", "killer", lethal.id, ["prey"])], [], deps()));
    expect(r.state.characters.prey?.alive).toBe(false);
    expect(r.state.characters["baba-yaga"]?.currentHp).toBe(70);
  });
});

describe("Zeiron (Legend)", () => {
  const enemies = ["e1", "e2", "e3"].map((characterId) => ({ characterId, maxHp: 200 }));

  it("Wrath of the Unchained Sky hits every enemy for 70 — and costs a fortune", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(ZEIRON)] },
      { playerId: "playerB", characters: enemies },
    );
    const r = expectOk(resolveTurn(state, [act("playerA", "zeiron", WRATH_OF_THE_UNCHAINED_SKY.id)], [], deps()));
    for (const id of ["e1", "e2", "e3"]) expect(r.state.characters[id]?.currentHp).toBe(130);
    const cost = WRATH_OF_THE_UNCHAINED_SKY.cost;
    expect(cost.might + cost.focus + cost.spirit + cost.chaos + cost.neutral).toBeGreaterThanOrEqual(8);
    expect(WRATH_OF_THE_UNCHAINED_SKY.cooldown).toBeGreaterThanOrEqual(5);
  });

  it("Father Bell's Hush silences him, so he cannot act (a roster counter)", () => {
    let state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(ZEIRON)] },
      { playerId: "playerB", characters: [member(FATHER_BELL)] },
    );
    state = expectOk(resolveTurn(state, [], [act("playerB", "father-bell", HUSH.id, ["zeiron"])], deps())).state;
    const errors = validateAction(state, act("playerA", "zeiron", WRATH_OF_THE_UNCHAINED_SKY.id), ABILITY_LIBRARY);
    expect(errors.some((e) => e.code === "characterCannotAct")).toBe(true);
  });

  it("Broken Crown: below half HP each wound leaves him more exposed", () => {
    const base = freshScenarioBattle(
      { playerId: "playerA", characters: [member(ZEIRON)] },
      { playerId: "playerB", characters: [attacker] },
    );
    const weak = { ...base, characters: { ...base.characters, zeiron: { ...base.characters.zeiron!, currentHp: 60 } } };
    const r = expectOk(resolveTurn(weak, [], [act("playerB", "attacker", hit30.id, ["zeiron"])], deps()));
    expect(r.state.characters.zeiron?.statuses.some((s) => s.statusId === "status.damage-amplification")).toBe(true);
    const healthy = expectOk(resolveTurn(base, [], [act("playerB", "attacker", hit30.id, ["zeiron"])], deps()));
    expect(healthy.state.characters.zeiron?.statuses.some((s) => s.statusId === "status.damage-amplification")).toBe(false);
  });
});
