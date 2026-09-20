import { describe, expect, it } from "vitest";
import {
  ACE,
  BODY_SLAM,
  CUT_MAN,
  DOWNS_RESOURCE,
  DROP_SHOT,
  EL_MAGNIFICO,
  FLYING_ELBOW,
  FOURTH_AND_ONE,
  GO_FOR_IT,
  HAYMAKER,
  HUDDLE_UP,
  JAB,
  LONG_BOMB,
  MATCH_POINT,
  PLAY_FAKE,
  QUICK_SLANT,
  RESOURCE_LIBRARY,
  ROPE_A_DOPE,
  SCRAMBLE,
  SECOND_WIND,
  SERVE,
  SHOULDER_CHARGE,
  STIFF_ARM,
  TAUNT_THE_CROWD,
  THE_CONTENDER,
  THE_GUNSLINGER_QB,
  VOLLEY,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 9 (Sports / Fighters): signature-mechanic tests.

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
const poisonHit = fixture({ id: "test.poison", effects: [{ kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 }] });
const shieldSelf = fixture({
  id: "test.shield-self",
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 100, durationTurns: 5 }],
});

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [poisonHit.id]: poisonHit, [shieldSelf.id]: shieldSelf } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, poisonHit.id, shieldSelf.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const friend = { characterId: "friend", maxHp: 200, abilityIds: [] as string[] };
const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy(), seed = 1): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, seed);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });

