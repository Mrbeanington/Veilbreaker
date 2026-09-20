import { describe, expect, it } from "vitest";
import {
  BELLOWING_CHARGE,
  BLUE_ONI,
  BONE_FIST,
  BRUSH_STROKE,
  BURN_BRIGHT,
  CLAW_SWIPE,
  COOL_HEAD,
  CRIMSON_CLEAVE,
  DEVOUR,
  DRAG_UNDER,
  DRAW_THE_FIRE,
  EMBER_CURSE,
  FINAL_BRUSH_STROKE,
  FLICKER,
  FOLD_A_CRANE,
  FROST_BREATH,
  GASHADOKURO,
  GUIDING_FLAME,
  IAI_STRIKE,
  INK_BLOT,
  INK_WASH,
  KANABO_SWEEP,
  KAPPA_KIRO,
  KISS_OF_WINTER,
  LANTERN_SPIRIT,
  NEKOMATA,
  ONI_OF_THE_RED_GATE,
  OPEN_THE_GATE,
  OPEN_UMBRELLA,
  PERFECT_REFLECTION,
  POLISHED_GUARD,
  PORTRAIT_OF_A_FOE,
  PRAYER_SLIP,
  RAIN_DANCE,
  READY_STANCE,
  RED_ONI,
  REFILL_THE_DISH,
  RESOURCE_LIBRARY,
  RISE_AGAIN,
  RIVERBANK_GRAB,
  SEAL_CHARM,
  SUMO_THROW,
  TENGU_SWORDSMAN,
  THE_MIRROR_SAMURAI,
  THE_PAINTED_RONIN,
  THE_PAPER_MONK,
  TONGUE_LASH,
  UMBRELLA_YOKAI,
  VANISH_INTO_SNOW,
  WAITING_BLADE,
  YUKI_ONNA,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, validateAction, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 2 (Japanese Folklore / Ink Realm): signature-mechanic tests.

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

describe("Red Oni and Blue Oni — the brothers", () => {
  const solo = () => hero(RED_ONI);
  const pair = () =>
    freshScenarioBattle({ playerId: "playerA", characters: [member(RED_ONI), member(BLUE_ONI)] }, { playerId: "playerB", characters: [dummy()] });
  it("Bellowing Charge is 50 damage and costs Red Oni 20 health, unless Blue Oni is beside him", () => {
    const alone = turn(solo(), [act("playerA", "red-oni", BELLOWING_CHARGE.id, ["dummy"])]);
    expect(dmg(solo(), alone, "dummy")).toBe(50);
    expect(RED_ONI.baseHp - hp(alone, "red-oni")).toBe(20);
    const together = turn(pair(), [act("playerA", "red-oni", BELLOWING_CHARGE.id, ["dummy"])]);
    expect(dmg(pair(), together, "dummy")).toBe(50);
    expect(hp(together, "red-oni")).toBe(RED_ONI.baseHp);
  });
  it("Kanabo Sweep hits every enemy for 20", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(RED_ONI)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "red-oni", KANABO_SWEEP.id, [])]);
    expect(dmg(state, s, "dummy")).toBe(20);
    expect(dmg(state, s, "second")).toBe(20);
  });
  it("Cool Head shields 20 alone and 40 with Red Oni on the team", () => {
    const foe = { ...attacker };
    const blueAlone = freshScenarioBattle({ playerId: "playerA", characters: [member(BLUE_ONI)] }, { playerId: "playerB", characters: [foe] });
    const a = turn(turn(blueAlone, [act("playerA", "blue-oni", COOL_HEAD.id, ["blue-oni"])]), [], [act("playerB", "attacker", hit30.id, ["blue-oni"])]);
    expect(BLUE_ONI.baseHp - hp(a, "blue-oni")).toBe(10); // 30 hit, 20 absorbed
    const together = freshScenarioBattle({ playerId: "playerA", characters: [member(BLUE_ONI), member(RED_ONI)] }, { playerId: "playerB", characters: [foe] });
    const b = turn(turn(together, [act("playerA", "blue-oni", COOL_HEAD.id, ["blue-oni"])]), [], [act("playerB", "attacker", hit30.id, ["blue-oni"])]);
    expect(hp(b, "blue-oni")).toBe(BLUE_ONI.baseHp); // 40 absorbs all of it
  });
  it("Brothers' Bond: with Red Oni beside him he mends 10 each turn; alone he does not", () => {
    const hurtIn = (s: BattleState) => ({ ...s, characters: { ...s.characters, "blue-oni": { ...s.characters["blue-oni"]!, currentHp: 100 } } });
    const together = freshScenarioBattle({ playerId: "playerA", characters: [member(BLUE_ONI), member(RED_ONI)] }, { playerId: "playerB", characters: [dummy()] });
    expect(hp(turn(hurtIn(together), []), "blue-oni")).toBe(110);
    const alone = freshScenarioBattle({ playerId: "playerA", characters: [member(BLUE_ONI)] }, { playerId: "playerB", characters: [dummy()] });
    expect(hp(turn(hurtIn(alone), []), "blue-oni")).toBe(100);
  });
  it("Draw the Fire taunts and shields; Icy Grip chills", () => {
    const s = turn(hero(BLUE_ONI), [act("playerA", "blue-oni", DRAW_THE_FIRE.id, ["blue-oni"])]);
    expect(has(s, "blue-oni", "status.taunt") && has(s, "blue-oni", "status.shield")).toBe(true);
    const c = turn(hero(BLUE_ONI), [act("playerA", "blue-oni", "ability.blue-oni.icy-grip", ["dummy"])]);
    expect(has(c, "dummy", "status.cooldown-increase")).toBe(true);
  });
});

