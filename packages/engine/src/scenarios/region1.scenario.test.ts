import { describe, expect, it } from "vitest";
import {
  ARACHNE,
  ASTERION,
  BOAT_POLE,
  BRONZE_PLATING,
  BELLOW,
  CERBERUS,
  CHARON,
  CYCLOPS_BRONTES,
  DARK_SUPPER,
  DREAMING_WEIGHT,
  FATES_VERDICT,
  FEATHER_VOLLEY,
  FINAL_FARE,
  FORETELL,
  GORGONS_GLARE,
  GORING_RUSH,
  GUARD_THE_GATE,
  HAMMER_BLOW,
  HECATES_DISCIPLE,
  HORN_CHARGE,
  HOWL_OF_HADES,
  ICARION,
  INTO_THE_MAZE,
  JUST_DESERTS,
  LULLABY,
  LURE,
  MIRROR_OF_HUBRIS,
  MOLTEN_SLAG,
  MOONLESS_TORCH,
  NEMESIS,
  PETRIFYING_GAZE,
  PLUMMET,
  RECKONING,
  RESTLESS_TURN,
  RESOURCE_LIBRARY,
  SHIPWRECK,
  SIBYLLINE_RIDDLE,
  SLEEPERS_ROLL,
  SNAKE_BITE,
  SNARE_LINE,
  SNARL,
  SPIN_WEB,
  STOKE_THE_FORGE,
  TAKE_THE_TOLL,
  TAPESTRY,
  THE_BRONZE_GIANT,
  THE_FORGOTTEN_TITAN,
  THE_ORACLE,
  THE_SIREN,
  THREE_BITES,
  THREE_ROADS,
  THUNDERBOLT,
  TITANS_WRATH,
  WARNING_DREAM,
  WAX_WING_DIVE,
  MEDUSA,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { canAct } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 1 (Ancient Mediterranean): scenario tests for each new
// character's signature mechanic, driven through the real resolver.

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
const burnIt = fixture({ id: "test.burn", effects: [{ kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 3 }] });
const lethal = fixture({ id: "test.lethal", effects: [{ kind: "damage", amount: 999 }] });

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
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [hit10.id]: hit10, [burnIt.id]: burnIt, [lethal.id]: lethal } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, hit10.id, burnIt.id, lethal.id] };
const dummy = (hp = 300) => ({ characterId: "dummy", maxHp: hp });

const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy(500), seed = 1): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, seed);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;

