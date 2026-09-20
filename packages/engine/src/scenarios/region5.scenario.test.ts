import { describe, expect, it } from "vitest";
import {
  AMBUSH,
  ANUBIAN_JUDGE,
  AURELIA,
  BALANCE_THE_SCALES,
  BIND_IN_LINEN,
  CALL_THE_SWARM,
  CARAPACE,
  CHITIN_BITE,
  DESERT_DJINN,
  DUST_BLADE,
  ENTOMB,
  FATHER_BELL,
  FEATHER_STRIKE,
  FINAL_STROKE,
  FLAME_LASH,
  GRANT_A_WISH,
  GRAVE_DUST,
  HUSH,
  IFRIT,
  IFRIT_CINDER_STORM,
  JACKAL_GUARDIAN,
  KHOPESH_SLASH,
  LID_CLOSED,
  LID_SLAM,
  LIONS_CLAW,
  MOLTEN_FURY,
  PATIENT_STONE,
  PHARAOH_SCEPTER_STRIKE,
  PHARAOH_WITHOUT_A_TOMB,
  POISON_KRIS,
  POUNCE,
  PRESERVED_BY_SALT,
  RADIANT_LANCE,
  RAISE_THE_GUARD,
  RESOURCE_LIBRARY,
  RIDDLE_OF_THREE_AGES,
  ROYAL_CURSE,
  ROYAL_DECREE,
  ROYAL_TRIBUTE,
  SANDSTORM,
  SAND_ASSASSIN,
  SCARAB_KING,
  SCARAB_TIDE,
  SENTINELS_HOWL,
  SHIFTING_DUNE,
  SHIRO,
  SOLAR_MEND,
  STONE_SILENCE,
  SUNS_VIGIL,
  SWARM_RESOURCE,
  THE_LIVING_SARCOPHAGUS,
  THE_MUMMY_PRINCE,
  THE_SPHINX,
  TOMB_WARD,
  TWISTED_WISH,
  VERDICT_OF_MAAT,
  WEIGH_THE_HEART,
  WRAPPED_FIST,
  ZENITH_AEGIS,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 5 (Egypt / Desert / Ancient Kingdoms): signature-mechanic
// tests, including Aurelia's Sun Guard and the counters her note names.

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
const poisonHit = fixture({ id: "test.poison", effects: [{ kind: "applyStatus", statusId: "status.poison", magnitude: 30, durationTurns: 3 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [hit10.id]: hit10, [lethal.id]: lethal, [poisonHit.id]: poisonHit } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, hit10.id, lethal.id, poisonHit.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy(), seed = 1): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, seed);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });

describe("Jackal Guardian — the sentinel", () => {
  it("Tomb Ward strikes back for 20 when hit", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(JACKAL_GUARDIAN)] }, { playerId: "playerB", characters: [attacker] });
    const warded = turn(state, [act("playerA", "jackal-guardian", TOMB_WARD.id, ["jackal-guardian"])]);
    expect(has(warded, "jackal-guardian", "status.counter")).toBe(true);
    const struck = turn(warded, [], [act("playerB", "attacker", hit30.id, ["jackal-guardian"])]);
    expect(dmg(warded, struck, "attacker")).toBe(20);
  });
  it("Khopesh Slash is 20; Sentinel's Howl weakens; Pounce is 30 and bleeds", () => {
    expect(500 - hp(turn(hero(JACKAL_GUARDIAN), [act("playerA", "jackal-guardian", KHOPESH_SLASH.id, ["dummy"])]), "dummy")).toBe(20);
    expect(has(turn(hero(JACKAL_GUARDIAN), [act("playerA", "jackal-guardian", SENTINELS_HOWL.id, ["dummy"])]), "dummy", "status.weakness")).toBe(true);
    const pounce = turn(hero(JACKAL_GUARDIAN), [act("playerA", "jackal-guardian", POUNCE.id, ["dummy"])]);
    expect(has(pounce, "dummy", "status.bleed")).toBe(true);
    expect(500 - hp(pounce, "dummy")).toBeGreaterThanOrEqual(30);
  });
});