describe("Kappa Kiro — the dish", () => {
  const withFoe = () => freshScenarioBattle({ playerId: "playerA", characters: [member(KAPPA_KIRO)] }, { playerId: "playerB", characters: [attacker] });
  it("every wound spills water, and an empty dish leaves him open", () => {
    let s = withFoe();
    for (let i = 0; i < 3; i += 1) s = turn(s, [], [act("playerB", "attacker", hit10.id, ["kappa-kiro"])]);
    expect(res(s, "kappa-kiro", "resource.dish")).toBe(0);
    expect(has(s, "kappa-kiro", "status.damage-amplification")).toBe(true);
  });
  it("Riverbank Grab is 30 with two Water and 10 without", () => {
    expect(dmg(hero(KAPPA_KIRO), turn(hero(KAPPA_KIRO), [act("playerA", "kappa-kiro", RIVERBANK_GRAB.id, ["dummy"])]), "dummy")).toBe(30);
    const dry = turn(hero(KAPPA_KIRO, { "resource.dish": 1 }), [act("playerA", "kappa-kiro", RIVERBANK_GRAB.id, ["dummy"])]);
    expect(500 - hp(dry, "dummy")).toBe(10);
  });
  it("Refill the Dish fills it and heals; Sumo Throw spends a Water", () => {
    const refilled = turn(hero(KAPPA_KIRO, { "resource.dish": 0 }), [act("playerA", "kappa-kiro", REFILL_THE_DISH.id, ["kappa-kiro"])]);
    expect(res(refilled, "kappa-kiro", "resource.dish")).toBe(3);
    const throwing = turn(hero(KAPPA_KIRO), [act("playerA", "kappa-kiro", SUMO_THROW.id, ["dummy"])]);
    expect(500 - hp(throwing, "dummy")).toBe(40);
    expect(res(throwing, "kappa-kiro", "resource.dish")).toBe(2);
  });
  it("Drag Under stuns with a full dish (spending two Water), only weakens otherwise", () => {
    const full = turn(hero(KAPPA_KIRO), [act("playerA", "kappa-kiro", DRAG_UNDER.id, ["dummy"])]);
    expect(has(full, "dummy", "status.stun")).toBe(true);
    expect(res(full, "kappa-kiro", "resource.dish")).toBe(1);
    const low = turn(hero(KAPPA_KIRO, { "resource.dish": 2 }), [act("playerA", "kappa-kiro", DRAG_UNDER.id, ["dummy"])]);
    expect(has(low, "dummy", "status.stun")).toBe(false);
    expect(has(low, "dummy", "status.weakness")).toBe(true);
  });
});

