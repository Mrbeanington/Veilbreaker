import { afterEach, describe, expect, it } from "vitest";
import { CURRENT_BALANCE_VERSION_ID, SHIPPED_BALANCE_PATCHES, baseLibraries, createDraft, listTunables, type BalanceDraft } from "@veilbreak/content";
import { finishMatch } from "./finishMatch";
import { createDefaultProfile } from "@veilbreak/persistence";
import { runReplay } from "./replay";
import { playRealMatch } from "./testing";

// phase-12: "old replays keep resolving under their shipped versions."
const patches = SHIPPED_BALANCE_PATCHES as BalanceDraft[]; // the array is readonly for callers; tests publish a version temporarily
const published = [...patches];
afterEach(() => {
  patches.length = 0;
  patches.push(...published);
});

const team = ["tortuga-rex", "hydra", "plague-doctor"];
const foe = ["koschei", "baba-yaga", "the-referee"];
const hydraHp = listTunables(baseLibraries()).find((t) => t.path === "characters/hydra/baseHp")!;

function record(seed: number) {
  const outcome = playRealMatch(team, foe, seed);
  return finishMatch(createDefaultProfile(), { mode: "bot", teamAIds: team, teamBIds: foe, seed }, outcome, 1).replay!;
}

describe("replays and balance versions", () => {
  it("a replay recorded under the shipped version plays back identically after a newer version is published", () => {
    const replay = record(31);
    const before = runReplay(replay);
    patches.push(createDraft("phase-12-test", [{ path: hydraHp.path, value: hydraHp.value + 100 }], "2026-09-19T00:00:00.000Z"));
    const after = runReplay(replay);
    expect(replay.balanceVersionId).toBe(CURRENT_BALANCE_VERSION_ID);
    expect(before.ok && after.ok).toBe(true);
    if (before.ok && after.ok) {
      expect(after.frames.map((f) => f.state)).toEqual(before.frames.map((f) => f.state));
      expect(after.balanceMismatch).toBe(false);
      expect(after.frames[0]?.state.characters.hydra?.maxHp).toBe(hydraHp.value);
    }
  });

  it("a replay recorded under a published version runs with that version's numbers", () => {
    patches.push(createDraft("phase-12-test", [{ path: hydraHp.path, value: hydraHp.value + 100 }], "2026-09-19T00:00:00.000Z"));
    const replay = { ...record(32), balanceVersionId: "phase-12-test" };
    const run = runReplay(replay);
    expect(run.ok && run.balanceMismatch).toBe(false);
    if (run.ok) expect(run.frames[0]?.state.characters.hydra?.maxHp).toBe(hydraHp.value + 100);
  });

  it("a replay from a version this build does not have is flagged, not silently replayed as something else", () => {
    const run = runReplay({ ...record(33), balanceVersionId: "from-the-future" });
    expect(run.ok && run.balanceMismatch).toBe(true);
  });
});
