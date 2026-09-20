import { describe, expect, it } from "vitest";
import {
  ANANSI,
  BEWITCH,
  BLANK_FACE,
  BUMP_IN_THE_NIGHT,
  CARRY_OFF,
  CLOUD_SOMERSAULT,
  SHROUD_OF_DIRT,
  DOKKAEBI,
  ELIXIR_OF_LIFE,
  FACE_OF_FEAR,
  FACE_OF_MERCY,
  FACE_OF_WRATH,
  FATHER_BELL,
  FORTUNA_ILL_OMEN,
  FORTUNES_FAVOUR,
  FOX_BITE,
  GNAW,
  GOBLIN_GOLD,
  GRAVE_CLAW,
  HAPPILY_EVER_AFTER,
  HIGH_STAKES,
  HOPPING_STRIKE,
  HUSH,
  MIRROR_TRICK,
  JIANGSHI,
  KITSUNE_GRACE,
  LAMP_LIGHT,
  LUCKY_FOOT,
  MADAME_FORTUNA,
  MAGIC_CLUB,
  MOON_GLOW,
  MORTAR_POUND,
  ONCE_UPON_A_TIME,
  GRAVE_WHISPER,
  PLUCK_HAIRS,
  PRANK,
  QI_DRAIN,
  RESOURCE_LIBRARY,
  RIGOR,
  RISING_ACTION,
  ROOST,
  SPIDER_BITE,
  STAFF_STRIKE,
  STEAL_A_PEACH,
  TALL_TALE,
  TALON_STRIKE,
  TANGLED_TALE,
  THE_GAMBLER,
  THE_GHOUL,
  THE_MONKEY_TRICKSTER,
  THE_MOON_RABBIT,
  THE_ROC,
  THE_STORYTELLER,
  THE_THOUSAND_FACED_STRANGER,
  THE_TWIST,
  THE_WANDERING_GENIE,
  THE_WHITE_FOX,
  TURN_THE_CARD,
  WEB_OF_STORIES,
  WHEEL_OF_FORTUNE,
  WINGBEAT,
  WISHES_RESOURCE,
  WISH_FOR_LIFE,
  WISH_FOR_RUIN,
  WISH_FOR_WEALTH,
  CARRION_STENCH,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 6 (World Folklore / Spirits / Tricksters): signature-mechanic
// tests, including Madame Fortuna's probability rule-break and its counters.

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
const poisonHit = fixture({ id: "test.poison", effects: [{ kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [hit10.id]: hit10, [lethal.id]: lethal, [poisonHit.id]: poisonHit } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, hit10.id, lethal.id, poisonHit.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const friend = { characterId: "friend", maxHp: 200, abilityIds: [] as string[] };
const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy(), seed = 1): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, seed);
const withFriend = (def: CharacterDefinition, foe: CreateBattleTeamInput["characters"][number] = dummy()): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def), friend] }, { playerId: "playerB", characters: [foe] });

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });
const poolTotal = (s: BattleState, player: string) => Object.values(s.energyPools[player] ?? {}).reduce((a, n) => a + n, 0);

describe("Anansi — the tangled tale", () => {
  it("Tangled Tale lengthens the cooldown of the ability the enemy used last", () => {
    const state = withFriend(ANANSI, attacker);
    const used = turn(state, [], [act("playerB", "attacker", hit30.id, ["friend"])]);
    const tangled = turn(used, [act("playerA", "anansi", TANGLED_TALE.id, ["attacker"])]);
    expect(tangled.characters.attacker?.cooldowns[hit30.id] ?? 0).toBeGreaterThan(used.characters.attacker?.cooldowns[hit30.id] ?? 0);
  });
  it("Spider Bite poisons, Tall Tale weakens, Web of Stories shields a friend", () => {
    expect(has(turn(hero(ANANSI), [act("playerA", "anansi", SPIDER_BITE.id, ["dummy"])]), "dummy", "status.poison")).toBe(true);
    expect(has(turn(hero(ANANSI), [act("playerA", "anansi", TALL_TALE.id, ["dummy"])]), "dummy", "status.weakness")).toBe(true);
    expect(has(turn(withFriend(ANANSI), [act("playerA", "anansi", WEB_OF_STORIES.id, ["friend"])]), "friend", "status.shield")).toBe(true);
  });
});