describe("Yuki-Onna — chill, then freeze", () => {
  it("Frost Breath chills every enemy", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(YUKI_ONNA)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "yuki-onna", FROST_BREATH.id, [])]);
    expect(has(s, "dummy", "status.cooldown-increase") && has(s, "second", "status.cooldown-increase")).toBe(true);
    expect(dmg(state, s, "dummy")).toBe(10);
  });
  it("Kiss of Winter: 20 and a chill on a clean enemy, 30 and a stun on a chilled one", () => {
    const first = turn(hero(YUKI_ONNA), [act("playerA", "yuki-onna", KISS_OF_WINTER.id, ["dummy"])]);
    expect(500 - hp(first, "dummy")).toBe(20);
    expect(has(first, "dummy", "status.cooldown-increase")).toBe(true);
    expect(has(first, "dummy", "status.stun")).toBe(false);
    const ready = { ...first, characters: { ...first.characters, "yuki-onna": { ...first.characters["yuki-onna"]!, cooldowns: {} } } };
    const second = turn(ready, [act("playerA", "yuki-onna", KISS_OF_WINTER.id, ["dummy"])]);
    expect(dmg(ready, second, "dummy")).toBe(30);
    expect(has(second, "dummy", "status.stun")).toBe(true);
  });
  it("Vanish into Snow hides her and heals; Winter Lullaby weakens", () => {
    expect(has(turn(hero(YUKI_ONNA), [act("playerA", "yuki-onna", VANISH_INTO_SNOW.id, ["yuki-onna"])]), "yuki-onna", "status.untargetable")).toBe(true);
    expect(has(turn(hero(YUKI_ONNA), [act("playerA", "yuki-onna", "ability.yuki-onna.winter-lullaby", ["dummy"])]), "dummy", "status.weakness")).toBe(true);
  });
});

describe("Tengu Swordsman — wait, then strike", () => {
  it("Iai Strike is 20 on its own", () => {
    expect(500 - hp(turn(hero(TENGU_SWORDSMAN), [act("playerA", "tengu-swordsman", IAI_STRIKE.id, ["dummy"])]), "dummy")).toBe(20);
  });
  it("right after Waiting Blade it is 70; not after anything else, and only once", () => {
    const waited = turn(hero(TENGU_SWORDSMAN), [act("playerA", "tengu-swordsman", WAITING_BLADE.id, ["tengu-swordsman"])]);
    const struck = turn(waited, [act("playerA", "tengu-swordsman", IAI_STRIKE.id, ["dummy"])]);
    expect(dmg(waited, struck, "dummy")).toBe(70);
    const rested = turn(struck, []); // Iai Strike has a 1-turn cooldown
    const again = turn(rested, [act("playerA", "tengu-swordsman", IAI_STRIKE.id, ["dummy"])]);
    expect(dmg(rested, again, "dummy")).toBe(20);
  });
  it("Waiting Blade returns 30 to whoever strikes him", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(TENGU_SWORDSMAN)] }, { playerId: "playerB", characters: [attacker] });
    const waited = turn(state, [act("playerA", "tengu-swordsman", WAITING_BLADE.id, ["tengu-swordsman"])]);
    const s = turn(waited, [], [act("playerB", "attacker", hit10.id, ["tengu-swordsman"])]);
    expect(dmg(waited, s, "attacker")).toBe(30);
  });
  it("Feather Fan hits everyone for 10; Gale Step shortens his cooldowns", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(TENGU_SWORDSMAN)] }, { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] });
    const s = turn(state, [act("playerA", "tengu-swordsman", "ability.tengu-swordsman.feather-fan", [])]);
    expect(dmg(state, s, "dummy") + dmg(state, s, "second")).toBe(20);
    expect(has(turn(hero(TENGU_SWORDSMAN), [act("playerA", "tengu-swordsman", "ability.tengu-swordsman.gale-step", ["tengu-swordsman"])]), "tengu-swordsman", "status.cooldown-reduction")).toBe(true);
  });
});

