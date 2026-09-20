import { describe, expect, it } from "vitest";
import {
  BARK_SKIN,
  BIRCH_SWITCH,
  BITTER_COLD,
  BITTER_SAP,
  CINDER_STORM,
  COLD_WHISPER,
  CROWNS_COMMAND,
  DAWN_LIGHT,
  DOMOVOI,
  DROWNING_EMBRACE,
  EMBER_LASH,
  FATHER_FROST,
  FROZEN_GIFT,
  GLOWING_FEATHER,
  HEAVY_HAND,
  HIDE_IN_THE_STOVE,
  HORSE_CHARGE,
  HOUSEHOLD_MISCHIEF,
  ILL_OMEN,
  LEFT_HEAD,
  LESHY,
  LIKHO_EVIL_EYE,
  MARYA_THE_WARRIOR,
  MIDDLE_HEAD,
  ONE_EYED_LIKHO,
  ORB_OF_MIDNIGHT,
  PAPER_BARK_SHELL,
  RALLY,
  RESOURCE_LIBRARY,
  RIGHT_HEAD,
  ROAR_OF_THREE,
  ROOT_SNARE,
  RUSALKA,
  SABRE_CUT,
  SAP_DRAIN,
  SCEPTER_STRIKE,
  SHARED_MISFORTUNE,
  SONG_OF_THE_RIVER,
  STAFF_RAP,
  SWEEP_THE_FLOOR,
  THE_BIRCH_WITCH,
  THE_FIREBIRD,
  THE_MIDNIGHT_TSAR,
  THORN_VOLLEY,
  WANDERING_WOE,
  WARM_HEARTH,
  WILD_GROWTH,
  WILLOW_VEIL,
  WINTERS_JUDGEMENT,
  ZMEY_GORYNYCH,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 3 (Slavic / Russian Night): signature-mechanic tests.

function fixture(input: Partial<Ability> & Pick<Ability, "id" | "effects">): Ability {
  return abilitySchema.parse({
    displayName: input.id,
    description: "test fixture",
    cost: {},
    target: { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] },
    ...input,
  });
}
const hit30 = fixture({ id: "test.hit30", effects: [{ kind: "damage", amount: 30 }] });
const hit10 = fixture({ id: "test.hit10", effects: [{ kind: "damage", amount: 10 }] });
const lethal = fixture({ id: "test.lethal", effects: [{ kind: "damage", amount: 999 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [hit10.id]: hit10, [lethal.id]: lethal } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, hit10.id, lethal.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy(), seed = 1): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, seed);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const pool = (s: BattleState, player: string) => Object.values(s.energyPools[player] ?? {}).reduce((a, n) => a + n, 0);
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });
const ready = (s: BattleState, id: string): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, cooldowns: {} } } });

describe("Leshy — the wood grows", () => {
  it("gains a Growth every turn", () => {
    expect(res(turn(hero(LESHY), []), "leshy", "resource.growth")).toBe(1);
    expect(res(turn(turn(hero(LESHY), []), []), "leshy", "resource.growth")).toBe(2);
  });
  it("Root Snare stuns with a full thicket (spending it) and only weakens otherwise", () => {
    const grown = turn(hero(LESHY, { "resource.growth": 2 }), [act("playerA", "leshy", ROOT_SNARE.id, ["dummy"])]);
    expect(has(grown, "dummy", "status.stun")).toBe(true);
    expect(res(grown, "leshy", "resource.growth")).toBe(0);
    const young = turn(hero(LESHY, { "resource.growth": 0 }), [act("playerA", "leshy", ROOT_SNARE.id, ["dummy"])]);
    expect(has(young, "dummy", "status.stun")).toBe(false);
    expect(has(young, "dummy", "status.weakness")).toBe(true);
  });
  it("Thorn Volley poisons, Bark Skin armours, Wild Growth heals and grows", () => {
    const t = turn(hero(LESHY), [act("playerA", "leshy", THORN_VOLLEY.id, ["dummy"])]);
    expect(has(t, "dummy", "status.poison")).toBe(true);
    expect(has(turn(hero(LESHY), [act("playerA", "leshy", BARK_SKIN.id, ["leshy"])]), "leshy", "status.damage-reduction")).toBe(true);
    const w = turn(withHp(hero(LESHY, { "resource.growth": 0 }), "leshy", 100), [act("playerA", "leshy", WILD_GROWTH.id, ["leshy"])]);
    expect(hp(w, "leshy")).toBe(120);
    expect(res(w, "leshy", "resource.growth")).toBe(2); // +1 at turn start, +1 from the ability
  });
});

