import { describe, expect, it } from "vitest";
import {
  AXE_FLURRY,
  BANSHEE,
  BARROW_MOUND,
  BATTLE_CRY,
  BLOOD_RAGE,
  CARRION_CALL,
  CHOSEN_RESOURCE,
  COVER_AN_ALLY,
  DEATHS_PORTENT,
  DEATHS_SUMMONS,
  DRAUGR,
  FENRIS,
  FROST_JOTUNN,
  GLACIER_SLAM,
  GRAVE_CHILL,
  HEADLESS_CHARGE,
  HOUNDS_BITE,
  HOWL_OF_THE_BOUND,
  ICE_CLUB,
  LEAD_ASTRAY,
  MARK_OF_THE_CROWS,
  MORRIGAN,
  MOTHERS_WARD,
  PUCA,
  RAGNAROK_BITE,
  RECKLESS_SWING,
  RESOURCE_LIBRARY,
  RIDE_DOWN,
  RUSTED_AXE,
  SHIELDMAIDEN_YRSA,
  SHIELD_BASH,
  SHIELD_WALL,
  SHIFT_SHAPE,
  SNAP,
  SOUND_THE_HORN,
  SPEAR_CAST,
  SPEAR_THRUST,
  STORM_OF_CROWS,
  STRAIN_AT_THE_CHAIN,
  THE_BERSERKER,
  THE_DULLAHAN,
  THE_FIREBIRD,
  THE_KEEN,
  THE_VALKYRIE,
  THE_WILD_HUNTSMAN,
  WAIL,
  WAR_HOWL,
  WHIP_OF_BONE,
  WIGHTS_GRIP,
  WINGED_DESCENT,
  WINTERS_LOCK,
  DAWN_LIGHT,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, validateAction, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 4 (Northern / Celtic): signature-mechanic tests, including
// Morrigan's prophecy and the counters her design note names.

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
const hit60 = fixture({ id: "test.hit60", effects: [{ kind: "damage", amount: 60 }] });
const lethal = fixture({ id: "test.lethal", effects: [{ kind: "damage", amount: 999 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [hit10.id]: hit10, [hit60.id]: hit60, [lethal.id]: lethal } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, hit10.id, hit60.id, lethal.id] };
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

describe("Draugr — the barrow feeds", () => {
  it("heals 10 whenever an enemy falls", () => {
    const killer = { characterId: "killer", maxHp: 100, abilityIds: [lethal.id] };
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(DRAUGR), killer] }, { playerId: "playerB", characters: [dummy(20)] });
    const s = turn(withHp(state, "draugr", 100), [act("playerA", "killer", lethal.id, ["dummy"])]);
    expect(s.characters.dummy?.alive).toBe(false);
    expect(hp(s, "draugr")).toBe(110);
  });
  it("Rusted Axe bleeds, Grave Chill cuts healing, Barrow Mound armours, Wight's Grip stuns", () => {
    expect(has(turn(hero(DRAUGR), [act("playerA", "draugr", RUSTED_AXE.id, ["dummy"])]), "dummy", "status.bleed")).toBe(true);
    expect(has(turn(hero(DRAUGR), [act("playerA", "draugr", GRAVE_CHILL.id, ["dummy"])]), "dummy", "status.healing-reduction")).toBe(true);
    expect(has(turn(hero(DRAUGR), [act("playerA", "draugr", BARROW_MOUND.id, ["draugr"])]), "draugr", "status.damage-reduction")).toBe(true);
    const grip = turn(hero(DRAUGR), [act("playerA", "draugr", WIGHTS_GRIP.id, ["dummy"])]);
    expect(500 - hp(grip, "dummy")).toBe(30);
    expect(has(grip, "dummy", "status.stun")).toBe(true);
  });
});