describe("Lantern Spirit — energy for the team", () => {
  it("Guiding Flame gives the team 2 Spirit for 1 spent", () => {
    const start = hero(LANTERN_SPIRIT);
    const control = turn(start, []);
    const s = turn(start, [act("playerA", "lantern-spirit", GUIDING_FLAME.id, ["lantern-spirit"])]);
    expect(pool(s, "playerA")).toBe(pool(control, "playerA") - 1 + 2);
  });
  it("Burn Bright costs him 20 health and gives 2 Might and 1 Chaos", () => {
    const start = hero(LANTERN_SPIRIT);
    const control = turn(start, []);
    const s = turn(start, [act("playerA", "lantern-spirit", BURN_BRIGHT.id, ["lantern-spirit"])]);
    expect(LANTERN_SPIRIT.baseHp - hp(s, "lantern-spirit")).toBe(20);
    expect(pool(s, "playerA")).toBe(pool(control, "playerA") + 3);
  });
  it("Last Light: when he dies his team gains 2 Spirit", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(LANTERN_SPIRIT)] }, { playerId: "playerB", characters: [attacker] });
    const withoutPassive = freshScenarioBattle({ playerId: "playerA", characters: [member(LANTERN_SPIRIT, { passiveId: undefined })] }, { playerId: "playerB", characters: [attacker] });
    const kill = [act("playerB", "attacker", lethal.id, ["lantern-spirit"])];
    const s = turn(state, [], kill);
    const control = turn(withoutPassive, [], kill);
    expect(s.characters["lantern-spirit"]?.alive).toBe(false);
    expect(pool(s, "playerA")).toBe(pool(control, "playerA") + 2);
  });
  it("Flicker burns", () => {
    expect(has(turn(hero(LANTERN_SPIRIT), [act("playerA", "lantern-spirit", FLICKER.id, ["dummy"])]), "dummy", "status.burn")).toBe(true);
  });
});

describe("Umbrella Yokai — tongue, shelter and rain", () => {
  it("Tongue Lash licks one energy from the enemy for himself and weakens it", () => {
    const start = hero(UMBRELLA_YOKAI);
    const control = turn(start, []);
    const s = turn(start, [act("playerA", "umbrella-yokai", TONGUE_LASH.id, ["dummy"])]);
    expect(pool(s, "playerB")).toBe(pool(control, "playerB") - 1);
    expect(has(s, "dummy", "status.weakness")).toBe(true);
  });
  it("Open Umbrella shelters an ally: they take 20 less", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(UMBRELLA_YOKAI), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [attacker] });
    const sheltered = turn(state, [act("playerA", "umbrella-yokai", OPEN_UMBRELLA.id, ["friend"])]);
    const s = turn(sheltered, [], [act("playerB", "attacker", hit30.id, ["friend"])]);
    expect(dmg(sheltered, s, "friend")).toBe(10);
  });
  it("Rain Dance hits everyone for 10 and makes their next turn dearer", () => {
    const s = turn(hero(UMBRELLA_YOKAI), [act("playerA", "umbrella-yokai", RAIN_DANCE.id, [])]);
    expect(500 - hp(s, "dummy")).toBe(10);
    expect(has(s, "dummy", "status.energy-cost-increase")).toBe(true);
  });
});

describe("The Paper Monk — cranes, prayers and seals", () => {
  it("Fold a Crane creates a 30-health familiar that does not take a slot", () => {
    const s = turn(hero(THE_PAPER_MONK), [act("playerA", "the-paper-monk", FOLD_A_CRANE.id, ["the-paper-monk"])]);
    const cranes = Object.values(s.summons);
    expect(cranes).toHaveLength(1);
    expect(cranes[0]?.summonId).toBe("summon.the-paper-monk.paper-crane-familiar");
    expect(cranes[0]?.currentHp).toBe(30);
  });
  it("Prayer Slip heals an ally 20; Seal Charm silences; Ink Blot weakens", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_PAPER_MONK), { characterId: "friend", maxHp: 200, abilityIds: [] }] }, { playerId: "playerB", characters: [dummy()] });
    const hurt = { ...state, characters: { ...state.characters, friend: { ...state.characters.friend!, currentHp: 100 } } };
    expect(hp(turn(hurt, [act("playerA", "the-paper-monk", PRAYER_SLIP.id, ["friend"])]), "friend")).toBe(120);
    expect(has(turn(hero(THE_PAPER_MONK), [act("playerA", "the-paper-monk", SEAL_CHARM.id, ["dummy"])]), "dummy", "status.silence")).toBe(true);
    const blot = turn(hero(THE_PAPER_MONK), [act("playerA", "the-paper-monk", INK_BLOT.id, ["dummy"])]);
    expect(500 - hp(blot, "dummy")).toBe(10);
    expect(has(blot, "dummy", "status.weakness")).toBe(true);
  });
});