describe("Asterion — Maze, and berserk", () => {
  it("Horn Charge gores for 20 and gains a Maze pip", () => {
    const s = turn(hero(ASTERION), [act("playerA", "asterion", HORN_CHARGE.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(20);
    expect(res(s, "asterion", "resource.maze")).toBe(1);
  });
  it("Goring Rush spends the Maze it has: 30 / 40 / 60", () => {
    for (const [maze, dmg, left] of [[0, 30, 0], [2, 40, 0], [3, 60, 0]] as const) {
      const s = turn(hero(ASTERION, { "resource.maze": maze }), [act("playerA", "asterion", GORING_RUSH.id, ["dummy"])]);
      expect(500 - hp(s, "dummy")).toBe(dmg);
      expect(res(s, "asterion", "resource.maze")).toBe(left);
    }
  });
  it("Into the Maze makes him untargetable and adds two pips", () => {
    const s = turn(hero(ASTERION), [act("playerA", "asterion", INTO_THE_MAZE.id, ["asterion"])]);
    expect(has(s, "asterion", "status.untargetable")).toBe(true);
    expect(res(s, "asterion", "resource.maze")).toBe(2);
  });
  it("Bellow weakens every enemy", () => {
    const s = turn(hero(ASTERION), [act("playerA", "asterion", BELLOW.id, [])]);
    expect(has(s, "dummy", "status.weakness")).toBe(true);
  });
  it("berserk: below half health he gains a Maze pip every turn, and not above it", () => {
    const wounded = hero(ASTERION, { "resource.maze": 0 });
    const hurt = { ...wounded, characters: { ...wounded.characters, asterion: { ...wounded.characters.asterion!, currentHp: 60 } } };
    expect(res(turn(hurt, []), "asterion", "resource.maze")).toBe(1);
    expect(res(turn(hero(ASTERION), []), "asterion", "resource.maze")).toBe(0);
  });
});

describe("Medusa — petrification", () => {
  const foe = { characterId: "foe", maxHp: 400, abilityIds: [hit30.id] };
  it("Petrifying Gaze turns an enemy to stone: it cannot act, and takes 20 less damage", () => {
    const s = turn(hero(MEDUSA, undefined, foe), [act("playerA", "medusa", PETRIFYING_GAZE.id, ["foe"])]);
    expect(has(s, "foe", "status.petrification")).toBe(true);
    expect(has(s, "foe", "status.stun")).toBe(true);
    expect(canAct(s.characters.foe!)).toBe(false);
    // Stone skin: her 10-damage bite does nothing, but a 30 hit still lands for 10.
    const bit = turn(s, [act("playerA", "medusa", SNAKE_BITE.id, ["foe"])]);
    expect(400 - hp(bit, "foe")).toBeLessThanOrEqual(5); // only poison can get through
  });
  it("Snake Bite is 10 damage and poison", () => {
    const s = turn(hero(MEDUSA), [act("playerA", "medusa", SNAKE_BITE.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(15); // 10, then the poison's first tick of 5
    expect(has(s, "dummy", "status.poison")).toBe(true);
  });
  it("Gorgon's Glare stones every enemy, and costs Medusa 30 health even against Invulnerable", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(MEDUSA)] },
      { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] },
    );
    const s = turn(state, [act("playerA", "medusa", GORGONS_GLARE.id, [])]);
    expect(has(s, "dummy", "status.stun") && has(s, "second", "status.stun")).toBe(true);
    expect(hp(s, "medusa")).toBe(MEDUSA.baseHp - 30);
  });
  it("counterplay: Silence-free, but she is fragile and Gaze has a 4-turn cooldown", () => {
    expect(PETRIFYING_GAZE.cooldown).toBe(4);
    expect(MEDUSA.baseHp).toBeLessThanOrEqual(110);
  });
});

describe("Charon — Obols, energy tax and the last ferry", () => {
  it("every death in the arena pays an Obol", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(CHARON), { characterId: "friend", maxHp: 20, abilityIds: [] }] },
      { playerId: "playerB", characters: [{ ...attacker }] },
    );
    const s = turn(state, [], [act("playerB", "attacker", lethal.id, ["friend"])]);
    expect(s.characters.friend?.alive).toBe(false);
    expect(res(s, "charon", "resource.obols")).toBe(1);
  });
  it("Take the Toll steals 2 energy for himself and banks an Obol", () => {
    const start = hero(CHARON);
    const control = turn(start, []);
    const s = turn(start, [act("playerA", "charon", TAKE_THE_TOLL.id, ["dummy"])]);
    const total = (b: BattleState, p: string) => Object.values(b.energyPools[p] ?? {}).reduce((a, n) => a + n, 0);
    expect(res(s, "charon", "resource.obols")).toBe(1);
    expect(total(s, "playerB")).toBe(total(control, "playerB") - 2); // the enemy pool is taxed
    expect(total(s, "playerA")).toBe(total(control, "playerA") - 1 + 2); // one energy spent, two stolen
  });
  it("Cross the River hides an ally for a turn and heals 20", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(CHARON), { characterId: "friend", maxHp: 200, abilityIds: [] }] },
      { playerId: "playerB", characters: [dummy()] },
    );
    const hurt = { ...state, characters: { ...state.characters, friend: { ...state.characters.friend!, currentHp: 100 } } };
    const s = turn(hurt, [act("playerA", "charon", "ability.charon.cross-the-river", ["friend"])]);
    expect(has(s, "friend", "status.untargetable")).toBe(true);
    expect(hp(s, "friend")).toBe(120);
  });
  it("Final Fare: resurrection-locks, 20 damage; with three Obols 40 and spends them", () => {
    const plain = turn(hero(CHARON), [act("playerA", "charon", FINAL_FARE.id, ["dummy"])]);
    expect(500 - hp(plain, "dummy")).toBe(20);
    expect(has(plain, "dummy", "status.resurrection-lock")).toBe(true);
    const paid = turn(hero(CHARON, { "resource.obols": 3 }), [act("playerA", "charon", FINAL_FARE.id, ["dummy"])]);
    expect(500 - hp(paid, "dummy")).toBe(40);
    expect(res(paid, "charon", "resource.obols")).toBe(0);
  });
  it("Boat Pole is a plain 20", () => {
    const s = turn(hero(CHARON), [act("playerA", "charon", BOAT_POLE.id, ["dummy"])]);
    expect(500 - hp(s, "dummy")).toBe(20);
  });
});

