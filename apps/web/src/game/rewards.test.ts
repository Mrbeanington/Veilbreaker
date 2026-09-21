import { describe, expect, it } from "vitest";
import { createDefaultProfile, type Profile } from "@veilbreak/persistence";
import { FRAMES, TITLES, activeFrame, activeTitle, masteryRing, newRewards, nextReward } from "./rewards";
import { xpForLevel } from "./gates";

const at = (level: number, cosmetics: Profile["cosmetics"] = {}): Profile => ({ ...createDefaultProfile(), xp: xpForLevel(level), cosmetics });

describe("rewards (ADR-046)", () => {
  it("start every player with a first title and frame, and list rewards in level order", () => {
    expect(TITLES[0]!.level).toBe(1);
    expect(FRAMES[0]!.level).toBe(1);
    for (const list of [TITLES, FRAMES]) expect(list.map((r) => r.level)).toEqual([...list.map((r) => r.level)].sort((a, b) => a - b));
    for (const list of [TITLES, FRAMES]) expect(new Set(list.map((r) => r.id)).size).toBe(list.length);
  });
  it("shows the highest earned title and frame unless the player chose another they have earned", () => {
    expect(activeTitle(at(1)).id).toBe("newcomer");
    expect(activeTitle(at(9)).id).toBe("veteran");
    expect(activeTitle(at(9, { title: "apprentice" })).id).toBe("apprentice");
    expect(activeFrame(at(10)).id).toBe("gold");
    expect(activeFrame(at(10, { frame: "bronze" })).id).toBe("bronze");
  });
  it("ignores a choice the level does not allow, such as after a reset", () => {
    expect(activeTitle(at(1, { title: "veilbreaker" })).id).toBe("newcomer");
    expect(activeFrame(at(2, { frame: "veil" })).id).toBe("plain");
  });
  it("lists what a level-up unlocked, and what is next", () => {
    expect(newRewards(2, 3).titles.map((t) => t.id)).toEqual(["apprentice"]);
    expect(newRewards(2, 3).frames.map((f) => f.id)).toEqual(["bronze"]);
    expect(newRewards(3, 4)).toEqual({ titles: [], frames: [] });
    expect(newRewards(1, 20).titles.length).toBe(TITLES.length - 1);
    expect(nextReward(1)).toMatchObject({ level: 3 });
    expect(nextReward(50)).toBeUndefined();
  });
  it("gives a portrait ring by mastery: none, bronze, silver, gold", () => {
    expect([0, 1, 2, 3, 4, 5].map(masteryRing)).toEqual(["none", "bronze", "bronze", "silver", "silver", "gold"]);
  });
});