describe("The Scarab King — the swarm feeds", () => {
  it("every ability he uses adds a Swarm", () => {
    const s = turn(hero(SCARAB_KING), [act("playerA", "scarab-king", CHITIN_BITE.id, ["dummy"])]);
    expect(res(s, "scarab-king", SWARM_RESOURCE.id)).toBe(1);
  });
  it("Scarab Tide is 30, or 60 with 3 Swarm, which it spends", () => {
    expect(500 - hp(turn(hero(SCARAB_KING), [act("playerA", "scarab-king", SCARAB_TIDE.id, ["dummy"])]), "dummy")).toBe(30);
    const full = turn(hero(SCARAB_KING, { [SWARM_RESOURCE.id]: 3 }), [act("playerA", "scarab-king", SCARAB_TIDE.id, ["dummy"])]);
    expect(500 - hp(full, "dummy")).toBe(60);
    expect(res(full, "scarab-king", SWARM_RESOURCE.id)).toBe(1); // 3 spent, +1 for using an ability
  });
  it("Call the Swarm summons a scarab swarm; Carapace armours", () => {
    const s = turn(hero(SCARAB_KING), [act("playerA", "scarab-king", CALL_THE_SWARM.id, ["scarab-king"])]);
    expect(Object.values(s.summons).some((x) => x.summonId === "summon.scarab-king.scarab-swarm")).toBe(true);
    expect(has(turn(hero(SCARAB_KING), [act("playerA", "scarab-king", CARAPACE.id, ["scarab-king"])]), "scarab-king", "status.damage-reduction")).toBe(true);
  });
});