describe("Domovoi — the hearth", () => {
  const team = () =>
    freshScenarioBattle({ playerId: "playerA", characters: [member(DOMOVOI), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
  it("an ally who is hit gains a small shield, so a 30 hit costs them 20", () => {
    const s = turn(team(), [], [act("playerB", "attacker", hit30.id, ["friend"])]);
    expect(200 - hp(s, "friend")).toBeLessThanOrEqual(30);
    expect(has(s, "friend", "status.shield")).toBe(true);
  });
  it("Warm Hearth heals 20; Sweep the Floor takes an energy; Hide in the Stove hides; Mischief taxes", () => {
    expect(hp(turn(withHp(team(), "friend", 100), [act("playerA", "domovoi", WARM_HEARTH.id, ["friend"])]), "friend")).toBe(120);
    const start = hero(DOMOVOI);
    const control = turn(start, []);
    const swept = turn(start, [act("playerA", "domovoi", SWEEP_THE_FLOOR.id, ["dummy"])]);
    expect(pool(swept, "playerB")).toBe(pool(control, "playerB") - 1);
    expect(has(turn(hero(DOMOVOI), [act("playerA", "domovoi", HIDE_IN_THE_STOVE.id, ["domovoi"])]), "domovoi", "status.untargetable")).toBe(true);
    expect(has(turn(hero(DOMOVOI), [act("playerA", "domovoi", HOUSEHOLD_MISCHIEF.id, ["dummy"])]), "dummy", "status.energy-cost-increase")).toBe(true);
  });
});

describe("Rusalka — curse, then drink", () => {
  it("Cold Whisper curses", () => {
    const s = turn(hero(RUSALKA), [act("playerA", "rusalka", COLD_WHISPER.id, ["dummy"])]);
    expect(has(s, "dummy", "status.curse")).toBe(true);
  });
  it("Drowning Embrace is 20 on a clean enemy, and 40 (healing her 20) on a cursed one", () => {
    const clean = turn(hero(RUSALKA), [act("playerA", "rusalka", DROWNING_EMBRACE.id, ["dummy"])]);
    expect(500 - hp(clean, "dummy")).toBe(20);
    const cursed = turn(hero(RUSALKA), [act("playerA", "rusalka", COLD_WHISPER.id, ["dummy"])]);
    const woundedRusalka = withHp(ready(cursed, "rusalka"), "rusalka", 60);
    const s = turn(woundedRusalka, [act("playerA", "rusalka", DROWNING_EMBRACE.id, ["dummy"])]);
    expect(dmg(woundedRusalka, s, "dummy")).toBe(40);
    expect(hp(s, "rusalka")).toBe(80);
  });
  it("Willow Veil armours and heals; Song of the River hits and weakens all", () => {
    expect(has(turn(hero(RUSALKA), [act("playerA", "rusalka", WILLOW_VEIL.id, ["rusalka"])]), "rusalka", "status.damage-reduction")).toBe(true);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(RUSALKA)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "rusalka", SONG_OF_THE_RIVER.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(10);
    expect(has(s, "second", "status.weakness")).toBe(true);
  });
});

describe("Father Frost — the winter lord", () => {
  it("Frozen Gift shields an ally and strengthens healing on them", () => {
    const s = turn(hero(FATHER_FROST), [act("playerA", "father-frost", FROZEN_GIFT.id, ["father-frost"])]);
    expect(has(s, "father-frost", "status.shield") && has(s, "father-frost", "status.healing-amplification")).toBe(true);
  });
  it("Bitter Cold makes every enemy's next actions cost more", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(FATHER_FROST)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "father-frost", BITTER_COLD.id, [])]);
    expect(has(s, "dummy", "status.energy-cost-increase") && has(s, "second", "status.energy-cost-increase")).toBe(true);
  });
  it("Winter's Judgement: 20 and a weakness, then 30 and a stun on the weakened", () => {
    const first = turn(hero(FATHER_FROST), [act("playerA", "father-frost", WINTERS_JUDGEMENT.id, ["dummy"])]);
    expect(500 - hp(first, "dummy")).toBe(20);
    expect(has(first, "dummy", "status.weakness")).toBe(true);
    const again = ready(first, "father-frost");
    const second = turn(again, [act("playerA", "father-frost", WINTERS_JUDGEMENT.id, ["dummy"])]);
    expect(dmg(again, second, "dummy")).toBe(30);
    expect(has(second, "dummy", "status.stun")).toBe(true);
    expect(500 - hp(turn(hero(FATHER_FROST), [act("playerA", "father-frost", STAFF_RAP.id, ["dummy"])]), "dummy")).toBe(30);
  });
});

