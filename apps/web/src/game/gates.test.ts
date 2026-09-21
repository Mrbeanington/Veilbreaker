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
import { NO_FILTERS, filterCharacters, usableFirst } from "./filters";
import { isPickable } from "./knowledge";

describe("team picker availability", () => {
  const p = createDefaultProfile();
  const all = [...PLAYABLE_CHARACTERS];

  it('"Unlocked" in the picker shows only fighters that can be put on a team', () => {
    const shown = filterCharacters(all, { ...NO_FILTERS, lock: "unlocked" }, p, true);
    expect(shown.length).toBeGreaterThan(20);
    for (const c of shown) expect(isPickable(c, p), c.id).toBe(true);
    // A Rare fighter that still needs its quest is not "unlocked", although its entry is visible.
    expect(shown.some((c) => c.id === "arachne")).toBe(false);
  });
  it('"Locked" in the picker shows fighters still waiting on something, quest fighters included', () => {
    const shown = filterCharacters(all, { ...NO_FILTERS, lock: "locked" }, p, true);
    expect(shown.some((c) => c.id === "arachne")).toBe(true);
    for (const c of shown) expect(isPickable(c, p), c.id).toBe(false);
  });
  it("on the Characters screen the old meaning stays: known fighters", () => {
    const shown = filterCharacters(all, { ...NO_FILTERS, lock: "unlocked" }, p);
    expect(shown.some((c) => c.id === "arachne")).toBe(true);
  });
  it("puts usable fighters first without reordering within each group", () => {
    const list = usableFirst(all, p);
    const firstLocked = list.findIndex((c) => !isPickable(c, p));
    expect(list.slice(0, firstLocked).every((c) => isPickable(c, p))).toBe(true);
    expect(list.slice(firstLocked).every((c) => !isPickable(c, p))).toBe(true);
    const ids = (xs: typeof list) => xs.map((c) => c.id);
    expect(ids(list.slice(0, firstLocked))).toEqual(ids(all.filter((c) => isPickable(c, p))));
  });
});