describe("Nekomata — Rise Again", () => {
  const team = () =>
    freshScenarioBattle(
      { playerId: "playerA", characters: [member(NEKOMATA), { characterId: "friend", maxHp: 200, abilityIds: [] }] },
      { playerId: "playerB", characters: [attacker] },
    );
  const fallen = () => turn(team(), [], [act("playerB", "attacker", lethal.id, ["friend"])]);
  it("calls a fallen ally back at 30% health, once", () => {
    const dead = fallen();
    expect(dead.characters.friend?.alive).toBe(false);
    const s = turn(dead, [act("playerA", "nekomata", RISE_AGAIN.id, ["friend"])]);
    expect(s.characters.friend?.alive).toBe(true);
    expect(hp(s, "friend")).toBe(60);
    expect(res(s, "nekomata", "resource.second-life")).toBe(0);
  });
  it("cannot target the living, only the fallen (and nothing without a Second Life)", () => {
    expect(validateAction(team(), act("playerA", "nekomata", RISE_AGAIN.id, ["friend"]), deps().abilities).length).toBeGreaterThan(0);
    const dead = fallen();
    expect(validateAction(dead, act("playerA", "nekomata", RISE_AGAIN.id, ["friend"]), deps().abilities)).toEqual([]);
    const spent = { ...dead, characters: { ...dead.characters, nekomata: { ...dead.characters.nekomata!, resources: { "resource.second-life": 0 } } } };
    const s = turn(spent, [act("playerA", "nekomata", RISE_AGAIN.id, ["friend"])]);
    expect(s.characters.friend?.alive).toBe(false);
  });
  it("Resurrection Lock stops it", () => {
    const dead = fallen();
    const locked = { ...dead, characters: { ...dead.characters, friend: { ...dead.characters.friend!, statuses: [{ statusId: "status.resurrection-lock", remainingTurns: 3, stacks: 1, magnitude: 0, sourceId: "attacker" }] } } } as unknown as BattleState;
    const s = turn(locked, [act("playerA", "nekomata", RISE_AGAIN.id, ["friend"])]);
    expect(s.characters.friend?.alive).toBe(false);
  });
  it("Cursed Purr curses; Claw Swipe is 20; Lick Wounds heals herself", () => {
    expect(has(turn(hero(NEKOMATA), [act("playerA", "nekomata", "ability.nekomata.cursed-purr", ["dummy"])]), "dummy", "status.curse")).toBe(true);
    expect(500 - hp(turn(hero(NEKOMATA), [act("playerA", "nekomata", CLAW_SWIPE.id, ["dummy"])]), "dummy")).toBe(20);
  });
});

