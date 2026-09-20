import { describe, expect, it } from "vitest";
import {
  APPEALS_RESOURCE,
  AUDIT,
  BAR_THE_GATE,
  CALL_THE_TIDE,
  CALYPSA,
  CALYPSA_UNDERTOW,
  CLASS_ACTION,
  CROSS_EXAMINE,
  FATHER_BELL,
  FROST_JOTUNN,
  GATEKEEPER_OPEN_THE_GATE,
  HALBERD_THRUST,
  HUSH,
  LIEN,
  MAELSTROM,
  OBJECTION,
  RED_TAPE,
  RESOURCE_LIBRARY,
  SEIZE_ASSETS,
  SUE,
  THE_GATEKEEPER,
  THE_LAWYER,
  THE_TAX_COLLECTOR,
  TIDAL_WAVE,
  TIDE_RESOURCE,
  TURN_AWAY,
  WINTERS_LOCK,
  abilitySchema,
  defaultResourcesFor,
  type Ability,
  type BattleState,
  type CharacterDefinition,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../index";
import { act, expectOk, freshScenarioBattle, scenarioDeps } from "./scenario-support";

// phase-13, region 11 (the Final Seven): signature-mechanic tests, including
// Calypsa's Tide and the counters her note names.

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
const eraser = fixture({ id: "test.erase", effects: [{ kind: "erase" }] });
const poisonHit = fixture({ id: "test.poison", effects: [{ kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 }] });

function member(def: CharacterDefinition, overrides: Partial<CreateBattleTeamInput["characters"][number]> = {}) {
  return { characterId: def.id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, resources: defaultResourcesFor(def), ...overrides };
}
function deps() {
  const base = scenarioDeps(RESOURCE_LIBRARY);
  return { ...base, abilities: { ...base.abilities, [hit30.id]: hit30, [lethal.id]: lethal, [eraser.id]: eraser, [poisonHit.id]: poisonHit } };
}
const attacker = { characterId: "attacker", maxHp: 300, abilityIds: [hit30.id, lethal.id, eraser.id, poisonHit.id] };
const dummy = (hp = 500) => ({ characterId: "dummy", maxHp: hp });
const friend = { characterId: "friend", maxHp: 200, abilityIds: [] as string[] };
const hero = (def: CharacterDefinition, resources = defaultResourcesFor(def), foe: CreateBattleTeamInput["characters"][number] = dummy()): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [foe] }, 1);
const two = (def: CharacterDefinition, resources = defaultResourcesFor(def)): BattleState =>
  freshScenarioBattle({ playerId: "playerA", characters: [member(def, { resources })] }, { playerId: "playerB", characters: [dummy(500), { characterId: "second", maxHp: 500 }] }, 1);

const hp = (s: BattleState, id: string) => s.characters[id]?.currentHp ?? 0;
const has = (s: BattleState, id: string, status: string) => s.characters[id]?.statuses.some((x) => x.statusId === status) ?? false;
const res = (s: BattleState, id: string, key: string) => s.characters[id]?.resources[key] ?? 0;
const turn = (s: BattleState, a: ReturnType<typeof act>[], b: ReturnType<typeof act>[] = []) => expectOk(resolveTurn(s, a, b, deps())).state;
const dmg = (before: BattleState, after: BattleState, id: string) => hp(before, id) - hp(after, id);
const withHp = (s: BattleState, id: string, value: number): BattleState => ({ ...s, characters: { ...s.characters, [id]: { ...s.characters[id]!, currentHp: value } } });
const poolTotal = (s: BattleState, player: string) => Object.values(s.energyPools[player] ?? {}).reduce((a, n) => a + n, 0);

describe("The Tax Collector — the levy", () => {
  const id = "the-tax-collector";
  it("Levy takes energy from the enemy team at the end of an audited enemy's turn and gives it to him", () => {
    const audited = (passiveId: string | undefined) => {
      const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_TAX_COLLECTOR, { passiveId })] }, { playerId: "playerB", characters: [dummy()] }, 1);
      return turn(turn(state, [act("playerA", id, AUDIT.id, ["dummy"])]), []);
    };
    const taxed = audited(THE_TAX_COLLECTOR.passiveId);
    const untaxed = audited(undefined);
    expect(poolTotal(taxed, "playerB")).toBeLessThan(poolTotal(untaxed, "playerB"));
    expect(poolTotal(taxed, "playerA")).toBeGreaterThan(poolTotal(untaxed, "playerA"));
  });
  it("Levy does nothing to an enemy that has not been audited", () => {
    const withLevy = hero(THE_TAX_COLLECTOR);
    const withoutLevy = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_TAX_COLLECTOR, { passiveId: undefined })] }, { playerId: "playerB", characters: [dummy()] }, 1);
    expect(poolTotal(turn(withLevy, []), "playerB")).toBe(poolTotal(turn(withoutLevy, []), "playerB"));
  });
  it("Seize Assets takes 2 energy for himself", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(THE_TAX_COLLECTOR, { passiveId: undefined })] }, { playerId: "playerB", characters: [dummy()] }, 1);
    const baseline = turn(state, []);
    const seized = turn(state, [act("playerA", id, SEIZE_ASSETS.id, ["dummy"])]);
    expect(poolTotal(seized, "playerB")).toBe(poolTotal(baseline, "playerB") - 2);
  });
  it("Audit is 20 and raises the enemy's costs; Lien locks Focus; Red Tape armours", () => {
    const audit = turn(hero(THE_TAX_COLLECTOR), [act("playerA", id, AUDIT.id, ["dummy"])]);
    expect(500 - hp(audit, "dummy")).toBe(20);
    expect(has(audit, "dummy", "status.energy-cost-increase")).toBe(true);
    const lien = turn(hero(THE_TAX_COLLECTOR), [act("playerA", id, LIEN.id, ["dummy"])]);
    expect(lien.characters.dummy?.statuses.find((x) => x.statusId === "status.energy-lock")?.param).toBe("FOCUS");
    expect(has(turn(hero(THE_TAX_COLLECTOR), [act("playerA", id, RED_TAPE.id, [id])]), id, "status.damage-reduction")).toBe(true);
  });
});

