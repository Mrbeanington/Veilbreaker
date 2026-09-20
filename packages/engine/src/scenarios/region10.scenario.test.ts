import { describe, expect, it } from "vitest";
import {
  BASS_DROP,
  BOIL_OVER,
  BUILD_UP,
  CHEF_DEVOUR,
  CHEF_RAMBLE,
  CHOP,
  CHORUS,
  CLEAVER_STORM,
  CROWD_SURF,
  CROWD_SURGE,
  CUT_THE_AMP,
  DJ_CATACLYSM,
  FATHER_BELL,
  FEEDBACK_RESOURCE,
  FINALE,
  FLAMBE,
  HUSH,
  INVISIBLE_BOX,
  JOHNNY_FEEDBACK,
  KITCHEN_NIGHTMARE,
  MARIONETTE_DANCE,
  MIMIC_GUARD,
  MIMIC_STRIKE,
  ORPHEON,
  PERFORMANCE_RESOURCE,
  PLATE_IT,
  POWER_CHORD,
  RECORD_SCRATCH,
  REST_NOTE,
  RESOURCE_LIBRARY,
  SEAR,
  SILENT_SLAP,
  THE_MARIONETTIST,
  THE_MIME,
  VERSE,
  WALL_OF_SOUND,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 10 (Music / Entertainment / Chaos): signature-mechanic
// tests, including Orpheon's performance and the counters his note names.

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
const shieldSelf = fixture({
  id: "test.shield-self",
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 100, durationTurns: 5 }],
});
const drSelf = fixture({
  id: "test.dr-self",
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 5 }],
});
const stunHit = fixture({ id: "test.stun", effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [shieldSelf.id]: shieldSelf, [drSelf.id]: drSelf, [stunHit.id]: stunHit } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, shieldSelf.id, drSelf.id, stunHit.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const friend = { characterId: "friend", maxHp: 200, abilityIds: [] as string[] };
const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy(), seed = 1): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, seed);
const two = (def: CharacterDefinition): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def)] }, { playerId: "playerB", characters: [dummy(500), { characterId: "second", maxHp: 500 }] }, 1);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });

describe("Johnny Feedback — louder", () => {
  const id = "johnny-feedback";
  it("every ability adds a Feedback", () => {
    expect(res(turn(hero(JOHNNY_FEEDBACK), [act("playerA", id, POWER_CHORD.id, ["dummy"])]), id, FEEDBACK_RESOURCE.id)).toBe(1);
  });
  it("Power Chord is 20, or 40 with 2 or more Feedback", () => {
    expect(500 - hp(turn(hero(JOHNNY_FEEDBACK), [act("playerA", id, POWER_CHORD.id, ["dummy"])]), "dummy")).toBe(20);
    expect(500 - hp(turn(hero(JOHNNY_FEEDBACK, { [FEEDBACK_RESOURCE.id]: 2 }), [act("playerA", id, POWER_CHORD.id, ["dummy"])]), "dummy")).toBe(40);
  });
  it("Wall of Sound is 10 to every enemy, or 30 with Feedback", () => {
    const low = two(JOHNNY_FEEDBACK);
    expect(dmg(low, turn(low, [act("playerA", id, WALL_OF_SOUND.id, [])]), "dummy")).toBe(10);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(JOHNNY_FEEDBACK, { resources: { [FEEDBACK_RESOURCE.id]: 3 } })] }, { playerId: "playerB", characters: [dummy(500), { characterId: "second", maxHp: 500 }] }, 1);
    const s = turn(state, [act("playerA", id, WALL_OF_SOUND.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(30);
    expect(dmg(state, s, "second")).toBe(30);
  });
  it("at the maximum every ability also hurts him for 10", () => {
    const capped = hero(JOHNNY_FEEDBACK, { [FEEDBACK_RESOURCE.id]: 5 });
    expect(dmg(capped, turn(capped, [act("playerA", id, CROWD_SURF.id, [id])]), id)).toBe(10);
    const fine = hero(JOHNNY_FEEDBACK, { [FEEDBACK_RESOURCE.id]: 1 });
    expect(dmg(fine, turn(fine, [act("playerA", id, CROWD_SURF.id, [id])]), id)).toBe(0);
  });
  it("Cut the Amp spends the Feedback and heals 10; Crowd Surf hides him", () => {
    const s = turn(withHp(hero(JOHNNY_FEEDBACK, { [FEEDBACK_RESOURCE.id]: 4 }), id, 60), [act("playerA", id, CUT_THE_AMP.id, [id])]);
    expect(res(s, id, FEEDBACK_RESOURCE.id)).toBeLessThanOrEqual(1); // spent, then the ability itself adds one
    expect(hp(s, id)).toBe(70);
    expect(has(turn(hero(JOHNNY_FEEDBACK), [act("playerA", id, CROWD_SURF.id, [id])]), id, "status.untargetable")).toBe(true);
  });
});

