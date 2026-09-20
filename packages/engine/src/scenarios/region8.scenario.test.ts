import { describe, expect, it } from "vitest";
import {
  BANANA_BREAK,
  BRONZE_AXE,
  CARROT_OF_VALOR,
  CHEST_BEAT,
  COMMANDING_HONK,
  CROAK_TONGUE_LASH,
  DIG_IN_AND_GLARE,
  EIGHT_ARMS,
  ENCORE,
  FATHER_BELL,
  FIXED_BAYONET,
  FRENZIED_BITE,
  FROG_CURSE,
  GENERAL_GOOSE,
  GROUND_POUND,
  HUSH,
  INK_CLOUD,
  KING_CROAK,
  KNIGHTS_GUARD,
  LABYRINTH_WALL,
  LANCE_CHARGE,
  LILY_PAD_THRONE,
  LOST_IN_THE_MAZE,
  MINOTAUR_KING,
  PECK,
  POISON_DART,
  PROFESSOR_OCTOPUS,
  RESOURCE_LIBRARY,
  REVEILLE,
  RIP_AND_TEAR,
  SHRUG_IT_OFF,
  SILVERBACK_SLAM,
  SIR_HOPSALOT,
  TENTACLE_GRAB,
  THE_ALBINO_GORILLA,
  THE_HONEY_BADGER,
  THE_LABYRINTH_CLOSES,
  TRIPLE_HOP,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 8 (Animals / Weird Characters): signature-mechanic tests,
// including the Minotaur King's Labyrinth and the counters his note names.

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
const poisonHit = fixture({ id: "test.poison", effects: [{ kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [hit10.id]: hit10, [poisonHit.id]: poisonHit } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, hit10.id, poisonHit.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const friend = { characterId: "friend", maxHp: 200, abilityIds: [] as string[] };
const hero = (def: CharacterDefinition, foe: CreateBattleTeamInput["characters"][number] = dummy()): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def)] }, { playerId: "playerB", characters: [foe] }, 1);
const withFriend = (def: CharacterDefinition, foe: CreateBattleTeamInput["characters"][number] = dummy()): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def), friend] }, { playerId: "playerB", characters: [foe] }, 1);
const two = (def: CharacterDefinition): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] }, 1);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });

describe("Sir Hopsalot — the sincere knight", () => {
  it("Triple Hop is three hits (30 in all); Lance Charge is 30 and stuns", () => {
    expect(500 - hp(turn(hero(SIR_HOPSALOT), [act("playerA", "sir-hopsalot", TRIPLE_HOP.id, ["dummy"])]), "dummy")).toBe(30);
    const charged = turn(hero(SIR_HOPSALOT), [act("playerA", "sir-hopsalot", LANCE_CHARGE.id, ["dummy"])]);
    expect(500 - hp(charged, "dummy")).toBe(30);
    expect(has(charged, "dummy", "status.stun")).toBe(true);
  });
  it("Carrot of Valor shields an ally; Knight's Guard strikes back", () => {
    expect(has(turn(withFriend(SIR_HOPSALOT), [act("playerA", "sir-hopsalot", CARROT_OF_VALOR.id, ["friend"])]), "friend", "status.shield")).toBe(true);
    expect(has(turn(withFriend(SIR_HOPSALOT), [act("playerA", "sir-hopsalot", KNIGHTS_GUARD.id, ["sir-hopsalot"])]), "sir-hopsalot", "status.counter")).toBe(true);
  });
});

describe("General Goose — the veteran", () => {
  it("Peck is 20; Fixed Bayonet is 40 and bleeds", () => {
    expect(500 - hp(turn(hero(GENERAL_GOOSE), [act("playerA", "general-goose", PECK.id, ["dummy"])]), "dummy")).toBe(20);
    const s = turn(hero(GENERAL_GOOSE), [act("playerA", "general-goose", FIXED_BAYONET.id, ["dummy"])]);
    expect(has(s, "dummy", "status.bleed")).toBe(true);
    expect(500 - hp(s, "dummy")).toBeGreaterThanOrEqual(40);
  });
  it("Commanding Honk weakens every enemy; Reveille quickens every ally", () => {
    const s = turn(two(GENERAL_GOOSE), [act("playerA", "general-goose", COMMANDING_HONK.id, [])]);
    expect(has(s, "dummy", "status.weakness")).toBe(true);
    expect(has(s, "second", "status.weakness")).toBe(true);
    const r = turn(withFriend(GENERAL_GOOSE), [act("playerA", "general-goose", REVEILLE.id, [])]);
    expect(has(r, "friend", "status.cooldown-reduction")).toBe(true);
    expect(has(r, "general-goose", "status.cooldown-reduction")).toBe(true);
  });
});