describe("Shieldmaiden Yrsa — wall, then bash", () => {
  it("Shield Bash is 20, or 30 and a stun right after Shield Wall", () => {
    expect(500 - hp(turn(hero(SHIELDMAIDEN_YRSA), [act("playerA", "shieldmaiden-yrsa", SHIELD_BASH.id, ["dummy"])]), "dummy")).toBe(20);
    const walled = turn(hero(SHIELDMAIDEN_YRSA), [act("playerA", "shieldmaiden-yrsa", SHIELD_WALL.id, ["shieldmaiden-yrsa"])]);
    expect(has(walled, "shieldmaiden-yrsa", "status.taunt")).toBe(true);
    const bashed = turn(walled, [act("playerA", "shieldmaiden-yrsa", SHIELD_BASH.id, ["dummy"])]);
    expect(dmg(walled, bashed, "dummy")).toBe(30);
    expect(has(bashed, "dummy", "status.stun")).toBe(true);
  });
  it("Cover an Ally shields a friend; Spear Thrust is 20", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(SHIELDMAIDEN_YRSA), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [dummy()] });
    expect(has(turn(state, [act("playerA", "shieldmaiden-yrsa", COVER_AN_ALLY.id, ["friend"])]), "friend", "status.shield")).toBe(true);
    expect(500 - hp(turn(hero(SHIELDMAIDEN_YRSA), [act("playerA", "shieldmaiden-yrsa", SPEAR_THRUST.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The Berserker — pain into fury", () => {
  const duel = () => freshScenarioBattle({ playerId: "playerA", characters: [member(THE_BERSERKER)] }, { playerId: "playerB", characters: [attacker] });
  it("each wound gives a Rage", () => {
    const s = turn(duel(), [], [act("playerB", "attacker", hit10.id, ["the-berserker"])]);
    expect(res(s, "the-berserker", "resource.rage")).toBe(1);
  });
  it("Reckless Swing is 50 damage and costs him 20 health (which itself feeds Rage)", () => {
    const s = turn(hero(THE_BERSERKER), [act("playerA", "the-berserker", RECKLESS_SWING.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(50);
    expect(THE_BERSERKER.baseHp - hp(s, "the-berserker")).toBe(20);
    expect(res(s, "the-berserker", "resource.rage")).toBe(1);
  });
  it("Blood Rage heals 40 with three Rage (spent), 10 otherwise; Axe Flurry is two hits", () => {
    const wounded = (r: number) => withHp(hero(THE_BERSERKER, { "resource.rage": r }), "the-berserker", 60);
    const full = turn(wounded(3), [act("playerA", "the-berserker", BLOOD_RAGE.id, ["the-berserker"])]);
    expect(hp(full, "the-berserker")).toBe(100);
    expect(res(full, "the-berserker", "resource.rage")).toBe(0);
    expect(hp(turn(wounded(0), [act("playerA", "the-berserker", BLOOD_RAGE.id, ["the-berserker"])]), "the-berserker")).toBe(70);
    expect(500 - hp(turn(hero(THE_BERSERKER), [act("playerA", "the-berserker", AXE_FLURRY.id, ["dummy"])]), "dummy")).toBe(20);
  });
  it("War Howl frightens and weakens everyone with two Rage, and only hurts otherwise", () => {
    const rich = turn(hero(THE_BERSERKER, { "resource.rage": 2 }), [act("playerA", "the-berserker", WAR_HOWL.id, [])]);
    expect(has(rich, "dummy", "status.fear") && has(rich, "dummy", "status.weakness")).toBe(true);
    expect(500 - hp(turn(hero(THE_BERSERKER), [act("playerA", "the-berserker", WAR_HOWL.id, [])]), "dummy")).toBe(10);
  });
});

describe("Banshee — grief feeds her", () => {
  it("every death gives her team 1 Chaos", () => {
    const withPassive = freshScenarioBattle({ playerId: "playerA", characters: [member(BANSHEE), { characterId: "friend", maxHp: 20, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
    const without = freshScenarioBattle({ playerId: "playerA", characters: [member(BANSHEE, { passiveId: undefined }), { characterId: "friend", maxHp: 20, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
    const kill = [act("playerB", "attacker", lethal.id, ["friend"])];
    expect(pool(turn(withPassive, [], kill), "playerA")).toBe(pool(turn(without, [], kill), "playerA") + 1);
  });
  it("Wail frightens everyone, Death's Portent curses, The Keen silences, Mourning Veil shelters", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(BANSHEE)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const w = turn(state, [act("playerA", "banshee", WAIL.id, [])]);
    expect(has(w, "dummy", "status.fear") && has(w, "second", "status.fear")).toBe(true);
    expect(dmg(state, w, "dummy")).toBe(10);
    expect(has(turn(hero(BANSHEE), [act("playerA", "banshee", DEATHS_PORTENT.id, ["dummy"])]), "dummy", "status.curse")).toBe(true);
    expect(has(turn(hero(BANSHEE), [act("playerA", "banshee", THE_KEEN.id, ["dummy"])]), "dummy", "status.silence")).toBe(true);
    expect(has(turn(hero(BANSHEE), [act("playerA", "banshee", "ability.banshee.mourning-veil", ["banshee"])]), "banshee", "status.damage-reduction")).toBe(true);
  });
});

describe("The Dullahan — the summons and the finish", () => {
  it("Headless Charge is 40, and 100 against an enemy below 30% health", () => {
    expect(500 - hp(turn(hero(THE_DULLAHAN), [act("playerA", "the-dullahan", HEADLESS_CHARGE.id, ["dummy"])]), "dummy")).toBe(40);
    const low = withHp(hero(THE_DULLAHAN), "dummy", 140); // 28%
    expect(dmg(low, turn(low, [act("playerA", "the-dullahan", HEADLESS_CHARGE.id, ["dummy"])]), "dummy")).toBe(100);
    const edge = withHp(hero(THE_DULLAHAN), "dummy", 150); // exactly 30%: not below
    expect(dmg(edge, turn(edge, [act("playerA", "the-dullahan", HEADLESS_CHARGE.id, ["dummy"])]), "dummy")).toBe(40);
  });
  it("Death's Summons curses and frightens; Whip of Bone bleeds; Dead Man's Road hides him", () => {
    const s = turn(hero(THE_DULLAHAN), [act("playerA", "the-dullahan", DEATHS_SUMMONS.id, ["dummy"])]);
    expect(has(s, "dummy", "status.curse") && has(s, "dummy", "status.fear")).toBe(true);
    expect(has(turn(hero(THE_DULLAHAN), [act("playerA", "the-dullahan", WHIP_OF_BONE.id, ["dummy"])]), "dummy", "status.bleed")).toBe(true);
    expect(has(turn(hero(THE_DULLAHAN), [act("playerA", "the-dullahan", "ability.the-dullahan.dead-mans-road", ["the-dullahan"])]), "the-dullahan", "status.untargetable")).toBe(true);
  });
});

describe("Púca — a different shape every time", () => {
  it("Shift Shape gives exactly one of three tricks, the same seed always the same, and all three occur", () => {
    const tricks = ["status.damage-reduction", "status.untargetable", "heal"];
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const run = () => {
        const start = withHp(hero(PUCA, undefined, dummy(), seed), "puca", 60);
        const s = turn(start, [act("playerA", "puca", SHIFT_SHAPE.id, ["puca"])]);
        return has(s, "puca", "status.damage-reduction") ? tricks[0]! : has(s, "puca", "status.untargetable") ? tricks[1]! : hp(s, "puca") === 80 ? tricks[2]! : "none";
      };
      const outcome = run();
      expect(outcome).not.toBe("none");
      expect(run()).toBe(outcome);
      seen.add(outcome);
    }
    expect(seen.size).toBe(3);
  });
  it("Lead Astray sends an enemy's attack at the Púca instead of his ally", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(PUCA), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
    const s = turn(state, [act("playerA", "puca", LEAD_ASTRAY.id, ["attacker"])], [act("playerB", "attacker", hit60.id, ["friend"])]);
    expect(hp(s, "friend")).toBe(200);
    expect(PUCA.baseHp - hp(s, "puca")).toBe(60);
  });
});

describe("Frost Jötunn — Winter's Lock", () => {
  it("locks an energy family: the enemy cannot use any Might ability for two turns, but can use others", () => {
    const foe = { characterId: "brute", maxHp: 400, abilityIds: ["ability.the-berserker.axe-flurry", "ability.the-berserker.war-howl"] };
    const locked = turn(hero(FROST_JOTUNN, undefined, foe), [act("playerA", "frost-jotunn", WINTERS_LOCK.id, ["brute"])]);
    expect(has(locked, "brute", "status.energy-lock")).toBe(true);
    const blocked = validateAction(locked, act("playerB", "brute", "ability.the-berserker.axe-flurry", ["frost-jotunn"]), deps().abilities);
    expect(blocked.length).toBeGreaterThan(0); // Axe Flurry costs Might
    const allowed = validateAction(locked, act("playerB", "brute", "ability.the-berserker.war-howl", []), deps().abilities);
    expect(allowed).toEqual([]); // War Howl costs Chaos
  });
  it("Ice Club is 30, Glacier Slam 20 to all, Hoarfrost Skin armours", () => {
    expect(500 - hp(turn(hero(FROST_JOTUNN), [act("playerA", "frost-jotunn", ICE_CLUB.id, ["dummy"])]), "dummy")).toBe(30);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(FROST_JOTUNN)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "frost-jotunn", GLACIER_SLAM.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(20);
    expect(dmg(state, s, "second")).toBe(20);
    expect(has(turn(hero(FROST_JOTUNN), [act("playerA", "frost-jotunn", "ability.frost-jotunn.hoarfrost-skin", ["frost-jotunn"])]), "frost-jotunn", "status.damage-reduction")).toBe(true);
  });
});

describe("The Valkyrie — the chooser of the slain", () => {
  const team = (resources = defaultResourcesFor(THE_VALKYRIE)) =>
    freshScenarioBattle({ playerId: "playerA", characters: [member(THE_VALKYRIE, { resources }), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
  it("an ally who would fall is lifted back to 20 health, once", () => {
    const s = turn(team(), [], [act("playerB", "attacker", lethal.id, ["friend"])]);
    expect(s.characters.friend?.alive).toBe(true);
    expect(hp(s, "friend")).toBe(20);
    expect(res(s, "the-valkyrie", CHOSEN_RESOURCE.id)).toBe(0);
    const again = turn(s, [], [act("playerB", "attacker", lethal.id, ["friend"])]);
    expect(again.characters.friend?.alive).toBe(false);
  });
  it("does not save herself, and does nothing without her charge", () => {
    expect(turn(team(), [], [act("playerB", "attacker", lethal.id, ["the-valkyrie"])]).characters["the-valkyrie"]?.alive).toBe(false);
    expect(turn(team({ "resource.chosen": 0 }), [], [act("playerB", "attacker", lethal.id, ["friend"])]).characters.friend?.alive).toBe(false);
  });
  it("Winged Descent hits and puts her out of reach; Spear Cast is 30; Battle Cry heals", () => {
    const s = turn(hero(THE_VALKYRIE), [act("playerA", "the-valkyrie", WINGED_DESCENT.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(20);
    expect(has(s, "the-valkyrie", "status.untargetable")).toBe(true);
    expect(has(s, "dummy", "status.untargetable")).toBe(false);
    expect(500 - hp(turn(hero(THE_VALKYRIE), [act("playerA", "the-valkyrie", SPEAR_CAST.id, ["dummy"])]), "dummy")).toBe(30);
    expect(hp(turn(withHp(hero(THE_VALKYRIE), "the-valkyrie", 60), [act("playerA", "the-valkyrie", BATTLE_CRY.id, ["the-valkyrie"])]), "the-valkyrie")).toBe(80);
  });
});

describe("Fenris — the chain", () => {
  it("each wound breaks a link", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(FENRIS)] }, { playerId: "playerB", characters: [attacker] });
    const s = turn(state, [], [act("playerB", "attacker", hit10.id, ["fenris"])]);
    expect(res(s, "fenris", "resource.chains")).toBe(2);
  });
  it("Ragnarök Bite is 30 while bound and 70 with no links left", () => {
    expect(500 - hp(turn(hero(FENRIS), [act("playerA", "fenris", RAGNAROK_BITE.id, ["dummy"])]), "dummy")).toBe(30);
    expect(500 - hp(turn(hero(FENRIS, { "resource.chains": 0 }), [act("playerA", "fenris", RAGNAROK_BITE.id, ["dummy"])]), "dummy")).toBe(70);
  });
  it("Strain at the Chain costs 10 health for a link (and the wound breaks another), Snap is 20, Howl weakens", () => {
    const s = turn(hero(FENRIS), [act("playerA", "fenris", STRAIN_AT_THE_CHAIN.id, ["fenris"])]);
    expect(FENRIS.baseHp - hp(s, "fenris")).toBe(10);
    expect(res(s, "fenris", "resource.chains")).toBeLessThanOrEqual(1);
    expect(500 - hp(turn(hero(FENRIS), [act("playerA", "fenris", SNAP.id, ["dummy"])]), "dummy")).toBe(20);
    expect(has(turn(hero(FENRIS), [act("playerA", "fenris", HOWL_OF_THE_BOUND.id, [])]), "dummy", "status.weakness")).toBe(true);
  });
});

describe("The Wild Huntsman [SECRET] — the quarry", () => {
  it("Hound's Bite is 20, or 50 against the Marked", () => {
    expect(500 - hp(turn(hero(THE_WILD_HUNTSMAN), [act("playerA", "the-wild-huntsman", HOUNDS_BITE.id, ["dummy"])]), "dummy")).toBe(20);
    const marked = turn(hero(THE_WILD_HUNTSMAN), [act("playerA", "the-wild-huntsman", SOUND_THE_HORN.id, ["dummy"])]);
    expect(has(marked, "dummy", "status.mark")).toBe(true);
    expect(dmg(marked, turn(marked, [act("playerA", "the-wild-huntsman", HOUNDS_BITE.id, ["dummy"])]), "dummy")).toBe(50);
  });
  it("Ride Down stuns only the Marked; Storm Ride hides him", () => {
    const plain = turn(hero(THE_WILD_HUNTSMAN), [act("playerA", "the-wild-huntsman", RIDE_DOWN.id, ["dummy"])]);
    expect(500 - hp(plain, "dummy")).toBe(30);
    expect(has(plain, "dummy", "status.stun")).toBe(false);
    const marked = turn(hero(THE_WILD_HUNTSMAN), [act("playerA", "the-wild-huntsman", SOUND_THE_HORN.id, ["dummy"])]);
    expect(has(turn(ready(marked, "the-wild-huntsman"), [act("playerA", "the-wild-huntsman", RIDE_DOWN.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
    expect(has(turn(hero(THE_WILD_HUNTSMAN), [act("playerA", "the-wild-huntsman", "ability.the-wild-huntsman.storm-ride", ["the-wild-huntsman"])]), "the-wild-huntsman", "status.untargetable")).toBe(true);
  });
});

describe("Morrigan (Legend) — the Prophecy of Ruin, and how to escape it", () => {
  const duel = (foe: CreateBattleTeamInput["characters"][number] = dummy(), seed = 1) => hero(MORRIGAN, undefined, foe, seed);
  it("marks an enemy for 3 turns", () => {
    expect(has(turn(duel(), [act("playerA", "morrigan", MARK_OF_THE_CROWS.id, ["dummy"])]), "dummy", "status.crow-prophecy")).toBe(true);
  });
  it("comes true for 60 if the enemy ends a turn below half health, and is consumed", () => {
    const marked = turn(duel(dummy(200)), [act("playerA", "morrigan", MARK_OF_THE_CROWS.id, ["dummy"])]);
    const wounded = withHp(marked, "dummy", 90); // below half of 200
    const s = turn(wounded, []);
    expect(dmg(wounded, s, "dummy")).toBe(60);
    expect(has(s, "dummy", "status.crow-prophecy")).toBe(false);
  });
  it("a healthy enemy escapes it: nothing happens and it simply expires", () => {
    const marked = turn(duel(dummy(200)), [act("playerA", "morrigan", MARK_OF_THE_CROWS.id, ["dummy"])]);
    const s = turn(turn(turn(turn(marked, []), []), []), []);
    expect(hp(s, "dummy")).toBe(200);
    expect(has(s, "dummy", "status.crow-prophecy")).toBe(false);
  });
  it("COUNTER: staying above half by healing escapes it", () => {
    const foe = { characterId: "healer", maxHp: 200, abilityIds: [BATTLE_CRY.id] };
    const marked = turn(duel(foe), [act("playerA", "morrigan", MARK_OF_THE_CROWS.id, ["healer"])]);
    const wounded = withHp(marked, "healer", 90);
    const healed = turn(wounded, [], [act("playerB", "healer", BATTLE_CRY.id, ["healer"])]);
    expect(hp(healed, "healer")).toBeGreaterThanOrEqual(100); // back to half: the prophecy does not fire
    expect(has(healed, "healer", "status.crow-prophecy")).toBe(true);
  });
  it("COUNTER: The Firebird's Dawn Light burns the prophecy off an ally", () => {
    const team = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_FIREBIRD), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [member(MORRIGAN)] });
    const marked = turn(team, [], [act("playerB", "morrigan", MARK_OF_THE_CROWS.id, ["friend"])]);
    expect(has(marked, "friend", "status.crow-prophecy")).toBe(true);
    const cleansed = turn(marked, [act("playerA", "the-firebird", DAWN_LIGHT.id, ["friend"])]);
    expect(has(cleansed, "friend", "status.crow-prophecy")).toBe(false);
  });
  it("Carrion Call is 40, or 60 on a prophesied enemy; Mother's Ward shields", () => {
    expect(500 - hp(turn(duel(), [act("playerA", "morrigan", CARRION_CALL.id, ["dummy"])]), "dummy")).toBe(40);
    const marked = turn(duel(), [act("playerA", "morrigan", MARK_OF_THE_CROWS.id, ["dummy"])]);
    expect(dmg(marked, turn(marked, [act("playerA", "morrigan", CARRION_CALL.id, ["dummy"])]), "dummy")).toBe(60);
    expect(has(turn(duel(), [act("playerA", "morrigan", MOTHERS_WARD.id, ["morrigan"])]), "morrigan", "status.shield")).toBe(true);
  });
  it("Storm of Crows is 40 to everyone with a prophecy on each, and costs a great deal (Legend lever)", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MORRIGAN)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "morrigan", STORM_OF_CROWS.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(40);
    expect(has(s, "second", "status.crow-prophecy")).toBe(true);
    expect(STORM_OF_CROWS.cooldown).toBeGreaterThanOrEqual(5);
    expect(Object.values(STORM_OF_CROWS.cost).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(6);
  });
  it("her vulnerability: below half health every wound leaves her more exposed", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MORRIGAN)] }, { playerId: "playerB", characters: [attacker] });
    const s = turn(withHp(state, "morrigan", 50), [], [act("playerB", "attacker", hit10.id, ["morrigan"])]);
    expect(has(s, "morrigan", "status.damage-amplification")).toBe(true);
    expect(has(turn(state, [], [act("playerB", "attacker", hit10.id, ["morrigan"])]), "morrigan", "status.damage-amplification")).toBe(false);
  });
});