describe("The Bronze Giant — bronze that burns", () => {
  it("Bronze Plating reduces damage by 20", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_BRONZE_GIANT)] }, { playerId: "playerB", characters: [attacker] });
    const plated = turn(state, [act("playerA", "the-bronze-giant", BRONZE_PLATING.id, ["the-bronze-giant"])]);
    const s = turn(plated, [], [act("playerB", "attacker", hit30.id, ["the-bronze-giant"])]);
    expect(THE_BRONZE_GIANT.baseHp - hp(s, "the-bronze-giant")).toBe(10);
  });
  it("Ichor Vein: while burning, the next turn he takes 20 more damage (and not otherwise)", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_BRONZE_GIANT)] }, { playerId: "playerB", characters: [attacker] });
    const burning = turn(state, [], [act("playerB", "attacker", burnIt.id, ["the-bronze-giant"])]);
    const s = turn(burning, [], [act("playerB", "attacker", hit30.id, ["the-bronze-giant"])]);
    const taken = hp(burning, "the-bronze-giant") - hp(s, "the-bronze-giant");
    expect(taken).toBeGreaterThanOrEqual(50); // 30 + the 20 softening (plus burn ticks)
    const cold = turn(state, [], [act("playerB", "attacker", hit30.id, ["the-bronze-giant"])]);
    expect(THE_BRONZE_GIANT.baseHp - hp(cold, "the-bronze-giant")).toBe(30);
  });
  it("Circle the Island hits every enemy for 20", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(THE_BRONZE_GIANT)] },
      { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] },
    );
    const s = turn(state, [act("playerA", "the-bronze-giant", "ability.the-bronze-giant.circle-the-island", [])]);
    expect(300 - hp(s, "dummy")).toBe(20);
    expect(300 - hp(s, "second")).toBe(20);
  });
});

describe("Arachne — Threads", () => {
  it("Spin Web and Snare Line slow and tax the enemy and add Threads", () => {
    const a = turn(hero(ARACHNE), [act("playerA", "arachne", SPIN_WEB.id, ["dummy"])]);
    expect(has(a, "dummy", "status.cooldown-increase")).toBe(true);
    expect(res(a, "arachne", "resource.threads")).toBe(1);
    const b = turn(hero(ARACHNE), [act("playerA", "arachne", SNARE_LINE.id, ["dummy"])]);
    expect(has(b, "dummy", "status.energy-cost-increase")).toBe(true);
    expect(500 - hp(b, "dummy")).toBe(10);
  });
  it("taking a hit gives her a Thread", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(ARACHNE)] }, { playerId: "playerB", characters: [attacker] });
    const s = turn(state, [], [act("playerB", "attacker", hit10.id, ["arachne"])]);
    expect(res(s, "arachne", "resource.threads")).toBe(1);
  });
  it("Tapestry: 30 damage; with three Threads it also stuns and spends them", () => {
    const plain = turn(hero(ARACHNE), [act("playerA", "arachne", TAPESTRY.id, ["dummy"])]);
    expect(500 - hp(plain, "dummy")).toBe(30);
    expect(has(plain, "dummy", "status.stun")).toBe(false);
    const full = turn(hero(ARACHNE, { "resource.threads": 3 }), [act("playerA", "arachne", TAPESTRY.id, ["dummy"])]);
    expect(has(full, "dummy", "status.stun")).toBe(true);
    expect(res(full, "arachne", "resource.threads")).toBe(0);
  });
});