describe("The Birch Witch — bleed and drink", () => {
  it("Birch Switch bleeds; Bitter Sap poisons and cuts healing", () => {
    expect(has(turn(hero(THE_BIRCH_WITCH), [act("playerA", "the-birch-witch", BIRCH_SWITCH.id, ["dummy"])]), "dummy", "status.bleed")).toBe(true);
    const sap = turn(hero(THE_BIRCH_WITCH), [act("playerA", "the-birch-witch", BITTER_SAP.id, ["dummy"])]);
    expect(has(sap, "dummy", "status.poison") && has(sap, "dummy", "status.healing-reduction")).toBe(true);
  });
  it("Sap Drain is 10 on a clean enemy, and 30 with a 20 heal on a bleeding one", () => {
    const clean = turn(hero(THE_BIRCH_WITCH), [act("playerA", "the-birch-witch", SAP_DRAIN.id, ["dummy"])]);
    expect(500 - hp(clean, "dummy")).toBe(10);
    const bled = ready(turn(hero(THE_BIRCH_WITCH), [act("playerA", "the-birch-witch", BIRCH_SWITCH.id, ["dummy"])]), "the-birch-witch");
    const hurt = withHp(bled, "the-birch-witch", 60);
    const s = turn(hurt, [act("playerA", "the-birch-witch", SAP_DRAIN.id, ["dummy"])]);
    expect(hp(s, "the-birch-witch")).toBeGreaterThanOrEqual(80);
    expect(dmg(hurt, s, "dummy")).toBeGreaterThanOrEqual(30);
  });
  it("Paper Bark Shell shields her", () => {
    expect(has(turn(hero(THE_BIRCH_WITCH), [act("playerA", "the-birch-witch", PAPER_BARK_SHELL.id, ["the-birch-witch"])]), "the-birch-witch", "status.shield")).toBe(true);
  });
});

describe("Zmey Gorynych — three heads", () => {
  const strike = (s: BattleState, ...heads: string[]) => heads.reduce((b, h) => turn(b, [act("playerA", "zmey-gorynych", h, ["dummy"])]), s);
  const start = () => hero(ZMEY_GORYNYCH, undefined, dummy(800));
  it("each head does its own thing: fire, a crushing bite, venom", () => {
    expect(has(strike(start(), LEFT_HEAD.id), "dummy", "status.burn")).toBe(true);
    expect(800 - hp(strike(start(), MIDDLE_HEAD.id), "dummy")).toBe(30);
    expect(has(strike(start(), RIGHT_HEAD.id), "dummy", "status.poison")).toBe(true);
  });
  it("Roar of Three is 70 and a stun after Left, Middle, Right; only 30 otherwise", () => {
    const before = strike(start(), LEFT_HEAD.id, MIDDLE_HEAD.id, RIGHT_HEAD.id);
    const after = turn(before, [act("playerA", "zmey-gorynych", ROAR_OF_THREE.id, ["dummy"])]);
    expect(dmg(before, after, "dummy")).toBeGreaterThanOrEqual(70);
    expect(has(after, "dummy", "status.stun")).toBe(true);
    for (const order of [[], [MIDDLE_HEAD.id, LEFT_HEAD.id, RIGHT_HEAD.id], [LEFT_HEAD.id, MIDDLE_HEAD.id]]) {
      const b = strike(start(), ...order);
      const a = turn(b, [act("playerA", "zmey-gorynych", ROAR_OF_THREE.id, ["dummy"])]);
      expect(has(a, "dummy", "status.stun"), order.join()).toBe(false);
    }
  });
});