describe("The Moon Rabbit — the elixir of life", () => {
  it("Elixir of Life heals an ally for 30", () => {
    const s = turn(withHp(withFriend(THE_MOON_RABBIT), "friend", 100), [act("playerA", "the-moon-rabbit", ELIXIR_OF_LIFE.id, ["friend"])]);
    expect(hp(s, "friend")).toBe(130);
  });
  it("Moon Glow amplifies healing on every ally; Lucky Foot shields; Mortar Pound is 20", () => {
    const s = turn(withFriend(THE_MOON_RABBIT), [act("playerA", "the-moon-rabbit", MOON_GLOW.id, [])]);
    expect(has(s, "friend", "status.healing-amplification")).toBe(true);
    expect(has(s, "the-moon-rabbit", "status.healing-amplification")).toBe(true);
    expect(has(turn(withFriend(THE_MOON_RABBIT), [act("playerA", "the-moon-rabbit", LUCKY_FOOT.id, ["friend"])]), "friend", "status.shield")).toBe(true);
    expect(500 - hp(turn(hero(THE_MOON_RABBIT), [act("playerA", "the-moon-rabbit", MORTAR_POUND.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("Jiangshi — the breath-thief", () => {
  it("Qi Drain takes 1 energy from the enemy team", () => {
    const state = hero(JIANGSHI);
    const baseline = turn(state, []);
    const drained = turn(state, [act("playerA", "jiangshi", QI_DRAIN.id, ["dummy"])]);
    expect(poolTotal(drained, "playerB")).toBe(poolTotal(baseline, "playerB") - 1);
  });
  it("Hopping Strike is 30, Grave Claw bleeds, Rigor armours", () => {
    expect(500 - hp(turn(hero(JIANGSHI), [act("playerA", "jiangshi", HOPPING_STRIKE.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(hero(JIANGSHI), [act("playerA", "jiangshi", GRAVE_CLAW.id, ["dummy"])]), "dummy", "status.bleed")).toBe(true);
    expect(has(turn(hero(JIANGSHI), [act("playerA", "jiangshi", RIGOR.id, ["jiangshi"])]), "jiangshi", "status.damage-reduction")).toBe(true);
  });
});

describe("Dokkaebi — the goblin's luck", () => {
  it("Magic Club swings for 40, or 20 and a shower of gold (many seeds)", () => {
    const amounts = new Set<number>();
    for (let seed = 1; seed <= 40; seed += 1) amounts.add(500 - hp(turn(hero(DOKKAEBI, defaultResourcesFor(DOKKAEBI), dummy(), seed), [act("playerA", "dokkaebi", MAGIC_CLUB.id, ["dummy"])]), "dummy"));
    expect([...amounts].sort((a, b) => a - b)).toEqual([20, 40]);
  });
  it("Goblin Gold adds energy for the team (net of its own cost)", () => {
    const base = hero(DOKKAEBI);
    const low = { ...base, energyPools: { ...base.energyPools, playerA: { ...base.energyPools.playerA!, might: 0, focus: 1, spirit: 0, chaos: 0, neutral: 0 } } } as BattleState;
    const baseline = turn(low, []);
    const gold = turn(low, [act("playerA", "dokkaebi", GOBLIN_GOLD.id, ["dokkaebi"])]);
    expect(poolTotal(gold, "playerA")).toBe(poolTotal(baseline, "playerA") + 1);
  });
  it("Prank weakens and makes the enemy's abilities cost more; Bump in the Night is 20", () => {
    const s = turn(hero(DOKKAEBI), [act("playerA", "dokkaebi", PRANK.id, ["dummy"])]);
    expect(has(s, "dummy", "status.weakness")).toBe(true);
    expect(has(s, "dummy", "status.energy-cost-increase")).toBe(true);
    expect(500 - hp(turn(hero(DOKKAEBI), [act("playerA", "dokkaebi", BUMP_IN_THE_NIGHT.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The White Fox — kindness with teeth", () => {
  it("Kitsune Grace heals an ally and lifts harmful effects", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_WHITE_FOX), friend] }, { playerId: "playerB", characters: [attacker] });
    const poisoned = turn(withHp(state, "friend", 100), [], [act("playerB", "attacker", poisonHit.id, ["friend"])]);
    expect(has(poisoned, "friend", "status.poison")).toBe(true);
    const cleansed = turn(poisoned, [act("playerA", "the-white-fox", KITSUNE_GRACE.id, ["friend"])]);
    expect(has(cleansed, "friend", "status.poison")).toBe(false);
  });
  it("Bewitch stuns, Mirror Trick reflects, Fox Bite is 20", () => {
    expect(has(turn(hero(THE_WHITE_FOX), [act("playerA", "the-white-fox", BEWITCH.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
    expect(has(turn(hero(THE_WHITE_FOX), [act("playerA", "the-white-fox", MIRROR_TRICK.id, ["the-white-fox"])]), "the-white-fox", "status.reflect")).toBe(true);
    expect(500 - hp(turn(hero(THE_WHITE_FOX), [act("playerA", "the-white-fox", FOX_BITE.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The Roc — from above", () => {
  it("Carry Off is 30 damage and heals the Roc 20", () => {
    const state = withHp(hero(THE_ROC), "the-roc", 100);
    const s = turn(state, [act("playerA", "the-roc", CARRY_OFF.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(30);
    expect(hp(s, "the-roc")).toBe(120);
  });
  it("Wingbeat hits every enemy for 10; Talon Strike is 30; Roost heals 20", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_ROC)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "the-roc", WINGBEAT.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(10);
    expect(dmg(state, s, "second")).toBe(10);
    expect(500 - hp(turn(hero(THE_ROC), [act("playerA", "the-roc", TALON_STRIKE.id, ["dummy"])]), "dummy")).toBe(30);
    expect(hp(turn(withHp(hero(THE_ROC), "the-roc", 100), [act("playerA", "the-roc", ROOST.id, ["the-roc"])]), "the-roc")).toBe(120);
  });
});

describe("The Ghoul — the feast", () => {
  it("heals 10 whenever anyone falls, on either side", () => {
    const killer = { characterId: "killer", maxHp: 100, abilityIds: [lethal.id] };
    const enemyFalls = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_GHOUL), killer] }, { playerId: "playerB", characters: [dummy(20)] });
    const s = turn(withHp(enemyFalls, "the-ghoul", 60), [act("playerA", "killer", lethal.id, ["dummy"])]);
    expect(s.characters.dummy?.alive).toBe(false);
    expect(hp(s, "the-ghoul")).toBe(70);
    const allyFalls = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_GHOUL), { characterId: "weak", maxHp: 10, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
    const t = turn(withHp(allyFalls, "the-ghoul", 60), [], [act("playerB", "attacker", lethal.id, ["weak"])]);
    expect(t.characters.weak?.alive).toBe(false);
    expect(hp(t, "the-ghoul")).toBe(70);
  });
  it("Carrion Stench stops every enemy's healing; Grave Whisper silences; Gnaw poisons; Shroud of Dirt shields", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_GHOUL)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "the-ghoul", CARRION_STENCH.id, [])]);
    expect(has(s, "dummy", "status.anti-heal")).toBe(true);
    expect(has(s, "second", "status.anti-heal")).toBe(true);
    expect(has(turn(hero(THE_GHOUL), [act("playerA", "the-ghoul", GRAVE_WHISPER.id, ["dummy"])]), "dummy", "status.silence")).toBe(true);
    expect(has(turn(hero(THE_GHOUL), [act("playerA", "the-ghoul", GNAW.id, ["dummy"])]), "dummy", "status.poison")).toBe(true);
    expect(has(turn(hero(THE_GHOUL), [act("playerA", "the-ghoul", SHROUD_OF_DIRT.id, ["the-ghoul"])]), "the-ghoul", "status.shield")).toBe(true);
  });
});

describe("The Wandering Genie — three wishes", () => {
  it("starts with three Wishes", () => {
    expect(res(hero(THE_WANDERING_GENIE), "the-wandering-genie", WISHES_RESOURCE.id)).toBe(3);
  });
  it("Wish for Ruin is 50 and spends a Wish; with none left it is only 10", () => {
    const first = turn(hero(THE_WANDERING_GENIE), [act("playerA", "the-wandering-genie", WISH_FOR_RUIN.id, ["dummy"])]);
    expect(500 - hp(first, "dummy")).toBe(50);
    expect(res(first, "the-wandering-genie", WISHES_RESOURCE.id)).toBe(2);
    const spent = turn(hero(THE_WANDERING_GENIE, { [WISHES_RESOURCE.id]: 0 }), [act("playerA", "the-wandering-genie", WISH_FOR_RUIN.id, ["dummy"])]);
    expect(500 - hp(spent, "dummy")).toBe(10);
  });
  it("Wish for Life heals 40 and spends a Wish; with none left it does nothing", () => {
    const state = withHp(withFriend(THE_WANDERING_GENIE), "friend", 100);
    const s = turn(state, [act("playerA", "the-wandering-genie", WISH_FOR_LIFE.id, ["friend"])]);
    expect(hp(s, "friend")).toBe(140);
    expect(res(s, "the-wandering-genie", WISHES_RESOURCE.id)).toBe(2);
    const out = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_WANDERING_GENIE, { resources: { [WISHES_RESOURCE.id]: 0 } }), friend] }, { playerId: "playerB", characters: [dummy()] });
    expect(hp(turn(withHp(out, "friend", 100), [act("playerA", "the-wandering-genie", WISH_FOR_LIFE.id, ["friend"])]), "friend")).toBe(100);
  });
  it("Wish for Wealth spends a Wish; Lamp Light is always 20", () => {
    const s = turn(hero(THE_WANDERING_GENIE), [act("playerA", "the-wandering-genie", WISH_FOR_WEALTH.id, ["the-wandering-genie"])]);
    expect(res(s, "the-wandering-genie", WISHES_RESOURCE.id)).toBe(2);
    expect(500 - hp(turn(hero(THE_WANDERING_GENIE, { [WISHES_RESOURCE.id]: 0 }), [act("playerA", "the-wandering-genie", LAMP_LIGHT.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The Storyteller — a tale in three beats", () => {
  it("Rising Action is 20, or 30 right after Once Upon a Time", () => {
    expect(500 - hp(turn(withFriend(THE_STORYTELLER), [act("playerA", "the-storyteller", RISING_ACTION.id, ["dummy"])]), "dummy")).toBe(20);
    const opened = turn(withFriend(THE_STORYTELLER), [act("playerA", "the-storyteller", ONCE_UPON_A_TIME.id, ["friend"])]);
    expect(has(opened, "friend", "status.shield")).toBe(true);
    expect(dmg(opened, turn(opened, [act("playerA", "the-storyteller", RISING_ACTION.id, ["dummy"])]), "dummy")).toBe(30);
  });
  it("The Twist is 30, or 40 right after Rising Action", () => {
    expect(500 - hp(turn(withFriend(THE_STORYTELLER), [act("playerA", "the-storyteller", THE_TWIST.id, ["dummy"])]), "dummy")).toBe(30);
    const rising = turn(withFriend(THE_STORYTELLER), [act("playerA", "the-storyteller", RISING_ACTION.id, ["dummy"])]);
    expect(dmg(rising, turn(rising, [act("playerA", "the-storyteller", THE_TWIST.id, ["dummy"])]), "dummy")).toBe(40);
  });
  it("Happily Ever After armours every ally", () => {
    const s = turn(withFriend(THE_STORYTELLER), [act("playerA", "the-storyteller", HAPPILY_EVER_AFTER.id, [])]);
    expect(has(s, "friend", "status.damage-reduction")).toBe(true);
    expect(has(s, "the-storyteller", "status.damage-reduction")).toBe(true);
  });
});

describe("The Monkey Trickster — the staff and the cloud", () => {
  it("Pluck Hairs summons a clone; Cloud Somersault hides him", () => {
    const s = turn(hero(THE_MONKEY_TRICKSTER), [act("playerA", "the-monkey-trickster", PLUCK_HAIRS.id, ["the-monkey-trickster"])]);
    expect(Object.values(s.summons).some((x) => x.summonId === "summon.the-monkey-trickster.hair-clone")).toBe(true);
    expect(has(turn(hero(THE_MONKEY_TRICKSTER), [act("playerA", "the-monkey-trickster", CLOUD_SOMERSAULT.id, ["the-monkey-trickster"])]), "the-monkey-trickster", "status.untargetable")).toBe(true);
  });
  it("Steal a Peach is 10 damage and heals him 20; Staff Strike is 30", () => {
    const s = turn(withHp(hero(THE_MONKEY_TRICKSTER), "the-monkey-trickster", 60), [act("playerA", "the-monkey-trickster", STEAL_A_PEACH.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(10);
    expect(hp(s, "the-monkey-trickster")).toBe(80);
    expect(500 - hp(turn(hero(THE_MONKEY_TRICKSTER), [act("playerA", "the-monkey-trickster", STAFF_STRIKE.id, ["dummy"])]), "dummy")).toBe(30);
  });
});

describe("The Thousand-Faced Stranger — the turning faces", () => {
  const id = "the-thousand-faced-stranger";
  it("Face of Wrath is 30, or 50 right after the Face of Fear", () => {
    expect(500 - hp(turn(hero(THE_THOUSAND_FACED_STRANGER), [act("playerA", id, FACE_OF_WRATH.id, ["dummy"])]), "dummy")).toBe(30);
    const afraid = turn(hero(THE_THOUSAND_FACED_STRANGER), [act("playerA", id, FACE_OF_FEAR.id, ["dummy"])]);
    expect(dmg(afraid, turn(afraid, [act("playerA", id, FACE_OF_WRATH.id, ["dummy"])]), "dummy")).toBe(50);
  });
  it("Face of Mercy heals 30 right after the Face of Wrath, otherwise 10", () => {
    const state = withHp(withFriend(THE_THOUSAND_FACED_STRANGER), "friend", 100);
    expect(hp(turn(state, [act("playerA", id, FACE_OF_MERCY.id, ["friend"])]), "friend")).toBe(110);
    const wrathful = turn(state, [act("playerA", id, FACE_OF_WRATH.id, ["dummy"])]);
    expect(hp(turn(wrathful, [act("playerA", id, FACE_OF_MERCY.id, ["friend"])]), "friend")).toBe(130);
  });
  it("Face of Fear stuns right after the Face of Mercy; Blank Face hides him", () => {
    const state = withFriend(THE_THOUSAND_FACED_STRANGER);
    expect(has(turn(state, [act("playerA", id, FACE_OF_FEAR.id, ["dummy"])]), "dummy", "status.stun")).toBe(false);
    const merciful = turn(state, [act("playerA", id, FACE_OF_MERCY.id, ["friend"])]);
    expect(has(turn(merciful, [act("playerA", id, FACE_OF_FEAR.id, ["dummy"])]), "dummy", "status.stun")).toBe(true);
    expect(has(turn(hero(THE_THOUSAND_FACED_STRANGER), [act("playerA", id, BLANK_FACE.id, [id])]), id, "status.untargetable")).toBe(true);
  });
});

describe("Madame Fortuna — the odds", () => {
  // The Gambler rolls High Stakes: usually a 10-damage hit, occasionally a 60 jackpot.
  const gamblerRoll = (state: BattleState, playerId: string, target: string) => turn(state, playerId === "playerA" ? [act("playerA", "the-gambler", HIGH_STAKES.id, [target])] : [], playerId === "playerB" ? [act("playerB", "the-gambler", HIGH_STAKES.id, [target])] : []);
  it("Fortune's Favour forces an ally's next roll to its best branch (60), every time", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MADAME_FORTUNA), member(THE_GAMBLER)] }, { playerId: "playerB", characters: [dummy()] }, seed);
      const blessed = turn(state, [act("playerA", "madame-fortuna", FORTUNES_FAVOUR.id, ["the-gambler"])]);
      expect(dmg(blessed, gamblerRoll(blessed, "playerA", "dummy"), "dummy"), `seed ${seed}`).toBe(60);
    }
  });
  it("Ill Omen forces an enemy's next roll to its worst branch (10), every time, and is then spent", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MADAME_FORTUNA), friend] }, { playerId: "playerB", characters: [member(THE_GAMBLER)] }, seed);
      const cursed = turn(state, [act("playerA", "madame-fortuna", FORTUNA_ILL_OMEN.id, ["the-gambler"])]);
      expect(dmg(cursed, gamblerRoll(cursed, "playerB", "friend"), "friend"), `seed ${seed}`).toBe(10);
    }
  });
  it("does nothing to a character with no random abilities", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MADAME_FORTUNA)] }, { playerId: "playerB", characters: [attacker] });
    const s = turn(state, [act("playerA", "madame-fortuna", FORTUNA_ILL_OMEN.id, ["attacker"])]);
    expect(dmg(s, turn(s, [], [act("playerB", "attacker", hit30.id, ["madame-fortuna"])]), "madame-fortuna")).toBe(30);
  });
  it("Turn the Card is 60, 30 or 10 (many seeds); Wheel of Fortune is a costly gamble on every enemy (Legend lever)", () => {
    const amounts = new Set<number>();
    for (let seed = 1; seed <= 60; seed += 1) amounts.add(500 - hp(turn(hero(MADAME_FORTUNA, defaultResourcesFor(MADAME_FORTUNA), dummy(), seed), [act("playerA", "madame-fortuna", TURN_THE_CARD.id, ["dummy"])]), "dummy"));
    expect([...amounts].sort((a, b) => a - b)).toEqual([10, 30, 60]);
    expect(WHEEL_OF_FORTUNE.cooldown).toBeGreaterThanOrEqual(5);
    expect(Object.values(WHEEL_OF_FORTUNE.cost).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(6);
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MADAME_FORTUNA)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "madame-fortuna", WHEEL_OF_FORTUNE.id, [])]);
    expect(dmg(state, s, "dummy") > 0 || has(s, "dummy", "status.stun")).toBe(true);
  });
  it("her vulnerability: below half health her own next roll is forced to its worst (10)", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MADAME_FORTUNA)] }, { playerId: "playerB", characters: [attacker, dummy()] }, seed);
      const hurt = turn(withHp(state, "madame-fortuna", 50), [], [act("playerB", "attacker", hit10.id, ["madame-fortuna"])]);
      expect(dmg(hurt, turn(hurt, [act("playerA", "madame-fortuna", TURN_THE_CARD.id, ["dummy"])]), "dummy"), `seed ${seed}`).toBe(10);
    }
  });
  it("COUNTER: Father Bell's Hush silences her so she cannot queue a rigged roll", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(MADAME_FORTUNA), member(THE_GAMBLER)] }, { playerId: "playerB", characters: [member(FATHER_BELL)] });
    const hushed = turn(state, [], [act("playerB", "father-bell", HUSH.id, ["madame-fortuna"])]);
    expect(has(hushed, "madame-fortuna", "status.silence")).toBe(true);
    expect(resolveTurn(hushed, [act("playerA", "madame-fortuna", FORTUNES_FAVOUR.id, ["the-gambler"])], [], deps()).ok).toBe(false);
  });
});