describe("The Mummy Prince — the curse follows", () => {
  it("when he falls, every enemy is cursed and weakened", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_MUMMY_PRINCE)] }, { playerId: "playerB", characters: [attacker, { characterId: "second", maxHp: 200 }] });
    const s = turn(state, [], [act("playerB", "attacker", lethal.id, ["the-mummy-prince"])]);
    expect(s.characters["the-mummy-prince"]?.alive).toBe(false);
    for (const id of ["attacker", "second"]) {
      expect(has(s, id, "status.curse"), id).toBe(true);
      expect(has(s, id, "status.weakness"), id).toBe(true);
    }
  });
  it("does not fire while he lives", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_MUMMY_PRINCE)] }, { playerId: "playerB", characters: [attacker] });
    expect(has(turn(state, [], [act("playerB", "attacker", hit30.id, ["the-mummy-prince"])]), "attacker", "status.curse")).toBe(false);
  });
  it("Bind in Linen stuns, Royal Curse curses and exposes, Preserved by Salt armours, Wrapped Fist is 20", () => {
    expect(has(turn(hero(THE_MUMMY_PRINCE), [act("playerA", "the-mummy-prince", BIND_IN_LINEN.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
    const cursed = turn(hero(THE_MUMMY_PRINCE), [act("playerA", "the-mummy-prince", ROYAL_CURSE.id, ["dummy"])]);
    expect(has(cursed, "dummy", "status.curse")).toBe(true);
    expect(has(cursed, "dummy", "status.damage-amplification")).toBe(true);
    expect(has(turn(hero(THE_MUMMY_PRINCE), [act("playerA", "the-mummy-prince", PRESERVED_BY_SALT.id, ["the-mummy-prince"])]), "the-mummy-prince", "status.damage-reduction")).toBe(true);
    expect(500 - hp(turn(hero(THE_MUMMY_PRINCE), [act("playerA", "the-mummy-prince", WRAPPED_FIST.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("Desert Djinn — wishes", () => {
  it("Sandstorm hits every enemy for 10", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(DESERT_DJINN)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "desert-djinn", SANDSTORM.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(10);
    expect(dmg(state, s, "second")).toBe(10);
  });
  it("Grant a Wish always gives an ally one of three boons (many seeds)", () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const state = freshScenarioBattle({ playerId: "playerA", characters: [member(DESERT_DJINN), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [dummy()] }, seed);
      const s = turn(withHp(state, "friend", 100), [act("playerA", "desert-djinn", GRANT_A_WISH.id, ["friend"])]);
      if (has(s, "friend", "status.shield")) kinds.add("shield");
      else if (has(s, "friend", "status.damage-reduction")) kinds.add("dr");
      else if (hp(s, "friend") === 130) kinds.add("heal");
    }
    expect([...kinds].sort()).toEqual(["dr", "heal", "shield"]);
  });
  it("Twisted Wish is a gamble on the enemy: damage, stun or a heal", () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const state = withHp(hero(DESERT_DJINN, defaultResourcesFor(DESERT_DJINN), dummy(), seed), "dummy", 300);
      const s = turn(state, [act("playerA", "desert-djinn", TWISTED_WISH.id, ["dummy"])]);
      if (hp(s, "dummy") === 260) kinds.add("damage");
      else if (has(s, "dummy", "status.stun")) kinds.add("stun");
      else if (hp(s, "dummy") === 320) kinds.add("heal");
    }
    expect([...kinds].sort()).toEqual(["damage", "heal", "stun"]);
  });
});

describe("Ifrit — everything burns", () => {
  it("Flame Lash is 20 and Burn; Cinder Storm burns every enemy", () => {
    const lash = turn(hero(IFRIT), [act("playerA", "ifrit", FLAME_LASH.id, ["dummy"])]);
    expect(has(lash, "dummy", "status.burn")).toBe(true);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(IFRIT)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "ifrit", IFRIT_CINDER_STORM.id, [])]);
    expect(has(s, "dummy", "status.burn")).toBe(true);
    expect(has(s, "second", "status.burn")).toBe(true);
  });
  it("Molten Fury is 20, or 40 against a burning enemy", () => {
    expect(500 - hp(turn(hero(IFRIT), [act("playerA", "ifrit", MOLTEN_FURY.id, ["dummy"])]), "dummy")).toBe(20);
    const burning = turn(hero(IFRIT), [act("playerA", "ifrit", FLAME_LASH.id, ["dummy"])]);
    expect(dmg(burning, turn(burning, [act("playerA", "ifrit", MOLTEN_FURY.id, ["dummy"])]), "dummy")).toBeGreaterThanOrEqual(40);
  });
});

describe("The Sphinx — the riddle", () => {
  it("Riddle of the Three Ages locks one energy family on the enemy, chosen at random", () => {
    const families = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const s = turn(hero(THE_SPHINX, defaultResourcesFor(THE_SPHINX), dummy(), seed), [act("playerA", "the-sphinx", RIDDLE_OF_THREE_AGES.id, ["dummy"])]);
      const lock = s.characters.dummy?.statuses.find((x) => x.statusId === "status.energy-lock");
      expect(lock, `seed ${seed}`).toBeDefined();
      families.add(String(lock?.param));
    }
    expect([...families].sort()).toEqual(["FOCUS", "MIGHT", "SPIRIT"]);
  });
  it("Lion's Claw is 30, Stone Silence silences, Patient Stone heals 20", () => {
    expect(500 - hp(turn(hero(THE_SPHINX), [act("playerA", "the-sphinx", LIONS_CLAW.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(hero(THE_SPHINX), [act("playerA", "the-sphinx", STONE_SILENCE.id, ["dummy"])]), "dummy", "status.silence")).toBe(true);
    const s = turn(withHp(hero(THE_SPHINX), "the-sphinx", 60), [act("playerA", "the-sphinx", PATIENT_STONE.id, ["the-sphinx"])]);
    expect(hp(s, "the-sphinx")).toBe(80);
  });
});

describe("Sand Assassin — the strike from nowhere", () => {
  it("Ambush is 30, or 70 right after Shifting Dune", () => {
    expect(500 - hp(turn(hero(SAND_ASSASSIN), [act("playerA", "sand-assassin", AMBUSH.id, ["dummy"])]), "dummy")).toBe(30);
    const hidden = turn(hero(SAND_ASSASSIN), [act("playerA", "sand-assassin", SHIFTING_DUNE.id, ["sand-assassin"])]);
    expect(has(hidden, "sand-assassin", "status.untargetable")).toBe(true);
    expect(dmg(hidden, turn(hidden, [act("playerA", "sand-assassin", AMBUSH.id, ["dummy"])]), "dummy")).toBe(70);
  });
  it("Dust Blade is 20; Poison Kris poisons", () => {
    expect(500 - hp(turn(hero(SAND_ASSASSIN), [act("playerA", "sand-assassin", DUST_BLADE.id, ["dummy"])]), "dummy")).toBe(20);
    expect(has(turn(hero(SAND_ASSASSIN), [act("playerA", "sand-assassin", POISON_KRIS.id, ["dummy"])]), "dummy", "status.poison")).toBe(true);
  });
});

describe("The Pharaoh Without a Tomb — the uncrowned king", () => {
  it("Raise the Guard summons a royal guard", () => {
    const s = turn(hero(PHARAOH_WITHOUT_A_TOMB), [act("playerA", "pharaoh-without-a-tomb", RAISE_THE_GUARD.id, ["pharaoh-without-a-tomb"])]);
    expect(Object.values(s.summons).some((x) => x.summonId === "summon.pharaoh-without-a-tomb.royal-guard")).toBe(true);
  });
  it("Royal Decree shields every ally", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(PHARAOH_WITHOUT_A_TOMB), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [dummy()] });
    const s = turn(state, [act("playerA", "pharaoh-without-a-tomb", ROYAL_DECREE.id, [])]);
    expect(has(s, "friend", "status.shield")).toBe(true);
    expect(has(s, "pharaoh-without-a-tomb", "status.shield")).toBe(true);
  });
  it("Royal Tribute is accepted and Scepter Strike is 20", () => {
    const s = turn(hero(PHARAOH_WITHOUT_A_TOMB), [act("playerA", "pharaoh-without-a-tomb", ROYAL_TRIBUTE.id, ["dummy"])]);
    expect(s.characters["pharaoh-without-a-tomb"]?.alive).toBe(true);
    expect(500 - hp(turn(hero(PHARAOH_WITHOUT_A_TOMB), [act("playerA", "pharaoh-without-a-tomb", PHARAOH_SCEPTER_STRIKE.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The Living Sarcophagus — the sealed lid", () => {
  it("Entomb stuns and hides an enemy for a turn", () => {
    const s = turn(hero(THE_LIVING_SARCOPHAGUS), [act("playerA", "the-living-sarcophagus", ENTOMB.id, ["dummy"])]);
    expect(has(s, "dummy", "status.stun")).toBe(true);
    expect(has(s, "dummy", "status.untargetable")).toBe(true);
  });
  it("Grave Dust weakens every enemy", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_LIVING_SARCOPHAGUS)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "the-living-sarcophagus", GRAVE_DUST.id, [])]);
    expect(has(s, "dummy", "status.weakness")).toBe(true);
    expect(has(s, "second", "status.weakness")).toBe(true);
  });
  it("Lid Closed reflects damage back; Lid Slam is 30", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_LIVING_SARCOPHAGUS)] }, { playerId: "playerB", characters: [attacker] });
    const closed = turn(state, [act("playerA", "the-living-sarcophagus", LID_CLOSED.id, ["the-living-sarcophagus"])]);
    const hit = turn(closed, [], [act("playerB", "attacker", hit30.id, ["the-living-sarcophagus"])]);
    expect(dmg(closed, hit, "attacker")).toBe(30);
    expect(500 - hp(turn(hero(THE_LIVING_SARCOPHAGUS), [act("playerA", "the-living-sarcophagus", LID_SLAM.id, ["dummy"])]), "dummy")).toBe(30);
  });
});

describe("Anubian Judge — the weighing", () => {
  const foe = (): CreateBattleTeamInput["characters"][number] => ({ characterId: "attacker", maxHp: 500, abilityIds: [hit30.id] });
  it("Weigh the Heart is 20 against the innocent", () => {
    expect(500 - hp(turn(hero(ANUBIAN_JUDGE, defaultResourcesFor(ANUBIAN_JUDGE), foe()), [act("playerA", "anubian-judge", WEIGH_THE_HEART.id, ["attacker"])]), "attacker")).toBe(20);
  });
  it("Weigh the Heart is 30 against an enemy that has dealt 60 or more damage", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(ANUBIAN_JUDGE), dummy()] }, { playerId: "playerB", characters: [foe()] });
    const guilty = turn(turn(state, [], [act("playerB", "attacker", hit30.id, ["dummy"])]), [], [act("playerB", "attacker", hit30.id, ["dummy"])]);
    expect(dmg(guilty, turn(guilty, [act("playerA", "anubian-judge", WEIGH_THE_HEART.id, ["attacker"])]), "attacker")).toBe(30);
  });
  it("Feather Strike, Verdict of Ma'at and Balance the Scales", () => {
    expect(500 - hp(turn(hero(ANUBIAN_JUDGE), [act("playerA", "anubian-judge", FEATHER_STRIKE.id, ["dummy"])]), "dummy")).toBe(20);
    const verdict = turn(hero(ANUBIAN_JUDGE), [act("playerA", "anubian-judge", VERDICT_OF_MAAT.id, ["dummy"])]);
    expect(has(verdict, "dummy", "status.weakness")).toBe(true);
    expect(has(verdict, "dummy", "status.damage-amplification")).toBe(true);
    const hurt = turn(withHp(hero(ANUBIAN_JUDGE), "anubian-judge", 60), [act("playerA", "anubian-judge", BALANCE_THE_SCALES.id, ["anubian-judge"])]);
    expect(hp(hurt, "anubian-judge")).toBe(90);
  });
});