describe("The Firebird — rebirth, feathers and dawn", () => {
  const foe = { ...attacker };
  const duel = (resources = defaultResourcesFor(THE_FIREBIRD)) =>
    freshScenarioBattle({ playerId: "playerA", characters: [member(THE_FIREBIRD, { resources })] }, { playerId: "playerB", characters: [foe] });
  it("rises from her ashes once: a lethal blow leaves her alive at 30 health", () => {
    const s = turn(duel(), [], [act("playerB", "attacker", lethal.id, ["the-firebird"])]);
    expect(s.characters["the-firebird"]?.alive).toBe(true);
    expect(hp(s, "the-firebird")).toBe(30);
    expect(res(s, "the-firebird", "resource.rebirth")).toBe(0);
  });
  it("the second lethal blow kills her", () => {
    const first = turn(duel(), [], [act("playerB", "attacker", lethal.id, ["the-firebird"])]);
    const second = turn(first, [], [act("playerB", "attacker", lethal.id, ["the-firebird"])]);
    expect(second.characters["the-firebird"]?.alive).toBe(false);
  });
  it("without her charge a lethal blow kills at once", () => {
    const s = turn(duel({ "resource.rebirth": 0 }), [], [act("playerB", "attacker", lethal.id, ["the-firebird"])]);
    expect(s.characters["the-firebird"]?.alive).toBe(false);
  });
  it("Glowing Feather heals 20; Dawn Light clears harmful effects and heals 10", () => {
    const team = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_FIREBIRD), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [foe] });
    const burning = turn(withHp(team, "friend", 100), [], [act("playerB", "attacker", "test.hit10", ["friend"])]);
    expect(hp(turn(withHp(team, "friend", 100), [act("playerA", "the-firebird", GLOWING_FEATHER.id, ["friend"])]), "friend")).toBe(120);
    const poisoned = { ...burning, characters: { ...burning.characters, friend: { ...burning.characters.friend!, statuses: [{ statusId: "status.poison", remainingTurns: 3, stacks: 1, magnitude: 5, sourceId: "attacker" }] } } } as unknown as BattleState;
    const cleansed = turn(poisoned, [act("playerA", "the-firebird", DAWN_LIGHT.id, ["friend"])]);
    expect(has(cleansed, "friend", "status.poison")).toBe(false);
  });
  it("Ember Lash burns; Cinder Storm hits everyone for 10", () => {
    expect(has(turn(hero(THE_FIREBIRD), [act("playerA", "the-firebird", EMBER_LASH.id, ["dummy"])]), "dummy", "status.burn")).toBe(true);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_FIREBIRD)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "the-firebird", CINDER_STORM.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(10);
    expect(dmg(state, s, "second")).toBe(10);
  });
});

describe("One-Eyed Likho — misfortune", () => {
  it("Evil Eye curses and weakens; Ill Omen taxes and slows", () => {
    const e = turn(hero(ONE_EYED_LIKHO), [act("playerA", "one-eyed-likho", LIKHO_EVIL_EYE.id, ["dummy"])]);
    expect(has(e, "dummy", "status.curse") && has(e, "dummy", "status.weakness")).toBe(true);
    const o = turn(hero(ONE_EYED_LIKHO), [act("playerA", "one-eyed-likho", ILL_OMEN.id, ["dummy"])]);
    expect(has(o, "dummy", "status.energy-cost-increase") && has(o, "dummy", "status.cooldown-increase")).toBe(true);
  });
  it("Wandering Woe is 10, 30 or 50, and the same seed always rolls the same", () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const run = () => 500 - hp(turn(hero(ONE_EYED_LIKHO, undefined, dummy(), seed), [act("playerA", "one-eyed-likho", WANDERING_WOE.id, ["dummy"])]), "dummy");
      const d = run();
      expect(d).toBe(run());
      seen.add(d);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([10, 30, 50]);
  });
  it("Shared Misfortune does nothing to a clean enemy; on a cursed one it is 50 and costs her 20", () => {
    const clean = turn(hero(ONE_EYED_LIKHO), [act("playerA", "one-eyed-likho", SHARED_MISFORTUNE.id, ["dummy"])]);
    expect(500 - hp(clean, "dummy")).toBe(0);
    const cursed = ready(turn(hero(ONE_EYED_LIKHO), [act("playerA", "one-eyed-likho", LIKHO_EVIL_EYE.id, ["dummy"])]), "one-eyed-likho");
    const s = turn(cursed, [act("playerA", "one-eyed-likho", SHARED_MISFORTUNE.id, ["dummy"])]);
    expect(dmg(cursed, s, "dummy")).toBe(50);
    expect(hp(cursed, "one-eyed-likho") - hp(s, "one-eyed-likho")).toBe(20);
  });
});