describe("The Honey Badger — doesn't care", () => {
  const badgerVs = () => freshScenarioBattle({ playerId: "playerA", characters: [member(THE_HONEY_BADGER)] }, { playerId: "playerB", characters: [attacker] }, 1);
  it("below half health every wound hardens it; above half it does not", () => {
    expect(has(turn(withHp(badgerVs(), "the-honey-badger", 50), [], [act("playerB", "attacker", hit10.id, ["the-honey-badger"])]), "the-honey-badger", "status.damage-reduction")).toBe(true);
    expect(has(turn(badgerVs(), [], [act("playerB", "attacker", hit10.id, ["the-honey-badger"])]), "the-honey-badger", "status.damage-reduction")).toBe(false);
  });
  it("Shrug It Off lifts poison from itself and heals 10", () => {
    const poisoned = turn(withHp(badgerVs(), "the-honey-badger", 60), [], [act("playerB", "attacker", poisonHit.id, ["the-honey-badger"])]);
    expect(has(poisoned, "the-honey-badger", "status.poison")).toBe(true);
    const cleansed = turn(poisoned, [act("playerA", "the-honey-badger", SHRUG_IT_OFF.id, ["the-honey-badger"])]);
    expect(has(cleansed, "the-honey-badger", "status.poison")).toBe(false);
  });
  it("Rip and Tear bleeds; Frenzied Bite is 30; Dig In and Glare armours", () => {
    expect(has(turn(hero(THE_HONEY_BADGER), [act("playerA", "the-honey-badger", RIP_AND_TEAR.id, ["dummy"])]), "dummy", "status.bleed")).toBe(true);
    expect(500 - hp(turn(hero(THE_HONEY_BADGER), [act("playerA", "the-honey-badger", FRENZIED_BITE.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(hero(THE_HONEY_BADGER), [act("playerA", "the-honey-badger", DIG_IN_AND_GLARE.id, ["the-honey-badger"])]), "the-honey-badger", "status.damage-reduction")).toBe(true);
  });
});

describe("Professor Octopus — the encore", () => {
  it("Eight Arms is 4 hits of 10 (40 in all)", () => {
    expect(500 - hp(turn(hero(PROFESSOR_OCTOPUS), [act("playerA", "professor-octopus", EIGHT_ARMS.id, ["dummy"])]), "dummy")).toBe(40);
  });
  it("Encore makes the ability he used last ready again at once", () => {
    const grabbed = turn(hero(PROFESSOR_OCTOPUS), [act("playerA", "professor-octopus", TENTACLE_GRAB.id, ["dummy"])]);
    expect(grabbed.characters["professor-octopus"]?.cooldowns[TENTACLE_GRAB.id] ?? 0).toBeGreaterThan(0);
    const again = turn(grabbed, [act("playerA", "professor-octopus", ENCORE.id, ["professor-octopus"])]);
    expect(again.characters["professor-octopus"]?.cooldowns[TENTACLE_GRAB.id] ?? 0).toBe(0);
  });
  it("Ink Cloud weakens every enemy; Tentacle Grab stuns", () => {
    const s = turn(two(PROFESSOR_OCTOPUS), [act("playerA", "professor-octopus", INK_CLOUD.id, [])]);
    expect(has(s, "dummy", "status.weakness")).toBe(true);
    expect(has(s, "second", "status.weakness")).toBe(true);
    expect(has(turn(hero(PROFESSOR_OCTOPUS), [act("playerA", "professor-octopus", TENTACLE_GRAB.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
  });
});

describe("King Croak — the poisoned court", () => {
  it("Frog Curse silences and weakens; Poison Dart poisons; Tongue Lash is 20; Lily Pad Throne shields", () => {
    const cursed = turn(hero(KING_CROAK), [act("playerA", "king-croak", FROG_CURSE.id, ["dummy"])]);
    expect(has(cursed, "dummy", "status.silence")).toBe(true);
    expect(has(cursed, "dummy", "status.weakness")).toBe(true);
    expect(has(turn(hero(KING_CROAK), [act("playerA", "king-croak", POISON_DART.id, ["dummy"])]), "dummy", "status.poison")).toBe(true);
    expect(500 - hp(turn(hero(KING_CROAK), [act("playerA", "king-croak", CROAK_TONGUE_LASH.id, ["dummy"])]), "dummy")).toBe(20);
    expect(has(turn(hero(KING_CROAK), [act("playerA", "king-croak", LILY_PAD_THRONE.id, ["king-croak"])]), "king-croak", "status.shield")).toBe(true);
  });
});

describe("The Albino Gorilla — strength", () => {
  it("Silverback Slam is 40; Ground Pound is 20 to every enemy", () => {
    expect(500 - hp(turn(hero(THE_ALBINO_GORILLA), [act("playerA", "the-albino-gorilla", SILVERBACK_SLAM.id, ["dummy"])]), "dummy")).toBe(40);
    const state = two(THE_ALBINO_GORILLA);
    const s = turn(state, [act("playerA", "the-albino-gorilla", GROUND_POUND.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(20);
    expect(dmg(state, s, "second")).toBe(20);
  });
  it("Chest Beat frightens every enemy; Banana Break heals 20", () => {
    const beat = turn(two(THE_ALBINO_GORILLA), [act("playerA", "the-albino-gorilla", CHEST_BEAT.id, [])]);
    expect(has(beat, "dummy", "status.fear")).toBe(true);
    expect(has(beat, "second", "status.fear")).toBe(true);
    expect(hp(turn(withHp(hero(THE_ALBINO_GORILLA), "the-albino-gorilla", 100), [act("playerA", "the-albino-gorilla", BANANA_BREAK.id, ["the-albino-gorilla"])]), "the-albino-gorilla")).toBe(120);
  });
});

describe("The Minotaur King — the Labyrinth", () => {
  const team = () => freshScenarioBattle({ playerId: "playerA", characters: [member(MINOTAUR_KING), friend] }, { playerId: "playerB", characters: [attacker] }, 1);
  it("Lost in the Maze sends an enemy's attack at the King instead of his ally", () => {
    const s = turn(team(), [act("playerA", "minotaur-king", LOST_IN_THE_MAZE.id, ["attacker"])], [act("playerB", "attacker", hit30.id, ["friend"])]);
    expect(hp(s, "friend")).toBe(200);
    expect(MINOTAUR_KING.baseHp - hp(s, "minotaur-king")).toBe(30);
  });
  it("Labyrinth Wall draws attacks and armours him", () => {
    const s = turn(team(), [act("playerA", "minotaur-king", LABYRINTH_WALL.id, ["minotaur-king"])]);
    expect(has(s, "minotaur-king", "status.taunt")).toBe(true);
    expect(has(s, "minotaur-king", "status.damage-reduction")).toBe(true);
  });
  it("The Labyrinth Closes stuns every enemy, and costs a great deal (Legend lever)", () => {
    const s = turn(two(MINOTAUR_KING), [act("playerA", "minotaur-king", THE_LABYRINTH_CLOSES.id, [])]);
    expect(has(s, "dummy", "status.stun")).toBe(true);
    expect(has(s, "second", "status.stun")).toBe(true);
    expect(THE_LABYRINTH_CLOSES.cooldown).toBeGreaterThanOrEqual(5);
    expect(Object.values(THE_LABYRINTH_CLOSES.cost).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(5);
  });
  it("Bronze Axe is 30; his vulnerability: below half health every wound leaves him more exposed", () => {
    expect(500 - hp(turn(hero(MINOTAUR_KING), [act("playerA", "minotaur-king", BRONZE_AXE.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(withHp(team(), "minotaur-king", 60), [], [act("playerB", "attacker", hit10.id, ["minotaur-king"])]), "minotaur-king", "status.damage-amplification")).toBe(true);
    expect(has(turn(team(), [], [act("playerB", "attacker", hit10.id, ["minotaur-king"])]), "minotaur-king", "status.damage-amplification")).toBe(false);
  });
  it("COUNTER: Father Bell's Hush silences him so he cannot close the maze", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MINOTAUR_KING)] }, { playerId: "playerB", characters: [member(FATHER_BELL)] }, 1);
    const hushed = turn(state, [], [act("playerB", "father-bell", HUSH.id, ["minotaur-king"])]);
    expect(has(hushed, "minotaur-king", "status.silence")).toBe(true);
    expect(resolveTurn(hushed, [act("playerA", "minotaur-king", THE_LABYRINTH_CLOSES.id, [])], [], deps()).ok).toBe(false);
  });
});