describe("Aurelia — Sun Guard", () => {
  const team = () =>
    freshScenarioBattle({ playerId: "playerA", characters: [member(AURELIA), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
  it("Sun's Vigil keeps an ally at 1 health however hard they are hit", () => {
    const guarded = turn(team(), [act("playerA", "aurelia", SUNS_VIGIL.id, ["friend"])]);
    expect(has(guarded, "friend", "status.sun-guard")).toBe(true);
    const hit = turn(guarded, [], [act("playerB", "attacker", lethal.id, ["friend"])]);
    expect(hit.characters.friend?.alive).toBe(true);
    expect(hp(hit, "friend")).toBe(1);
    const again = turn(hit, [], [act("playerB", "attacker", lethal.id, ["friend"])]);
    expect(again.characters.friend?.alive).toBe(true); // not consumed, unlike Death Prevention
  });
  it("it also holds against damage over time", () => {
    const s = turn(withHp(team(), "friend", 20), [act("playerA", "aurelia", SUNS_VIGIL.id, ["friend"])], [act("playerB", "attacker", poisonHit.id, ["friend"])]);
    expect(has(s, "friend", "status.poison")).toBe(true);
    expect(s.characters.friend?.alive).toBe(true);
    expect(hp(s, "friend")).toBe(1);
  });
  it("it delays a death: when it ends the ally is still at 1 and can be killed", () => {
    const guarded = turn(team(), [act("playerA", "aurelia", SUNS_VIGIL.id, ["friend"])]);
    let s = turn(guarded, [], [act("playerB", "attacker", lethal.id, ["friend"])]);
    s = turn(s, []);
    s = turn(s, []);
    expect(has(s, "friend", "status.sun-guard")).toBe(false);
    expect(hp(s, "friend")).toBe(1);
    expect(turn(s, [], [act("playerB", "attacker", hit10.id, ["friend"])]).characters.friend?.alive).toBe(false);
  });
  it("Zenith Aegis guards every ally, herself included, and costs a great deal (Legend lever)", () => {
    const s = turn(team(), [act("playerA", "aurelia", ZENITH_AEGIS.id, [])]);
    expect(has(s, "friend", "status.sun-guard")).toBe(true);
    expect(has(s, "aurelia", "status.sun-guard")).toBe(true);
    expect(ZENITH_AEGIS.cooldown).toBeGreaterThanOrEqual(5);
    expect(Object.values(ZENITH_AEGIS.cost).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(5);
  });
  it("Sun's Vigil cannot target herself", () => {
    const err = resolveTurn(team(), [act("playerA", "aurelia", SUNS_VIGIL.id, ["aurelia"])], [], deps());
    expect(err.ok).toBe(false);
  });
  it("Radiant Lance is 30 and Solar Mend heals 20", () => {
    expect(500 - hp(turn(hero(AURELIA), [act("playerA", "aurelia", RADIANT_LANCE.id, ["dummy"])]), "dummy")).toBe(30);
    expect(hp(turn(withHp(hero(AURELIA), "aurelia", 60), [act("playerA", "aurelia", SOLAR_MEND.id, ["aurelia"])]), "aurelia")).toBe(80);
  });
  it("her vulnerability: below half health every wound leaves her more exposed", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(AURELIA)] }, { playerId: "playerB", characters: [attacker] });
    expect(has(turn(withHp(state, "aurelia", 50), [], [act("playerB", "attacker", hit10.id, ["aurelia"])]), "aurelia", "status.damage-amplification")).toBe(true);
    expect(has(turn(state, [], [act("playerB", "attacker", hit10.id, ["aurelia"])]), "aurelia", "status.damage-amplification")).toBe(false);
  });
  it("COUNTER: Father Bell's Hush silences her so she cannot cast Sun's Vigil", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(AURELIA), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [member(FATHER_BELL), attacker] });
    const hushed = turn(state, [], [act("playerB", "father-bell", HUSH.id, ["aurelia"])]);
    expect(has(hushed, "aurelia", "status.silence")).toBe(true);
    expect(resolveTurn(hushed, [act("playerA", "aurelia", SUNS_VIGIL.id, ["friend"])], [], deps()).ok).toBe(false);
  });
  it("COUNTER: Shiro's Final Stroke erases a guarded ally at 1 health (erasure ignores the floor)", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(AURELIA), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [member(SHIRO)] });
    const guarded = turn(withHp(state, "friend", 1), [act("playerA", "aurelia", SUNS_VIGIL.id, ["friend"])]);
    const erased = turn(guarded, [], [act("playerB", "shiro", FINAL_STROKE.id, ["friend"])]);
    expect(erased.characters.friend?.alive).toBe(false);
  });
});