describe("DJ Cataclysm — the drop", () => {
  it("Bass Drop is 20 to every enemy, or 50 right after Build Up", () => {
    const state = two(DJ_CATACLYSM);
    expect(dmg(state, turn(state, [act("playerA", "dj-cataclysm", BASS_DROP.id, [])]), "dummy")).toBe(20);
    const built = turn(state, [act("playerA", "dj-cataclysm", BUILD_UP.id, ["dummy"])]);
    const dropped = turn(built, [act("playerA", "dj-cataclysm", BASS_DROP.id, [])]);
    expect(dmg(built, dropped, "dummy")).toBe(50);
    expect(dmg(built, dropped, "second")).toBe(50);
  });
  it("Record Scratch silences; Crowd Surge shields every ally", () => {
    expect(has(turn(hero(DJ_CATACLYSM), [act("playerA", "dj-cataclysm", RECORD_SCRATCH.id, ["dummy"])]), "dummy", "status.silence")).toBe(true);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(DJ_CATACLYSM), friend] }, { playerId: "playerB", characters: [dummy()] }, 1);
    const s = turn(state, [act("playerA", "dj-cataclysm", CROWD_SURGE.id, [])]);
    expect(has(s, "friend", "status.shield")).toBe(true);
    expect(has(s, "dj-cataclysm", "status.shield")).toBe(true);
  });
});