describe("The Lawyer — the technicality", () => {
  const id = "the-lawyer";
  const vs = () => freshScenarioBattle({ playerId: "playerA", characters: [member(THE_LAWYER), friend] }, { playerId: "playerB", characters: [attacker] }, 1);
  it("is a documented Cheater with a rule-break and counterplay", () => {
    expect(THE_LAWYER.isCheater).toBe(true);
    expect(THE_LAWYER.cheaterRuleBreak).toBeTruthy();
    expect(THE_LAWYER.counterplay).toBeTruthy();
  });
  it("once per battle a lethal hit leaves him at 20 health instead; the second one kills him", () => {
    const first = turn(vs(), [], [act("playerB", "attacker", lethal.id, [id])]);
    expect(first.characters[id]?.alive).toBe(true);
    expect(hp(first, id)).toBe(20);
    expect(res(first, id, APPEALS_RESOURCE.id)).toBe(0);
    const second = turn(first, [], [act("playerB", "attacker", lethal.id, [id])]);
    expect(second.characters[id]?.alive).toBe(false);
  });
  it("does nothing against erasure", () => {
    expect(turn(vs(), [], [act("playerB", "attacker", eraser.id, [id])]).characters[id]?.alive).toBe(false);
  });
  it("Objection! sends an enemy's attack at him instead of his friend", () => {
    const s = turn(vs(), [act("playerA", id, OBJECTION.id, ["attacker"])], [act("playerB", "attacker", hit30.id, ["friend"])]);
    expect(hp(s, "friend")).toBe(200);
    expect(THE_LAWYER.baseHp - hp(s, id)).toBe(30);
  });
  it("Sue is 10 and takes energy; Class Action weakens and exposes every enemy; Cross-Examine is 20 and silences", () => {
    const sued = turn(hero(THE_LAWYER), [act("playerA", id, SUE.id, ["dummy"])]);
    expect(500 - hp(sued, "dummy")).toBe(10);
    const s = turn(two(THE_LAWYER), [act("playerA", id, CLASS_ACTION.id, [])]);
    for (const t of ["dummy", "second"]) {
      expect(has(s, t, "status.weakness"), t).toBe(true);
      expect(has(s, t, "status.damage-amplification"), t).toBe(true);
    }
    const cross = turn(hero(THE_LAWYER), [act("playerA", id, CROSS_EXAMINE.id, ["dummy"])]);
    expect(500 - hp(cross, "dummy")).toBe(20);
    expect(has(cross, "dummy", "status.silence")).toBe(true);
  });
});