describe("The Mirror Samurai — counter, reflect, answer", () => {
  const withFoe = () => freshScenarioBattle({ playerId: "playerA", characters: [member(THE_MIRROR_SAMURAI)] }, { playerId: "playerB", characters: [attacker] });
  it("Perfect Reflection is 20, or 50 straight after Polished Guard", () => {
    const start = hero(THE_MIRROR_SAMURAI);
    expect(500 - hp(turn(start, [act("playerA", "the-mirror-samurai", PERFECT_REFLECTION.id, ["dummy"])]), "dummy")).toBe(20);
    const guarded = turn(start, [act("playerA", "the-mirror-samurai", POLISHED_GUARD.id, ["the-mirror-samurai"])]);
    const answered = turn(guarded, [act("playerA", "the-mirror-samurai", PERFECT_REFLECTION.id, ["dummy"])]);
    expect(dmg(guarded, answered, "dummy")).toBe(50);
  });
  it("Polished Guard throws a blow back; Ready Stance returns 20", () => {
    const guarded = turn(withFoe(), [act("playerA", "the-mirror-samurai", POLISHED_GUARD.id, ["the-mirror-samurai"])]);
    const s = turn(guarded, [], [act("playerB", "attacker", hit30.id, ["the-mirror-samurai"])]);
    expect(hp(s, "the-mirror-samurai")).toBe(THE_MIRROR_SAMURAI.baseHp);
    expect(dmg(guarded, s, "attacker")).toBe(30);
    const ready = turn(withFoe(), [act("playerA", "the-mirror-samurai", READY_STANCE.id, ["the-mirror-samurai"])]);
    const c = turn(ready, [], [act("playerB", "attacker", hit10.id, ["the-mirror-samurai"])]);
    expect(dmg(ready, c, "attacker")).toBe(20);
  });
  it("Study the Foe speeds his cooldowns", () => {
    expect(has(turn(hero(THE_MIRROR_SAMURAI), [act("playerA", "the-mirror-samurai", "ability.the-mirror-samurai.study-the-foe", ["the-mirror-samurai"])]), "the-mirror-samurai", "status.cooldown-reduction")).toBe(true);
  });
});

describe("Gashadokuro — hunger", () => {
  it("gains a Hunger every turn, and from three is weakened until it feeds", () => {
    let s = hero(GASHADOKURO);
    s = turn(s, []);
    expect(res(s, "gashadokuro", "resource.gasha-hunger")).toBe(1);
    expect(has(s, "gashadokuro", "status.weakness")).toBe(false);
    s = turn(turn(s, []), []);
    expect(res(s, "gashadokuro", "resource.gasha-hunger")).toBe(3);
    expect(has(s, "gashadokuro", "status.weakness")).toBe(true);
  });
  it("Devour: 20 damage and 20 healed; with three Hunger 60 and 30, spending it (his own Hunger-weakness takes 10 off)", () => {
    const wounded = (s: BattleState) => ({ ...s, characters: { ...s.characters, gashadokuro: { ...s.characters.gashadokuro!, currentHp: 100 } } });
    const plain = turn(wounded(hero(GASHADOKURO)), [act("playerA", "gashadokuro", DEVOUR.id, ["dummy"])]);
    expect(500 - hp(plain, "dummy")).toBe(20);
    expect(hp(plain, "gashadokuro")).toBeGreaterThanOrEqual(120);
    const starving = turn(wounded(hero(GASHADOKURO, { "resource.gasha-hunger": 3 })), [act("playerA", "gashadokuro", DEVOUR.id, ["dummy"])]);
    expect(500 - hp(starving, "dummy")).toBe(50); // 60, less the 10 his starving bones cost him
    expect(hp(starving, "gashadokuro")).toBeGreaterThanOrEqual(130);
    expect(res(starving, "gashadokuro", "resource.gasha-hunger")).toBeLessThanOrEqual(1);
  });
  it("Bone Fist is 30, Grasp of the Starved stuns, Rattling Dread frightens and weakens", () => {
    expect(500 - hp(turn(hero(GASHADOKURO), [act("playerA", "gashadokuro", BONE_FIST.id, ["dummy"])]), "dummy")).toBe(30);
    expect(has(turn(hero(GASHADOKURO), [act("playerA", "gashadokuro", "ability.gashadokuro.grasp-of-the-starved", ["dummy"])]), "dummy", "status.stun")).toBe(true);
    const d = turn(hero(GASHADOKURO), [act("playerA", "gashadokuro", "ability.gashadokuro.rattling-dread", ["dummy"])]);
    expect(has(d, "dummy", "status.fear") && has(d, "dummy", "status.weakness")).toBe(true);
  });
});