describe("The Mime — copies what protects", () => {
  const vs = () => freshScenarioBattle({ playerId: "playerA", characters: [member(THE_MIME)] }, { playerId: "playerB", characters: [attacker] }, 1);
  it("Mimic Guard turns a shield into a mirror", () => {
    const shielded = turn(vs(), [], [act("playerB", "attacker", shieldSelf.id, ["attacker"])]);
    const s = turn(shielded, [act("playerA", "the-mime", MIMIC_GUARD.id, ["attacker"])]);
    expect(has(s, "the-mime", "status.reflect")).toBe(true);
  });
  it("Mimic Guard turns Damage Reduction into a counter, and does nothing against an unprotected enemy", () => {
    const armoured = turn(vs(), [], [act("playerB", "attacker", drSelf.id, ["attacker"])]);
    const s = turn(armoured, [act("playerA", "the-mime", MIMIC_GUARD.id, ["attacker"])]);
    expect(has(s, "the-mime", "status.counter")).toBe(true);
    const bare = turn(vs(), [act("playerA", "the-mime", MIMIC_GUARD.id, ["attacker"])]);
    expect(has(bare, "the-mime", "status.reflect")).toBe(false);
    expect(has(bare, "the-mime", "status.counter")).toBe(false);
  });
  it("Mimic Strike is 20, or 60 against a protected enemy", () => {
    const plain = vs();
    expect(dmg(plain, turn(plain, [act("playerA", "the-mime", MIMIC_STRIKE.id, ["attacker"])]), "attacker")).toBe(20);
    const shielded = turn(vs(), [], [act("playerB", "attacker", drSelf.id, ["attacker"])]);
    const s = turn(shielded, [act("playerA", "the-mime", MIMIC_STRIKE.id, ["attacker"])]);
    expect(hp(shielded, "attacker") - hp(s, "attacker")).toBeGreaterThanOrEqual(40);
  });
  it("Silent Slap is 30; Invisible Box silences", () => {
    expect(500 - hp(turn(hero(THE_MIME), [act("playerA", "the-mime", SILENT_SLAP.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(hero(THE_MIME), [act("playerA", "the-mime", INVISIBLE_BOX.id, ["dummy"])]), "dummy", "status.silence")).toBe(true);
  });
});

describe("Chef Ramble — the recipe", () => {
  const id = "chef-ramble";
  const cook = (order: Ability[]) => {
    let s = hero(CHEF_RAMBLE);
    for (const step of order) s = turn(s, [act("playerA", id, step.id, ["dummy"])]);
    return s;
  };
  it("Chop, Sear, Flambé and Plate It in order transforms him into The Five-Star Fiend", () => {
    const s = cook([CHOP, SEAR, FLAMBE, PLATE_IT]);
    expect(s.characters[id]?.maxHp).toBe(150);
    expect(s.characters[id]?.abilityIds).toEqual([CLEAVER_STORM.id, BOIL_OVER.id, CHEF_DEVOUR.id, KITCHEN_NIGHTMARE.id]);
  });
  it("the wrong order, or Plate It alone, does not", () => {
    expect(cook([SEAR, CHOP, FLAMBE, PLATE_IT]).characters[id]?.maxHp).toBe(CHEF_RAMBLE.baseHp);
    expect(cook([PLATE_IT]).characters[id]?.maxHp).toBe(CHEF_RAMBLE.baseHp);
    expect(cook([CHOP, SEAR, PLATE_IT]).characters[id]?.maxHp).toBe(CHEF_RAMBLE.baseHp);
  });
  it("each step of the recipe does its own damage", () => {
    expect(500 - hp(turn(hero(CHEF_RAMBLE), [act("playerA", id, CHOP.id, ["dummy"])]), "dummy")).toBe(20);
    expect(has(turn(hero(CHEF_RAMBLE), [act("playerA", id, SEAR.id, ["dummy"])]), "dummy", "status.burn")).toBe(true);
    expect(has(turn(hero(CHEF_RAMBLE), [act("playerA", id, FLAMBE.id, ["dummy"])]), "dummy", "status.burn")).toBe(true);
  });
  it("as the Fiend he cleaves every enemy and Kitchen Nightmare stuns them all", () => {
    const fiend = cook([CHOP, SEAR, FLAMBE, PLATE_IT]);
    const state: BattleState = { ...two(CHEF_RAMBLE), characters: { ...two(CHEF_RAMBLE).characters, [id]: fiend.characters[id]! } };
    const s = turn(state, [act("playerA", id, KITCHEN_NIGHTMARE.id, [])]);
    expect(has(s, "dummy", "status.stun")).toBe(true);
    expect(has(s, "second", "status.stun")).toBe(true);
  });
});

describe("Orpheon — the performance", () => {
  const id = "orpheon";
  const stage = (s: BattleState) => res(s, id, PERFORMANCE_RESOURCE.id);
  const vs = () => freshScenarioBattle({ playerId: "playerA", characters: [member(ORPHEON)] }, { playerId: "playerB", characters: [attacker] }, 1);
  it("Verse begins the performance, Chorus raises it, Finale ends it", () => {
    let s = vs();
    expect(stage(s)).toBe(0);
    s = turn(s, [act("playerA", id, VERSE.id, ["attacker"])]);
    expect(stage(s)).toBe(1);
    s = turn(s, [act("playerA", id, CHORUS.id, ["attacker"])]);
    expect(stage(s)).toBe(2);
    const before = s;
    s = turn(s, [act("playerA", id, FINALE.id, [])]);
    expect(dmg(before, s, "attacker")).toBe(70);
    expect(stage(s)).toBe(0);
  });
  it("Chorus without the Verse is only 10, and Finale without the Chorus is only 10", () => {
    const state = vs();
    expect(dmg(state, turn(state, [act("playerA", id, CHORUS.id, ["attacker"])]), "attacker")).toBe(10);
    expect(dmg(state, turn(state, [act("playerA", id, FINALE.id, [])]), "attacker")).toBe(10);
    const verse = turn(state, [act("playerA", id, VERSE.id, ["attacker"])]);
    expect(dmg(verse, turn(verse, [act("playerA", id, FINALE.id, [])]), "attacker")).toBe(10);
  });
  it("Verse is 20 and Chorus is 40 when in order", () => {
    const state = vs();
    const verse = turn(state, [act("playerA", id, VERSE.id, ["attacker"])]);
    expect(dmg(state, verse, "attacker")).toBe(20);
    expect(dmg(verse, turn(verse, [act("playerA", id, CHORUS.id, ["attacker"])]), "attacker")).toBe(40);
  });
  it("a stun interrupts the performance and it starts over", () => {
    let s = turn(vs(), [act("playerA", id, VERSE.id, ["attacker"])]);
    s = turn(s, [act("playerA", id, CHORUS.id, ["attacker"])]);
    expect(stage(s)).toBe(2);
    s = turn(s, [], [act("playerB", "attacker", stunHit.id, [id])]);
    expect(has(s, id, "status.stun")).toBe(true);
    expect(stage(s)).toBe(0);
  });
  it("COUNTER: Father Bell's Hush silences him and breaks the song", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(ORPHEON)] }, { playerId: "playerB", characters: [member(FATHER_BELL)] }, 1);
    let s = turn(state, [act("playerA", id, VERSE.id, ["father-bell"])]);
    s = turn(s, [act("playerA", id, CHORUS.id, ["father-bell"])]);
    expect(stage(s)).toBe(2);
    s = turn(s, [], [act("playerB", "father-bell", HUSH.id, [id])]);
    expect(has(s, id, "status.silence")).toBe(true);
    expect(stage(s)).toBe(0);
  });
  it("COUNTER: The Marionettist's Marionette Dance stuns him and breaks the song", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(ORPHEON)] }, { playerId: "playerB", characters: [member(THE_MARIONETTIST)] }, 1);
    let s = turn(state, [act("playerA", id, VERSE.id, ["the-marionettist"])]);
    expect(stage(s)).toBe(1);
    s = turn(s, [], [act("playerB", "the-marionettist", MARIONETTE_DANCE.id, [id])]);
    expect(has(s, id, "status.stun")).toBe(true);
    expect(stage(s)).toBe(0);
  });
  it("the Finale costs a great deal (Legend lever); Rest Note shields", () => {
    expect(FINALE.cooldown).toBeGreaterThanOrEqual(5);
    expect(Object.values(FINALE.cost).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(5);
    expect(has(turn(vs(), [act("playerA", id, REST_NOTE.id, [id])]), id, "status.shield")).toBe(true);
  });
});