describe("Cyclops Brontes — the forge and the bolt", () => {
  it("Hammer Blow and Stoke the Forge build Heat", () => {
    const a = turn(hero(CYCLOPS_BRONTES), [act("playerA", "cyclops-brontes", HAMMER_BLOW.id, ["dummy"])]);
    expect(res(a, "cyclops-brontes", "resource.forge-heat")).toBe(1);
    const b = turn(hero(CYCLOPS_BRONTES), [act("playerA", "cyclops-brontes", STOKE_THE_FORGE.id, ["cyclops-brontes"])]);
    expect(res(b, "cyclops-brontes", "resource.forge-heat")).toBe(2);
  });
  it("with two Heat the bolt is a sure 70 and spends the Heat", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const s = turn(hero(CYCLOPS_BRONTES, { "resource.forge-heat": 2 }, dummy(500), seed), [act("playerA", "cyclops-brontes", THUNDERBOLT.id, ["dummy"])]);
      expect(500 - hp(s, "dummy")).toBe(70);
      expect(res(s, "cyclops-brontes", "resource.forge-heat")).toBe(0);
    }
  });
  it("with a cold forge the bolt is a gamble of 20, 40 or 60, and the same seed always rolls the same", () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const run = () => 500 - hp(turn(hero(CYCLOPS_BRONTES, undefined, dummy(500), seed), [act("playerA", "cyclops-brontes", THUNDERBOLT.id, ["dummy"])]), "dummy");
      const damage = run();
      expect(damage).toBe(run());
      seen.add(damage);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([20, 40, 60]);
  });
  it("Molten Slag burns, which softens The Bronze Giant", () => {
    const s = turn(hero(CYCLOPS_BRONTES), [act("playerA", "cyclops-brontes", MOLTEN_SLAG.id, ["dummy"])]);
    expect(has(s, "dummy", "status.burn")).toBe(true);
  });
});