describe("Marya the Warrior — rally, then charge", () => {
  it("Horse Charge is 30, or 50 right after Rally", () => {
    expect(500 - hp(turn(hero(MARYA_THE_WARRIOR), [act("playerA", "marya-the-warrior", HORSE_CHARGE.id, ["dummy"])]), "dummy")).toBe(30);
    const rallied = turn(hero(MARYA_THE_WARRIOR), [act("playerA", "marya-the-warrior", RALLY.id, ["marya-the-warrior"])]);
    const charged = turn(rallied, [act("playerA", "marya-the-warrior", HORSE_CHARGE.id, ["dummy"])]);
    expect(dmg(rallied, charged, "dummy")).toBe(50);
  });
  it("Hold the Line draws attacks and bites back", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MARYA_THE_WARRIOR)] }, { playerId: "playerB", characters: [attacker] });
    const held = turn(state, [act("playerA", "marya-the-warrior", "ability.marya-the-warrior.hold-the-line", ["marya-the-warrior"])]);
    expect(has(held, "marya-the-warrior", "status.taunt")).toBe(true);
    const s = turn(held, [], [act("playerB", "attacker", hit10.id, ["marya-the-warrior"])]);
    expect(dmg(held, s, "attacker")).toBe(20);
    expect(500 - hp(turn(hero(MARYA_THE_WARRIOR), [act("playerA", "marya-the-warrior", SABRE_CUT.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The Midnight Tsar [SECRET] — regalia", () => {
  it("every landed blow recovers a Relic (up to three)", () => {
    const s = turn(hero(THE_MIDNIGHT_TSAR), [act("playerA", "the-midnight-tsar", HEAVY_HAND.id, ["dummy"])]);
    expect(res(s, "the-midnight-tsar", "resource.relics")).toBe(1);
    expect(500 - hp(s, "dummy")).toBe(20);
  });
  it("Crown's Command stuns by spending a Relic, and does nothing without one", () => {
    const paid = turn(hero(THE_MIDNIGHT_TSAR, { "resource.relics": 1 }), [act("playerA", "the-midnight-tsar", CROWNS_COMMAND.id, ["dummy"])]);
    expect(has(paid, "dummy", "status.stun")).toBe(true);
    expect(res(paid, "the-midnight-tsar", "resource.relics")).toBe(0);
    expect(has(turn(hero(THE_MIDNIGHT_TSAR), [act("playerA", "the-midnight-tsar", CROWNS_COMMAND.id, ["dummy"])]), "dummy", "status.stun")).toBe(false);
  });
  it("Scepter Strike is 60 with two Relics (spent), 20 otherwise", () => {
    const paid = turn(hero(THE_MIDNIGHT_TSAR, { "resource.relics": 2 }), [act("playerA", "the-midnight-tsar", SCEPTER_STRIKE.id, ["dummy"])]);
    expect(500 - hp(paid, "dummy")).toBe(60);
    expect(res(paid, "the-midnight-tsar", "resource.relics")).toBe(1); // spent two, recovered one for the blow
    expect(500 - hp(turn(hero(THE_MIDNIGHT_TSAR), [act("playerA", "the-midnight-tsar", SCEPTER_STRIKE.id, ["dummy"])]), "dummy")).toBe(20);
  });
  it("Orb of Midnight needs all three Relics: 30 and a curse on every enemy", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_MIDNIGHT_TSAR, { resources: { "resource.relics": 3 } })] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "the-midnight-tsar", ORB_OF_MIDNIGHT.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(30);
    expect(has(s, "second", "status.curse")).toBe(true);
    const poor = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_MIDNIGHT_TSAR, { resources: { "resource.relics": 2 } })] }, { playerId: "playerB", characters: [dummy(300)] });
    expect(dmg(poor, turn(poor, [act("playerA", "the-midnight-tsar", ORB_OF_MIDNIGHT.id, [])]), "dummy")).toBe(0);
  });
});
