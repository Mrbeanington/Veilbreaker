import { describe, expect, it } from "vitest";
import { createDefaultProfile } from "@veilbreak/persistence";
import { RANKED_UNLOCK_LEVEL, rankedGate, xpForLevel } from "./gates";

describe("level gates (ADR-044)", () => {
  it("computes the XP at which a level begins, matching the level curve", () => {
    expect([1, 2, 3, 4].map(xpForLevel)).toEqual([0, 100, 300, 600]);
  });
  it("keeps ranked closed below its level and reports what is left", () => {
    const p = createDefaultProfile();
    expect(rankedGate(p)).toMatchObject({ locked: true, level: 1, needLevel: RANKED_UNLOCK_LEVEL, xpToGo: 300 });
    expect(rankedGate({ ...p, xp: 250 })).toMatchObject({ locked: true, level: 2, xpToGo: 50 });
  });
  it("opens at the level, and stays open for older saves", () => {
    const p = createDefaultProfile();
    expect(rankedGate({ ...p, xp: 300 }).locked).toBe(false);
    expect(rankedGate({ ...p, unlocks: { ...p.unlocks, model: 1 } }).locked).toBe(false);
  });
});
