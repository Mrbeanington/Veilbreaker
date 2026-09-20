import { describe, expect, it } from "vitest";
import {
  APPRAISE,
  ASHMOUTH,
  ASH_SHROUD,
  BAT_SWARM,
  BOUQUET_TOSS,
  CANE_STRIKE,
  CHOKING_ASH,
  COLD_HAND,
  CRIMSON_KISS,
  CROW_FLOCK,
  EXHUME,
  FANGS,
  FIELD_OF_FEAR,
  FRESH_EARTH,
  GLASS_CASE,
  GRASP_FROM_BELOW,
  GRAVEDIGGERS_GRIP,
  GRIEF_RESOURCE,
  JILTED_VOW,
  MARIONETTE_DANCE,
  MAW_SNAP,
  MIST_FORM,
  NIGHT_TERRORS,
  PICKPOCKET,
  PITCHFORK,
  RAISE_A_PUPPET,
  RESOURCE_LIBRARY,
  SPADE_SWING,
  STAND_STIFF,
  STRINGS_TAUT,
  SWALLOW,
  THE_COLLECTOR,
  THE_GRAVE_DIGGER,
  THE_HEADLESS_BRIDE,
  THE_MARIONETTIST,
  THE_SCARECROW,
  THE_THING_BENEATH_THE_BED,
  THE_VAMPIRE_COUNTESS,
  UNDER_THE_BED,
  VEIL_LASH,
  VENGEFUL_WAIL,
  WOODEN_FIST,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 7 (Horror / Monsters / Dead): signature-mechanic tests.

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
const lethal = fixture({ id: "test.lethal", effects: [{ kind: "damage", amount: 999 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [lethal.id]: lethal } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, lethal.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const friend = { characterId: "friend", maxHp: 200, abilityIds: [] as string[] };
const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy()): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, 1);
const withFriend = (def: CharacterDefinition, foe: CreateBattleTeamInput["characters"][number] = dummy()): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def), friend] }, { playerId: "playerB", characters: [foe] }, 1);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });
const poolTotal = (s: BattleState, player: string) => Object.values(s.energyPools[player] ?? {}).reduce((a, n) => a + n, 0);
const killFriend = (def: CharacterDefinition) =>
  turn(freshScenarioBattle({ playerId: "playerA", characters: [member(def), friend] }, { playerId: "playerB", characters: [attacker] }, 1), [], [act("playerB", "attacker", lethal.id, ["friend"])]);

describe("The Headless Bride — grief", () => {
  it("gains a Grief whenever an ally falls, and not otherwise", () => {
    expect(res(killFriend(THE_HEADLESS_BRIDE), "the-headless-bride", GRIEF_RESOURCE.id)).toBe(1);
    const hit = turn(freshScenarioBattle({ playerId: "playerA", characters: [member(THE_HEADLESS_BRIDE), friend] }, { playerId: "playerB", characters: [attacker] }, 1), [], [act("playerB", "attacker", hit30.id, ["friend"])]);
    expect(res(hit, "the-headless-bride", GRIEF_RESOURCE.id)).toBe(0);
  });
  it("Vengeful Wail is 30, or 60 with Grief, which it spends", () => {
    expect(500 - hp(turn(hero(THE_HEADLESS_BRIDE), [act("playerA", "the-headless-bride", VENGEFUL_WAIL.id, ["dummy"])]), "dummy")).toBe(30);
    const grieving = turn(hero(THE_HEADLESS_BRIDE, { [GRIEF_RESOURCE.id]: 2 }), [act("playerA", "the-headless-bride", VENGEFUL_WAIL.id, ["dummy"])]);
    expect(500 - hp(grieving, "dummy")).toBe(60);
    expect(res(grieving, "the-headless-bride", GRIEF_RESOURCE.id)).toBe(1);
  });
  it("Veil Lash is 20, Bouquet Toss shields a friend, Jilted Vow marks and weakens", () => {
    expect(500 - hp(turn(hero(THE_HEADLESS_BRIDE), [act("playerA", "the-headless-bride", VEIL_LASH.id, ["dummy"])]), "dummy")).toBe(20);
    expect(has(turn(withFriend(THE_HEADLESS_BRIDE), [act("playerA", "the-headless-bride", BOUQUET_TOSS.id, ["friend"])]), "friend", "status.shield")).toBe(true);
    const vow = turn(hero(THE_HEADLESS_BRIDE), [act("playerA", "the-headless-bride", JILTED_VOW.id, ["dummy"])]);
    expect(has(vow, "dummy", "status.mark")).toBe(true);
    expect(has(vow, "dummy", "status.weakness")).toBe(true);
  });
});