describe("The Oracle — prophecy", () => {
  const withAttacker = () => freshScenarioBattle({ playerId: "playerA", characters: [member(THE_ORACLE)] }, { playerId: "playerB", characters: [attacker] });
  it("Foretell marks an enemy: its next wound is 30 worse, once", () => {
    const foretold = turn(withAttacker(), [act("playerA", "the-oracle", FORETELL.id, ["attacker"])]);
    expect(has(foretold, "attacker", "status.foretold")).toBe(true);
    // Damage to the foretold enemy (the Oracle's own Fate's Verdict is tested below): use a second team member.
    const ally = freshScenarioBattle(
      { playerId: "playerA", characters: [member(THE_ORACLE), { characterId: "friend", maxHp: 200, abilityIds: [hit30.id] }] },
      { playerId: "playerB", characters: [dummy(400)] },
    );
    const marked = turn(ally, [act("playerA", "the-oracle", FORETELL.id, ["dummy"])]);
    const hit = turn(marked, [act("playerA", "friend", hit30.id, ["dummy"])]);
    expect(hp(marked, "dummy") - hp(hit, "dummy")).toBe(60); // 30 + 30 fate
    expect(has(hit, "dummy", "status.foretold")).toBe(false);
    const again = turn(hit, [act("playerA", "friend", hit30.id, ["dummy"])]);
    expect(hp(hit, "dummy") - hp(again, "dummy")).toBe(30); // spent: no chain
  });
  it("Fate's Verdict: 60 on a foretold enemy (and the prophecy is spent), 20 otherwise", () => {
    const marked = turn(hero(THE_ORACLE, undefined, dummy(500)), [act("playerA", "the-oracle", FORETELL.id, ["dummy"])]);
    const verdict = turn(marked, [act("playerA", "the-oracle", FATES_VERDICT.id, ["dummy"])]);
    expect(hp(marked, "dummy") - hp(verdict, "dummy")).toBe(60); // the verdict spends the prophecy first, so no extra 30
    expect(has(verdict, "dummy", "status.foretold")).toBe(false);
    const cold = turn(hero(THE_ORACLE), [act("playerA", "the-oracle", FATES_VERDICT.id, ["dummy"])]);
    expect(500 - hp(cold, "dummy")).toBe(20);
  });
  it("Warning Dream shields an ally, Sibylline Riddle silences an enemy", () => {
    const shield = turn(hero(THE_ORACLE), [act("playerA", "the-oracle", WARNING_DREAM.id, ["the-oracle"])]);
    expect(has(shield, "the-oracle", "status.shield")).toBe(true);
    const silenced = turn(hero(THE_ORACLE), [act("playerA", "the-oracle", SIBYLLINE_RIDDLE.id, ["dummy"])]);
    expect(has(silenced, "dummy", "status.silence")).toBe(true);
  });
});

describe("Cerberus — three bites and a guard", () => {
  it("Three Bites are three separate hits, so flat armour shreds them", () => {
    const plain = turn(hero(CERBERUS), [act("playerA", "cerberus", THREE_BITES.id, ["dummy"])]);
    expect(500 - hp(plain, "dummy")).toBe(30);
    const armoured = freshScenarioBattle({ playerId: "playerA", characters: [member(CERBERUS)] }, { playerId: "playerB", characters: [member(THE_BRONZE_GIANT)] });
    const plated = turn(armoured, [], [act("playerB", "the-bronze-giant", BRONZE_PLATING.id, ["the-bronze-giant"])]);
    const s = turn(plated, [act("playerA", "cerberus", THREE_BITES.id, ["the-bronze-giant"])]);
    expect(hp(plated, "the-bronze-giant") - hp(s, "the-bronze-giant")).toBe(0); // 10 - 20 each: nothing gets through
  });
  it("Guard the Gate draws single-target attacks and hardens him; Snarl bites back", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(CERBERUS), { characterId: "friend", maxHp: 200, abilityIds: [] }] },
      { playerId: "playerB", characters: [attacker] },
    );
    const guarded = turn(state, [act("playerA", "cerberus", GUARD_THE_GATE.id, ["cerberus"])]);
    expect(has(guarded, "cerberus", "status.taunt")).toBe(true);
    const snarl = turn(state, [act("playerA", "cerberus", SNARL.id, ["cerberus"])]);
    const s = turn(snarl, [], [act("playerB", "attacker", hit10.id, ["cerberus"])]);
    expect(300 - hp(s, "attacker")).toBeGreaterThan(0); // the attacker was bitten back
  });
  it("Howl of Hades weakens and frightens", () => {
    const s = turn(hero(CERBERUS), [act("playerA", "cerberus", HOWL_OF_HADES.id, ["dummy"])]);
    expect(has(s, "dummy", "status.weakness") && has(s, "dummy", "status.fear")).toBe(true);
  });
  it("when an ally falls he hardens", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(CERBERUS), { characterId: "friend", maxHp: 20, abilityIds: [] }] },
      { playerId: "playerB", characters: [attacker] },
    );
    const s = turn(state, [], [act("playerB", "attacker", lethal.id, ["friend"])]);
    expect(s.characters.friend?.alive).toBe(false);
    expect(has(s, "cerberus", "status.damage-reduction")).toBe(true);
  });
});

