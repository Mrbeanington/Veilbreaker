import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  BLACK_CATS_CROSSING,
  MISTER_WHISKERS,
  MISTER_WHISKERS_INITIAL_RESOURCES,
  NINE_LIVES_RESOURCE,
  PAW_SWAP,
  type Ability,
} from "@veilbreak/content";
import { resolveTurn, type CreateBattleTeamInput } from "../resolver";
import { act, expectOk, freshScenarioBattle, scenarioDeps, scenarioResourceLibrary } from "./scenario-support";

// phase-04-first-five.md required mechanic: "Whiskers: Nine Lives plus at
// least one Cheater rule-break with explicit counterplay." docs/design/
// characters/mister-whiskers.md.

// A test-fixture "opposing attacker" ability, standing in for a future real
// character's kit — parsed through the real schema (same convention as
// resolver.test.ts) so it's still a genuine, validated Ability.
function fixtureAbility(input: Partial<Ability> & Pick<Ability, "id" | "effects">): Ability {
  return abilitySchema.parse({
    displayName: input.id,
    description: "test fixture",
    cost: {},
    target: { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] },
    ...input,
  });
}

const lethalStrike = fixtureAbility({ id: "test.lethal-strike", effects: [{ kind: "damage", amount: 999 }] });

const TEAM_A: CreateBattleTeamInput = {
  playerId: "playerA",
  characters: [
    { characterId: "mister-whiskers", maxHp: MISTER_WHISKERS.baseHp, abilityIds: MISTER_WHISKERS.abilityIds, passiveId: MISTER_WHISKERS.passiveId, resources: MISTER_WHISKERS_INITIAL_RESOURCES },
    { characterId: "ally", maxHp: 100 },
  ],
};
const TEAM_B: CreateBattleTeamInput = {
  playerId: "playerB",
  characters: [{ characterId: "attacker", maxHp: 100, abilityIds: [lethalStrike.id] }],
};

function depsWithFixture() {
  const base = scenarioDeps(scenarioResourceLibrary([NINE_LIVES_RESOURCE]));
  return { ...base, abilities: { ...base.abilities, [lethalStrike.id]: lethalStrike } };
}

describe("Mister Whiskers — Nine Lives", () => {
  it("saves him from a lethal hit, floors him at 1 HP, and spends exactly one life", () => {
    const state = freshScenarioBattle(TEAM_A, TEAM_B);
    // onTurnStart fires before any tier resolves, so Nine Lives has already
    // granted Death Prevention by the time the enemy's lethal strike lands
    // this same turn.
    const result = expectOk(
      resolveTurn(state, [], [act("playerB", "attacker", lethalStrike.id, ["mister-whiskers"])], depsWithFixture()),
    );
    const whiskers = result.state.characters["mister-whiskers"];
    expect(whiskers?.alive).toBe(true);
    expect(whiskers?.currentHp).toBe(1);
    expect(whiskers?.resources["resource.nine-lives"]).toBe(8);
    expect(whiskers?.statuses.some((s) => s.statusId === "status.death-prevention")).toBe(false); // consumed
  });

  it("recharges the save on the next turn and can spend a second life", () => {
    let state = freshScenarioBattle(TEAM_A, TEAM_B);
    const turn1 = expectOk(resolveTurn(state, [], [act("playerB", "attacker", lethalStrike.id, ["mister-whiskers"])], depsWithFixture()));
    state = turn1.state;
    expect(state.characters["mister-whiskers"]?.resources["resource.nine-lives"]).toBe(8);

    const turn2 = expectOk(resolveTurn(state, [], [act("playerB", "attacker", lethalStrike.id, ["mister-whiskers"])], depsWithFixture()));
    const whiskers = turn2.state.characters["mister-whiskers"];
    expect(whiskers?.alive).toBe(true);
    expect(whiskers?.currentHp).toBe(1);
    expect(whiskers?.resources["resource.nine-lives"]).toBe(7);
  });
});

describe("Mister Whiskers — Paw Swap (Cheater rule-break, OQ-07)", () => {
  it("redirects the enemy's queued attack from Whiskers' ally onto Whiskers himself", () => {
    const state = freshScenarioBattle(TEAM_A, TEAM_B);
    const result = expectOk(
      resolveTurn(
        state,
        [act("playerA", "mister-whiskers", PAW_SWAP.id, ["attacker"])],
        [act("playerB", "attacker", lethalStrike.id, ["ally"])],
        depsWithFixture(),
      ),
    );
    // The ally was the original target and should be untouched...
    expect(result.state.characters.ally?.alive).toBe(true);
    expect(result.state.characters.ally?.currentHp).toBe(100);
    // ...while Whiskers (protected by Nine Lives, which also fired this turn) took it instead.
    expect(result.state.characters["mister-whiskers"]?.currentHp).toBe(1);
  });
});

describe("Mister Whiskers — Black Cat's Crossing (energy manipulation)", () => {
  it("drains the target's energy and grants it to Whiskers", () => {
    // Checked via the emitted event rather than end-of-turn pool totals —
    // the resource-generation tier (14) runs later in this same turn and
    // would otherwise mask the drain by regenerating more than it stole.
    const state = freshScenarioBattle(TEAM_A, TEAM_B);
    const result = expectOk(
      resolveTurn(state, [act("playerA", "mister-whiskers", BLACK_CATS_CROSSING.id, ["attacker"])], [], depsWithFixture()),
    );
    const drainEvent = result.events.find((e) => e.type === "energyDrained");
    expect(drainEvent?.sourceId).toBe("mister-whiskers");
    expect(drainEvent?.targetId).toBe("attacker");
    expect(drainEvent?.payload.amount).toBe(2);
    expect(drainEvent?.payload.grantedToSelf).toBe(true);
  });
});