describe("The Marionettist — strings", () => {
  it("Strings Taut slows an enemy's cooldown recovery; Marionette Dance stuns", () => {
    expect(has(turn(hero(THE_MARIONETTIST), [act("playerA", "the-marionettist", STRINGS_TAUT.id, ["dummy"])]), "dummy", "status.cooldown-increase")).toBe(true);
    expect(has(turn(hero(THE_MARIONETTIST), [act("playerA", "the-marionettist", MARIONETTE_DANCE.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
  });
  it("Raise a Puppet summons a puppet; Wooden Fist is 20", () => {
    const s = turn(hero(THE_MARIONETTIST), [act("playerA", "the-marionettist", RAISE_A_PUPPET.id, ["the-marionettist"])]);
    expect(Object.values(s.summons).some((x) => x.summonId === "summon.the-marionettist.puppet")).toBe(true);
    expect(500 - hp(turn(hero(THE_MARIONETTIST), [act("playerA", "the-marionettist", WOODEN_FIST.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The Scarecrow — straw", () => {
  it("heals 10 at the end of each of its turns", () => {
    expect(hp(turn(withHp(hero(THE_SCARECROW), "the-scarecrow", 100), []), "the-scarecrow")).toBe(110);
  });
  it("Pitchfork is 30, Crow Flock hits every enemy, Field of Fear frightens and weakens, Stand Stiff armours", () => {
    expect(500 - hp(turn(hero(THE_SCARECROW), [act("playerA", "the-scarecrow", PITCHFORK.id, ["dummy"])]), "dummy")).toBe(30);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_SCARECROW)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] }, 1);
    const s = turn(state, [act("playerA", "the-scarecrow", CROW_FLOCK.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(10);
    expect(dmg(state, s, "second")).toBe(10);
    const fear = turn(hero(THE_SCARECROW), [act("playerA", "the-scarecrow", FIELD_OF_FEAR.id, ["dummy"])]);
    expect(has(fear, "dummy", "status.fear")).toBe(true);
    expect(has(fear, "dummy", "status.weakness")).toBe(true);
    expect(has(turn(hero(THE_SCARECROW), [act("playerA", "the-scarecrow", STAND_STIFF.id, ["the-scarecrow"])]), "the-scarecrow", "status.damage-reduction")).toBe(true);
  });
});

describe("The Grave Digger — exhumation", () => {
  it("Exhume digs a fallen ally back up at 30% health, and costs a great deal", () => {
    const fallen = killFriend(THE_GRAVE_DIGGER);
    expect(fallen.characters.friend?.alive).toBe(false);
    const back = turn(fallen, [act("playerA", "the-grave-digger", EXHUME.id, ["friend"])]);
    expect(back.characters.friend?.alive).toBe(true);
    expect(hp(back, "friend")).toBe(60);
    expect(EXHUME.cooldown).toBeGreaterThanOrEqual(5);
    expect(Object.values(EXHUME.cost).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(4);
  });
  it("cannot exhume a living ally", () => {
    expect(resolveTurn(withFriend(THE_GRAVE_DIGGER), [act("playerA", "the-grave-digger", EXHUME.id, ["friend"])], [], deps()).ok).toBe(false);
  });
  it("Spade Swing is 20, Gravedigger's Grip is 30, Fresh Earth shields", () => {
    expect(500 - hp(turn(hero(THE_GRAVE_DIGGER), [act("playerA", "the-grave-digger", SPADE_SWING.id, ["dummy"])]), "dummy")).toBe(20);
    expect(500 - hp(turn(hero(THE_GRAVE_DIGGER), [act("playerA", "the-grave-digger", GRAVEDIGGERS_GRIP.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(withFriend(THE_GRAVE_DIGGER), [act("playerA", "the-grave-digger", FRESH_EARTH.id, ["friend"])]), "friend", "status.shield")).toBe(true);
  });
});

describe("The Vampire Countess — the hunger", () => {
  it("Fangs is 20 damage and heals her 10", () => {
    const s = turn(withHp(hero(THE_VAMPIRE_COUNTESS), "the-vampire-countess", 60), [act("playerA", "the-vampire-countess", FANGS.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(20);
    expect(hp(s, "the-vampire-countess")).toBe(70);
  });
  it("Mist Form hides her, Crimson Kiss weakens and exposes, Bat Swarm hits every enemy", () => {
    expect(has(turn(hero(THE_VAMPIRE_COUNTESS), [act("playerA", "the-vampire-countess", MIST_FORM.id, ["the-vampire-countess"])]), "the-vampire-countess", "status.untargetable")).toBe(true);
    const kiss = turn(hero(THE_VAMPIRE_COUNTESS), [act("playerA", "the-vampire-countess", CRIMSON_KISS.id, ["dummy"])]);
    expect(has(kiss, "dummy", "status.weakness")).toBe(true);
    expect(has(kiss, "dummy", "status.damage-amplification")).toBe(true);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_VAMPIRE_COUNTESS)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] }, 1);
    const s = turn(state, [act("playerA", "the-vampire-countess", BAT_SWARM.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(10);
    expect(dmg(state, s, "second")).toBe(10);
  });
});

describe("The Collector — the appraisal", () => {
  const damaged = (state: BattleState): BattleState => ({ ...state, characters: { ...state.characters, dummy: { ...state.characters.dummy!, stats: { ...state.characters.dummy!.stats, damageReceived: 80 } } } });
  it("Appraise is 20, or 50 against an enemy that has already taken 60 or more", () => {
    expect(500 - hp(turn(hero(THE_COLLECTOR), [act("playerA", "the-collector", APPRAISE.id, ["dummy"])]), "dummy")).toBe(20);
    expect(500 - hp(turn(damaged(hero(THE_COLLECTOR)), [act("playerA", "the-collector", APPRAISE.id, ["dummy"])]), "dummy")).toBe(50);
  });
  it("Pickpocket takes 2 Spirit from the enemy team; Glass Case stuns; Cane Strike is 20", () => {
    const state = hero(THE_COLLECTOR);
    const baseline = turn(state, []);
    const robbed = turn(state, [act("playerA", "the-collector", PICKPOCKET.id, ["dummy"])]);
    expect(poolTotal(robbed, "playerB")).toBeLessThan(poolTotal(baseline, "playerB"));
    expect(has(turn(hero(THE_COLLECTOR), [act("playerA", "the-collector", GLASS_CASE.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
    expect(500 - hp(turn(hero(THE_COLLECTOR), [act("playerA", "the-collector", CANE_STRIKE.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("Ashmouth — ash and jaws", () => {
  it("Choking Ash makes everything cost every enemy more", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(ASHMOUTH)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] }, 1);
    const s = turn(state, [act("playerA", "ashmouth", CHOKING_ASH.id, [])]);
    expect(has(s, "dummy", "status.energy-cost-increase")).toBe(true);
    expect(has(s, "second", "status.energy-cost-increase")).toBe(true);
  });
  it("Swallow is 40 damage and heals it 20; Maw Snap is 30; Ash Shroud armours", () => {
    const s = turn(withHp(hero(ASHMOUTH), "ashmouth", 100), [act("playerA", "ashmouth", SWALLOW.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(40);
    expect(hp(s, "ashmouth")).toBe(120);
    expect(500 - hp(turn(hero(ASHMOUTH), [act("playerA", "ashmouth", MAW_SNAP.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(hero(ASHMOUTH), [act("playerA", "ashmouth", ASH_SHROUD.id, ["ashmouth"])]), "ashmouth", "status.damage-reduction")).toBe(true);
  });
});

describe("The Thing Beneath the Bed — the ankle", () => {
  it("Grasp from Below is 60 against an enemy at full health, 30 once it is hurt", () => {
    expect(500 - hp(turn(hero(THE_THING_BENEATH_THE_BED), [act("playerA", "the-thing-beneath-the-bed", GRASP_FROM_BELOW.id, ["dummy"])]), "dummy")).toBe(60);
    const hurt = withHp(hero(THE_THING_BENEATH_THE_BED), "dummy", 400);
    expect(400 - hp(turn(hurt, [act("playerA", "the-thing-beneath-the-bed", GRASP_FROM_BELOW.id, ["dummy"])]), "dummy")).toBe(30);
  });
  it("Night Terrors hurts and frightens every enemy; Cold Hand stuns; Under the Bed hides it", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_THING_BENEATH_THE_BED)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] }, 1);
    const s = turn(state, [act("playerA", "the-thing-beneath-the-bed", NIGHT_TERRORS.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(10);
    expect(has(s, "second", "status.fear")).toBe(true);
    expect(has(turn(hero(THE_THING_BENEATH_THE_BED), [act("playerA", "the-thing-beneath-the-bed", COLD_HAND.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
    expect(has(turn(hero(THE_THING_BENEATH_THE_BED), [act("playerA", "the-thing-beneath-the-bed", UNDER_THE_BED.id, ["the-thing-beneath-the-bed"])]), "the-thing-beneath-the-bed", "status.untargetable")).toBe(true);
  });
});
