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

import { PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { NO_FILTERS, filterCharacters } from "./filters";
import { isPickable } from "./knowledge";

describe("availability filter (picker, Characters and Codex)", () => {
  const p = createDefaultProfile();
  const all = [...PLAYABLE_CHARACTERS].sort((a, b) => a.displayName.localeCompare(b.displayName));

  it("leaves the list alphabetical, with locked fighters in it, until a filter is set", () => {
    const shown = filterCharacters(all, NO_FILTERS, p);
    expect(shown.map((c) => c.id)).toEqual(all.filter((c) => shown.includes(c)).map((c) => c.id));
    expect(shown.some((c) => c.id === "arachne")).toBe(true);
    expect(shown.some((c) => isPickable(c, p))).toBe(true);
  });
  it('"Unlocked" shows only fighters that can be put on a team, and stays alphabetical', () => {
    const shown = filterCharacters(all, { ...NO_FILTERS, lock: "unlocked" }, p);
    expect(shown.length).toBeGreaterThan(20);
    for (const c of shown) expect(isPickable(c, p), c.id).toBe(true);
    expect(shown.some((c) => c.id === "arachne")).toBe(false);
    expect(shown.map((c) => c.displayName)).toEqual([...shown.map((c) => c.displayName)].sort((a, b) => a.localeCompare(b)));
  });
  it('"Locked" shows everything still waiting on a quest, trial or first meeting', () => {
    const shown = filterCharacters(all, { ...NO_FILTERS, lock: "locked" }, p);
    expect(shown.some((c) => c.id === "arachne")).toBe(true);
    for (const c of shown) expect(isPickable(c, p), c.id).toBe(false);
  });
});
