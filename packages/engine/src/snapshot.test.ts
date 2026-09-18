import { describe, expect, it } from "vitest";
import type { BattleState } from "@veilbreak/content";
import { snapshotBattleState, restoreFromSnapshot } from "./snapshot";
import { createBattle, resolveTurn } from "./resolver";
import { defaultEnergyRules, defaultMatchFormat } from "@veilbreak/content";

function sampleState(): BattleState {
  return createBattle(
    [
      { playerId: "playerA", characters: [{ characterId: "a1", maxHp: 100, abilityIds: ["x"], resources: { "resource.souls": 3 } }] },
      { playerId: "playerB", characters: [{ characterId: "b1", maxHp: 100 }] },
    ],
    42,
    { balanceVersionId: "test", matchFormat: defaultMatchFormat, energyRules: defaultEnergyRules },
  );
}

describe("snapshotBattleState / restoreFromSnapshot", () => {
  it("round-trips with deep-equal over every field", () => {
    const state = sampleState();
    const snapshot = snapshotBattleState(state);
    const restored = restoreFromSnapshot(snapshot);
    expect(restored).toEqual(state);
  });

  it("the snapshot is independent of the original — an in-place mutation of the source never reaches it", () => {
    const state = sampleState();
    const snapshot = snapshotBattleState(state);
    // A real deep clone survives an in-place mutation of the original's
    // nested objects; a shallow copy (or a plain reference) would not. The
    // engine itself never mutates in place (CLAUDE.md rule 4) — this
    // direct assignment exists purely to prove the clone is deep.
    state.turn = 999;
    const a1 = state.characters.a1;
    if (!a1) throw new Error("expected character a1");
    a1.currentHp = 1;
    a1.resources["resource.souls"] = 0;

    expect(snapshot.turn).toBe(1);
    expect(snapshot.characters.a1?.currentHp).toBe(100);
    expect(snapshot.characters.a1?.resources["resource.souls"]).toBe(3);
  });

  it("this is the foundation for OQ-06's rewind: resolving turns after a restore reproduces the same continuation deterministically", () => {
    const state = sampleState();
    const beforeTurn2 = snapshotBattleState(state);

    const forward = resolveTurn(state, [], [], {
      abilities: {},
      resolutionOrder: { tiers: [{ id: "standard-attacks-support", order: 1, displayName: "x" }] },
      energyRules: defaultEnergyRules,
      statusLibrary: {},
      passives: {},
      summonLibrary: {},
      transformationLibrary: {},
      resourceLibrary: {},
    });
    if (!forward.ok) throw new Error("expected a legal turn");

    // "Rewind": restore the pre-turn-2 snapshot and resolve the *same*
    // no-op turn again — OQ-06 says the RNG stream still advances (no
    // identical re-roll), which for a turn with no actions at all means the
    // result is identical, since nothing drew from the RNG either time.
    const restored = restoreFromSnapshot(beforeTurn2);
    const rewound = resolveTurn(restored, [], [], {
      abilities: {},
      resolutionOrder: { tiers: [{ id: "standard-attacks-support", order: 1, displayName: "x" }] },
      energyRules: defaultEnergyRules,
      statusLibrary: {},
      passives: {},
      summonLibrary: {},
      transformationLibrary: {},
      resourceLibrary: {},
    });
    if (!rewound.ok) throw new Error("expected a legal turn");
    expect(rewound.state).toEqual(forward.state);
  });
});