describe("Fourth & One — the downs", () => {
  it("gains a Down at the end of each of his turns, up to 3", () => {
    let s = hero(FOURTH_AND_ONE);
    expect(res(s, "fourth-and-one", DOWNS_RESOURCE.id)).toBe(0);
    for (let i = 1; i <= 4; i += 1) {
      s = turn(s, []);
      expect(res(s, "fourth-and-one", DOWNS_RESOURCE.id)).toBe(Math.min(3, i));
    }
  });
  it("Go For It is 20, or 70 with 3 Downs, which it spends", () => {
    expect(500 - hp(turn(hero(FOURTH_AND_ONE), [act("playerA", "fourth-and-one", GO_FOR_IT.id, ["dummy"])]), "dummy")).toBe(20);
    const ready = hero(FOURTH_AND_ONE, { [DOWNS_RESOURCE.id]: 3 });
    const s = turn(ready, [act("playerA", "fourth-and-one", GO_FOR_IT.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(70);
    expect(res(s, "fourth-and-one", DOWNS_RESOURCE.id)).toBeLessThan(3);
  });
  it("Shoulder Charge is 30; Stiff Arm weakens; Huddle Up armours every ally", () => {
    expect(500 - hp(turn(hero(FOURTH_AND_ONE), [act("playerA", "fourth-and-one", SHOULDER_CHARGE.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(hero(FOURTH_AND_ONE), [act("playerA", "fourth-and-one", STIFF_ARM.id, ["dummy"])]), "dummy", "status.weakness")).toBe(true);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(FOURTH_AND_ONE), friend] }, { playerId: "playerB", characters: [dummy()] }, 1);
    const s = turn(state, [act("playerA", "fourth-and-one", HUDDLE_UP.id, [])]);
    expect(has(s, "friend", "status.damage-reduction")).toBe(true);
    expect(has(s, "fourth-and-one", "status.damage-reduction")).toBe(true);
  });
});

describe("The Gunslinger QB — the long bomb", () => {
  it("Long Bomb is an interception (10 to the enemy and 20 to him), a 40, or a 70 touchdown", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const before = hero(THE_GUNSLINGER_QB, defaultResourcesFor(THE_GUNSLINGER_QB), dummy(), seed);
      const s = turn(before, [act("playerA", "the-gunslinger-qb", LONG_BOMB.id, ["dummy"])]);
      const dealt = dmg(before, s, "dummy");
      const cost = dmg(before, s, "the-gunslinger-qb");
      if (dealt === 10) {
        expect(cost).toBe(20);
        seen.add("interception");
      } else if (dealt === 40) {
        expect(cost).toBe(0);
        seen.add("completion");
      } else if (dealt === 70) {
        expect(cost).toBe(0);
        seen.add("touchdown");
      } else throw new Error(`unexpected outcome ${dealt}`);
    }
    expect([...seen].sort()).toEqual(["completion", "interception", "touchdown"]);
  });
  it("Quick Slant is 20; Play Fake weakens; Scramble hides him", () => {
    expect(500 - hp(turn(hero(THE_GUNSLINGER_QB), [act("playerA", "the-gunslinger-qb", QUICK_SLANT.id, ["dummy"])]), "dummy")).toBe(20);
    expect(has(turn(hero(THE_GUNSLINGER_QB), [act("playerA", "the-gunslinger-qb", PLAY_FAKE.id, ["dummy"])]), "dummy", "status.weakness")).toBe(true);
    expect(has(turn(hero(THE_GUNSLINGER_QB), [act("playerA", "the-gunslinger-qb", SCRAMBLE.id, ["the-gunslinger-qb"])]), "the-gunslinger-qb", "status.untargetable")).toBe(true);
  });
});

describe("El Magnífico — slam, then fly", () => {
  it("Body Slam stuns; Flying Elbow is 30, or 70 against a stunned enemy", () => {
    expect(500 - hp(turn(hero(EL_MAGNIFICO), [act("playerA", "el-magnifico", FLYING_ELBOW.id, ["dummy"])]), "dummy")).toBe(30);
    const slammed = turn(hero(EL_MAGNIFICO), [act("playerA", "el-magnifico", BODY_SLAM.id, ["dummy"])]);
    expect(has(slammed, "dummy", "status.stun")).toBe(true);
    expect(dmg(slammed, turn(slammed, [act("playerA", "el-magnifico", FLYING_ELBOW.id, ["dummy"])]), "dummy")).toBe(70);
  });
  it("Taunt the Crowd draws attacks and armours him; Second Wind heals 20", () => {
    const s = turn(hero(EL_MAGNIFICO), [act("playerA", "el-magnifico", TAUNT_THE_CROWD.id, ["el-magnifico"])]);
    expect(has(s, "el-magnifico", "status.taunt")).toBe(true);
    expect(has(s, "el-magnifico", "status.damage-reduction")).toBe(true);
    expect(hp(turn(withHp(hero(EL_MAGNIFICO), "el-magnifico", 60), [act("playerA", "el-magnifico", SECOND_WIND.id, ["el-magnifico"])]), "el-magnifico")).toBe(80);
  });
});

describe("The Contender — never out of it", () => {
  it("Haymaker is 30, or 80 when he is below 40% health", () => {
    expect(500 - hp(turn(hero(THE_CONTENDER), [act("playerA", "the-contender", HAYMAKER.id, ["dummy"])]), "dummy")).toBe(30);
    expect(500 - hp(turn(withHp(hero(THE_CONTENDER), "the-contender", 50), [act("playerA", "the-contender", HAYMAKER.id, ["dummy"])]), "dummy")).toBe(80);
  });
  it("Rope-a-Dope strikes back for 20; Cut Man heals 20 and lifts poison; Jab is 20", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_CONTENDER)] }, { playerId: "playerB", characters: [attacker] }, 1);
    const covered = turn(state, [act("playerA", "the-contender", ROPE_A_DOPE.id, ["the-contender"])]);
    expect(dmg(covered, turn(covered, [], [act("playerB", "attacker", hit30.id, ["the-contender"])]), "attacker")).toBe(20);
    const poisoned = turn(withHp(state, "the-contender", 60), [], [act("playerB", "attacker", poisonHit.id, ["the-contender"])]);
    expect(has(poisoned, "the-contender", "status.poison")).toBe(true);
    const cut = turn(poisoned, [act("playerA", "the-contender", CUT_MAN.id, ["the-contender"])]);
    expect(has(cut, "the-contender", "status.poison")).toBe(false);
    expect(500 - hp(turn(hero(THE_CONTENDER), [act("playerA", "the-contender", JAB.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("Ace — the serve nobody blocks", () => {
  it("Serve and Match Point pierce a shield: the shield is untouched and the full damage lands", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(ACE)] }, { playerId: "playerB", characters: [attacker] }, 1);
    const shielded = turn(state, [], [act("playerB", "attacker", shieldSelf.id, ["attacker"])]);
    expect(has(shielded, "attacker", "status.shield")).toBe(true);
    const served = turn(shielded, [act("playerA", "ace", SERVE.id, ["attacker"])]);
    expect(dmg(shielded, served, "attacker")).toBe(20);
    const matched = turn(shielded, [act("playerA", "ace", MATCH_POINT.id, ["attacker"])]);
    expect(dmg(shielded, matched, "attacker")).toBe(60);
  });
  it("Volley strikes back for 20; Drop Shot is 10 and weakens; Match Point costs Might 2 and Focus 2 on a 4-turn cooldown", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(ACE)] }, { playerId: "playerB", characters: [attacker] }, 1);
    const ready = turn(state, [act("playerA", "ace", VOLLEY.id, ["ace"])]);
    expect(dmg(ready, turn(ready, [], [act("playerB", "attacker", hit30.id, ["ace"])]), "attacker")).toBe(20);
    const drop = turn(hero(ACE), [act("playerA", "ace", DROP_SHOT.id, ["dummy"])]);
    expect(500 - hp(drop, "dummy")).toBe(10);
    expect(has(drop, "dummy", "status.weakness")).toBe(true);
    expect(MATCH_POINT.cooldown).toBe(4);
    expect(MATCH_POINT.cost).toMatchObject({ might: 2, focus: 2 });
  });
});