describe("Oni of the Red Gate [SECRET] — a closing gate", () => {
  it("starts with three pips and loses one every turn", () => {
    const start = hero(ONI_OF_THE_RED_GATE);
    expect(res(start, "oni-of-the-red-gate", "resource.red-gate")).toBe(3);
    expect(res(turn(start, []), "oni-of-the-red-gate", "resource.red-gate")).toBe(2);
    expect(res(turn(turn(turn(turn(start, []), []), []), []), "oni-of-the-red-gate", "resource.red-gate")).toBe(0);
  });
  it("Crimson Cleave: 80 / 60 / 40 / 20 by pips remaining after the turn's loss", () => {
    for (const [gate, expected] of [[4, 60], [3, 40], [2, 30], [1, 10]] as const) {
      // The Gate closes at turn start, before the Cleave: a starting value of 4 is capped at 3, so use resources directly.
      const start = hero(ONI_OF_THE_RED_GATE, { "resource.red-gate": Math.min(3, gate) });
      const s = turn(start, [act("playerA", "oni-of-the-red-gate", CRIMSON_CLEAVE.id, ["dummy"])]);
      const pips = Math.max(0, Math.min(3, gate) - 1);
      const want = pips >= 3 ? 80 : pips >= 2 ? 60 : pips >= 1 ? 40 : 20;
      expect(500 - hp(s, "dummy")).toBe(want);
      expect(expected).toBeGreaterThan(0);
    }
  });
  it("Open the Gate pays 20 health for two pips; Ember Curse curses and weakens", () => {
    const s = turn(hero(ONI_OF_THE_RED_GATE, { "resource.red-gate": 0 }), [act("playerA", "oni-of-the-red-gate", OPEN_THE_GATE.id, ["oni-of-the-red-gate"])]);
    expect(ONI_OF_THE_RED_GATE.baseHp - hp(s, "oni-of-the-red-gate")).toBe(20);
    expect(res(s, "oni-of-the-red-gate", "resource.red-gate")).toBe(2);
    const c = turn(hero(ONI_OF_THE_RED_GATE), [act("playerA", "oni-of-the-red-gate", EMBER_CURSE.id, ["dummy"])]);
    expect(has(c, "dummy", "status.curse") && has(c, "dummy", "status.weakness")).toBe(true);
  });
});

describe("The Painted Ronin [SECRET] — ink", () => {
  it("Brush Stroke is 10 and one Ink; Ink Wash gives two Ink and a turn of armour", () => {
    const b = turn(hero(THE_PAINTED_RONIN), [act("playerA", "the-painted-ronin", BRUSH_STROKE.id, ["dummy"])]);
    expect(500 - hp(b, "dummy")).toBe(10);
    expect(res(b, "the-painted-ronin", "resource.ink")).toBe(1);
    const w = turn(hero(THE_PAINTED_RONIN), [act("playerA", "the-painted-ronin", INK_WASH.id, ["the-painted-ronin"])]);
    expect(res(w, "the-painted-ronin", "resource.ink")).toBe(2);
    expect(has(w, "the-painted-ronin", "status.damage-reduction")).toBe(true);
  });
  it("Final Stroke is 20, or 70 with four Ink (spent)", () => {
    expect(500 - hp(turn(hero(THE_PAINTED_RONIN), [act("playerA", "the-painted-ronin", FINAL_BRUSH_STROKE.id, ["dummy"])]), "dummy")).toBe(20);
    const full = turn(hero(THE_PAINTED_RONIN, { "resource.ink": 4 }), [act("playerA", "the-painted-ronin", FINAL_BRUSH_STROKE.id, ["dummy"])]);
    expect(500 - hp(full, "dummy")).toBe(70);
    expect(res(full, "the-painted-ronin", "resource.ink")).toBe(0);
  });
  it("Portrait of a Foe weakens, and with two Ink spent also slows cooldowns", () => {
    const poor = turn(hero(THE_PAINTED_RONIN), [act("playerA", "the-painted-ronin", PORTRAIT_OF_A_FOE.id, ["dummy"])]);
    expect(has(poor, "dummy", "status.weakness")).toBe(true);
    expect(has(poor, "dummy", "status.cooldown-increase")).toBe(false);
    const rich = turn(hero(THE_PAINTED_RONIN, { "resource.ink": 3 }), [act("playerA", "the-painted-ronin", PORTRAIT_OF_A_FOE.id, ["dummy"])]);
    expect(has(rich, "dummy", "status.cooldown-increase")).toBe(true);
    expect(res(rich, "the-painted-ronin", "resource.ink")).toBe(1);
  });
});