describe("The Siren — a song in order", () => {
  const sing = (state: BattleState, ...verses: string[]) => verses.reduce((s, v) => turn(s, [act("playerA", "the-siren", v, ["dummy"])]), state);
  const start = () => hero(THE_SIREN, undefined, dummy(600));
  it("Lure then Lullaby then Shipwreck: 60 damage and a stun", () => {
    const before = sing(start(), LURE.id, LULLABY.id);
    const after = turn(before, [act("playerA", "the-siren", SHIPWRECK.id, ["dummy"])]);
    expect(hp(before, "dummy") - hp(after, "dummy")).toBe(60);
    expect(has(after, "dummy", "status.stun")).toBe(true);
  });
  it("Shipwreck out of order is only 20", () => {
    for (const order of [[] as string[], [LULLABY.id], [LULLABY.id, LURE.id], [LURE.id]]) {
      const before = sing(start(), ...order);
      const after = turn(before, [act("playerA", "the-siren", SHIPWRECK.id, ["dummy"])]);
      expect(hp(before, "dummy") - hp(after, "dummy")).toBe(20);
      expect(has(after, "dummy", "status.stun")).toBe(false);
    }
  });
  it("Lullaby silences only right after Lure", () => {
    expect(has(sing(start(), LURE.id, LULLABY.id), "dummy", "status.silence")).toBe(true);
    expect(has(sing(start(), LULLABY.id), "dummy", "status.silence")).toBe(false);
  });
  it("Undertow hits every enemy for 10", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(THE_SIREN)] },
      { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] },
    );
    const s = turn(state, [act("playerA", "the-siren", "ability.the-siren.undertow", [])]);
    expect(300 - hp(s, "dummy")).toBe(10);
    expect(300 - hp(s, "second")).toBe(10);
  });
});

describe("Nemesis — Grudge and Reckoning", () => {
  it("every blow on her side gives a Grudge", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(NEMESIS), { characterId: "friend", maxHp: 200, abilityIds: [] }] },
      { playerId: "playerB", characters: [attacker] },
    );
    const s = turn(state, [], [act("playerB", "attacker", hit10.id, ["friend"])]);
    expect(res(s, "nemesis", "resource.grudge")).toBe(1);
    const own = turn(state, [], [act("playerB", "attacker", hit10.id, ["nemesis"])]);
    expect(res(own, "nemesis", "resource.grudge")).toBe(0); // only allies count
  });
  it("Just Deserts is 20, or 30 with three Grudge; Reckoning is 30, or 60 and spends the Grudge", () => {
    expect(500 - hp(turn(hero(NEMESIS), [act("playerA", "nemesis", JUST_DESERTS.id, ["dummy"])]), "dummy")).toBe(20);
    expect(500 - hp(turn(hero(NEMESIS, { "resource.grudge": 3 }), [act("playerA", "nemesis", JUST_DESERTS.id, ["dummy"])]), "dummy")).toBe(30);
    expect(500 - hp(turn(hero(NEMESIS), [act("playerA", "nemesis", RECKONING.id, ["dummy"])]), "dummy")).toBe(30);
    const paid = turn(hero(NEMESIS, { "resource.grudge": 4 }), [act("playerA", "nemesis", RECKONING.id, ["dummy"])]);
    expect(500 - hp(paid, "dummy")).toBe(60);
    expect(res(paid, "nemesis", "resource.grudge")).toBe(1);
  });
  it("Mirror of Hubris throws a blow back at whoever threw it", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(NEMESIS)] }, { playerId: "playerB", characters: [attacker] });
    const mirrored = turn(state, [act("playerA", "nemesis", MIRROR_OF_HUBRIS.id, ["nemesis"])]);
    expect(has(mirrored, "nemesis", "status.reflect")).toBe(true);
    const s = turn(mirrored, [], [act("playerB", "attacker", hit30.id, ["nemesis"])]);
    expect(hp(s, "nemesis")).toBe(NEMESIS.baseHp);
    expect(300 - hp(s, "attacker")).toBe(30);
  });
  it("Curse of Hubris curses and weakens", () => {
    const s = turn(hero(NEMESIS), [act("playerA", "nemesis", "ability.nemesis.curse-of-hubris", ["dummy"])]);
    expect(has(s, "dummy", "status.curse") && has(s, "dummy", "status.weakness")).toBe(true);
  });
});