describe("Calypsa — the Tide", () => {
  const id = "calypsa";
  it("gains a Tide at the end of each of her turns, up to 6", () => {
    let s = hero(CALYPSA);
    for (let i = 1; i <= 7; i += 1) {
      s = turn(s, []);
      expect(res(s, id, TIDE_RESOURCE.id)).toBe(Math.min(6, i));
    }
  });
  it("Call the Tide adds 2", () => {
    const s = turn(hero(CALYPSA), [act("playerA", id, CALL_THE_TIDE.id, [id])]);
    expect(res(s, id, TIDE_RESOURCE.id)).toBeGreaterThanOrEqual(2);
  });
  it("Tidal Wave is 20 to every enemy, or 50 with 3 Tide, which it spends", () => {
    const low = two(CALYPSA);
    expect(dmg(low, turn(low, [act("playerA", id, TIDAL_WAVE.id, [])]), "dummy")).toBe(20);
    const high = two(CALYPSA, { [TIDE_RESOURCE.id]: 3 });
    const s = turn(high, [act("playerA", id, TIDAL_WAVE.id, [])]);
    expect(dmg(high, s, "dummy")).toBe(50);
    expect(dmg(high, s, "second")).toBe(50);
    expect(res(s, id, TIDE_RESOURCE.id)).toBeLessThan(3);
  });
  it("Maelstrom is 90 and a stun to every enemy with 6 Tide, but only 10 without", () => {
    const low = two(CALYPSA, { [TIDE_RESOURCE.id]: 3 });
    expect(dmg(low, turn(low, [act("playerA", id, MAELSTROM.id, [])]), "dummy")).toBe(10);
    const full = two(CALYPSA, { [TIDE_RESOURCE.id]: 6 });
    const s = turn(full, [act("playerA", id, MAELSTROM.id, [])]);
    expect(dmg(full, s, "dummy")).toBe(90);
    expect(has(s, "second", "status.stun")).toBe(true);
    expect(MAELSTROM.cooldown).toBeGreaterThanOrEqual(5);
    expect(Object.values(MAELSTROM.cost).reduce((a, n) => a + n, 0)).toBeGreaterThanOrEqual(6);
  });
  it("Undertow is 20", () => {
    expect(500 - hp(turn(hero(CALYPSA), [act("playerA", id, CALYPSA_UNDERTOW.id, ["dummy"])]), "dummy")).toBe(20);
  });
  it("COUNTER: Frost Jötunn locks her Might, so the Maelstrom cannot be cast", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(CALYPSA, { resources: { [TIDE_RESOURCE.id]: 6 } })] }, { playerId: "playerB", characters: [member(FROST_JOTUNN)] }, 1);
    const locked = turn(state, [], [act("playerB", "frost-jotunn", WINTERS_LOCK.id, [id])]);
    expect(has(locked, id, "status.energy-lock")).toBe(true);
    expect(resolveTurn(locked, [act("playerA", id, MAELSTROM.id, [])], [], deps()).ok).toBe(false);
  });
  it("COUNTER: Father Bell's Hush silences her", () => {
    const state = freshScenarioBattle({ playerId: "playerA", characters: [member(CALYPSA, { resources: { [TIDE_RESOURCE.id]: 6 } })] }, { playerId: "playerB", characters: [member(FATHER_BELL)] }, 1);
    const hushed = turn(state, [], [act("playerB", "father-bell", HUSH.id, [id])]);
    expect(resolveTurn(hushed, [act("playerA", id, MAELSTROM.id, [])], [], deps()).ok).toBe(false);
  });
});

describe("The Gatekeeper — the toll", () => {
  const id = "the-gatekeeper";
  const vs = () => freshScenarioBattle({ playerId: "playerA", characters: [member(THE_GATEKEEPER), friend] }, { playerId: "playerB", characters: [attacker] }, 1);
  it("while the Gate is barred, every ability an enemy uses costs that enemy 10 health", () => {
    const barred = turn(vs(), [act("playerA", id, BAR_THE_GATE.id, [id])]);
    const s = turn(barred, [], [act("playerB", "attacker", hit30.id, ["friend"])]);
    expect(dmg(barred, s, "attacker")).toBe(10);
  });
  it("with the Gate open there is no toll", () => {
    const s = turn(vs(), [], [act("playerB", "attacker", hit30.id, ["friend"])]);
    expect(dmg(vs(), s, "attacker")).toBe(0);
    expect(dmg(vs(), s, "friend")).toBe(30);
  });
  it("does not tax his own team's abilities", () => {
    const s = turn(vs(), [act("playerA", id, HALBERD_THRUST.id, ["attacker"])]);
    expect(dmg(vs(), s, id)).toBe(0);
  });
  it("Bar the Gate draws attacks and armours him; Halberd Thrust is 30; Turn Away raises costs and weakens", () => {
    const s = turn(vs(), [act("playerA", id, BAR_THE_GATE.id, [id])]);
    expect(has(s, id, "status.taunt")).toBe(true);
    expect(has(s, id, "status.damage-reduction")).toBe(true);
    expect(dmg(vs(), turn(vs(), [act("playerA", id, HALBERD_THRUST.id, ["attacker"])]), "attacker")).toBe(30);
    const away = turn(vs(), [act("playerA", id, TURN_AWAY.id, ["attacker"])]);
    expect(has(away, "attacker", "status.energy-cost-increase")).toBe(true);
    expect(has(away, "attacker", "status.weakness")).toBe(true);
  });
  it("Open the Gate heals an ally 20 and lifts harmful effects", () => {
    const poisoned = turn(withHp(vs(), "friend", 100), [], [act("playerB", "attacker", poisonHit.id, ["friend"])]);
    expect(has(poisoned, "friend", "status.poison")).toBe(true);
    const cleansed = turn(poisoned, [act("playerA", id, GATEKEEPER_OPEN_THE_GATE.id, ["friend"])]);
    expect(has(cleansed, "friend", "status.poison")).toBe(false);
    expect(hp(cleansed, "friend")).toBeGreaterThan(hp(poisoned, "friend"));
  });
});