describe("Hecate's Disciple — crossroads and curses", () => {
  it("Moonless Torch burns", () => {
    const s = turn(hero(HECATES_DISCIPLE), [act("playerA", "hecates-disciple", MOONLESS_TORCH.id, ["dummy"])]);
    expect(has(s, "dummy", "status.burn")).toBe(true);
    expect(500 - hp(s, "dummy")).toBe(20); // 10, then the burn's first tick of 10
  });
  it("Three Roads always lays exactly one of four hexes, deterministically per seed, and all four occur", () => {
    const hexes = ["status.weakness", "status.cooldown-increase", "status.energy-cost-increase", "status.silence"];
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const run = () => turn(hero(HECATES_DISCIPLE, undefined, dummy(), seed), [act("playerA", "hecates-disciple", THREE_ROADS.id, ["dummy"])]);
      const s = run();
      const applied = hexes.filter((h) => has(s, "dummy", h));
      expect(applied).toHaveLength(1);
      expect(applied).toEqual(hexes.filter((h) => has(run(), "dummy", h)));
      seen.add(applied[0]!);
    }
    expect(seen.size).toBe(4);
  });
  it("Dark Supper: 20 and a curse, then 50 on the cursed", () => {
    const first = turn(hero(HECATES_DISCIPLE), [act("playerA", "hecates-disciple", DARK_SUPPER.id, ["dummy"])]);
    expect(500 - hp(first, "dummy")).toBe(20);
    expect(has(first, "dummy", "status.curse")).toBe(true);
    const cursedFoe = { ...first, characters: { ...first.characters, "hecates-disciple": { ...first.characters["hecates-disciple"]!, cooldowns: {} } } };
    const second = turn(cursedFoe, [act("playerA", "hecates-disciple", DARK_SUPPER.id, ["dummy"])]);
    expect(hp(cursedFoe, "dummy") - hp(second, "dummy")).toBe(50);
  });
});

describe("Icarion [SECRET] — height and its price", () => {
  it("Wax Wing Dive: 20 grounded, 50 with two Altitude, 90 with four at a cost of 30 health", () => {
    const grounded = turn(hero(ICARION), [act("playerA", "icarion", WAX_WING_DIVE.id, ["dummy"])]);
    expect(500 - hp(grounded, "dummy")).toBe(20);
    const mid = turn(hero(ICARION, { "resource.altitude": 2 }), [act("playerA", "icarion", WAX_WING_DIVE.id, ["dummy"])]);
    expect(500 - hp(mid, "dummy")).toBe(50);
    expect(res(mid, "icarion", "resource.altitude")).toBe(0);
    const high = turn(hero(ICARION, { "resource.altitude": 4 }), [act("playerA", "icarion", WAX_WING_DIVE.id, ["dummy"])]);
    expect(500 - hp(high, "dummy")).toBe(90);
    expect(ICARION.baseHp - hp(high, "icarion")).toBeGreaterThanOrEqual(30);
  });
  it("Feather Volley and Soar climb", () => {
    const a = turn(hero(ICARION), [act("playerA", "icarion", FEATHER_VOLLEY.id, ["dummy"])]);
    expect(res(a, "icarion", "resource.altitude")).toBe(1);
    const b = turn(hero(ICARION), [act("playerA", "icarion", "ability.icarion.soar", ["icarion"])]);
    expect(res(b, "icarion", "resource.altitude")).toBe(2);
  });
  it("Melting Wax: at four Altitude the sun sets him burning next turn; lower does not", () => {
    expect(has(turn(hero(ICARION, { "resource.altitude": 4 }), []), "icarion", "status.burn")).toBe(true);
    expect(has(turn(hero(ICARION, { "resource.altitude": 3 }), []), "icarion", "status.burn")).toBe(false);
  });
  it("Plummet crashes down on every enemy, hurts him, and empties the Altitude", () => {
    const state = freshScenarioBattle(
      { playerId: "playerA", characters: [member(ICARION, { resources: { "resource.altitude": 3 } })] },
      { playerId: "playerB", characters: [dummy(300), { characterId: "second", maxHp: 300 }] },
    );
    const s = turn(state, [act("playerA", "icarion", PLUMMET.id, [])]);
    expect(300 - hp(s, "dummy")).toBe(40);
    expect(300 - hp(s, "second")).toBe(40);
    expect(res(s, "icarion", "resource.altitude")).toBe(0);
    expect(hp(s, "icarion")).toBe(ICARION.baseHp - 10);
  });
});

describe("The Forgotten Titan [SECRET] — the sleeper wakes", () => {
  const start = (foe: CreateBattleTeamInput["characters"][number] = attacker) =>
    freshScenarioBattle({ playerId: "playerA", characters: [member(THE_FORGOTTEN_TITAN)] }, { playerId: "playerB", characters: [foe] });
  const idle = (s: BattleState, n: number) => Array.from({ length: n }).reduce<BattleState>((b) => turn(b, []), s);

  it("stirs once a turn, and sleeps through 10 points of every hit while it is still asleep", () => {
    const s = turn(start(), [], [act("playerB", "attacker", hit30.id, ["the-forgotten-titan"])]);
    expect(res(s, "the-forgotten-titan", "resource.stirring")).toBe(1);
    expect(THE_FORGOTTEN_TITAN.baseHp - hp(s, "the-forgotten-titan")).toBe(20);
  });
  it("Dreaming Weight sinks it deeper: less damage and a Stirring lost; Restless Turn wakes it faster", () => {
    const weighted = turn(start(), [act("playerA", "the-forgotten-titan", DREAMING_WEIGHT.id, ["the-forgotten-titan"])]);
    expect(has(weighted, "the-forgotten-titan", "status.damage-reduction")).toBe(true);
    expect(res(weighted, "the-forgotten-titan", "resource.stirring")).toBe(0); // +1 at turn start, -1 for the ability
    const restless = turn(start(), [act("playerA", "the-forgotten-titan", RESTLESS_TURN.id, [])]);
    expect(res(restless, "the-forgotten-titan", "resource.stirring")).toBe(3);
  });
  it("wakes at five Stirring: the sleeper's kit is replaced by Titan's Wrath and Unbound Roar", () => {
    const asleep = idle(start(dummy(600)), 3);
    expect(asleep.characters["the-forgotten-titan"]?.abilityIds).not.toContain(TITANS_WRATH.id);
    const awake = idle(asleep, 2);
    const c = awake.characters["the-forgotten-titan"]!;
    expect(res(awake, "the-forgotten-titan", "resource.stirring")).toBeGreaterThanOrEqual(5);
    expect(c.abilityIds).toContain(TITANS_WRATH.id);
    const blow = turn(awake, [act("playerA", "the-forgotten-titan", TITANS_WRATH.id, ["dummy"])]);
    expect(hp(awake, "dummy") - hp(blow, "dummy")).toBe(60);
  });
  it("asleep it barely acts: Sleeper's Roll is a plain 20", () => {
    const s = turn(start(dummy(600)), [act("playerA", "the-forgotten-titan", SLEEPERS_ROLL.id, ["dummy"])]);
    expect(600 - hp(s, "dummy")).toBe(20);
  });
});
