import { describe, expect, it } from "vitest";
import { createDefaultProfile, profileSchema } from "./profile";
import { clearReplays, resetProfile } from "./reset";
import { saveReplay, listReplays } from "./replay";
import { createMemoryStore } from "./store";
import { maxedProfile, sampleReplay } from "./testing";

// ADR-037: starting over.
describe("resetting progress but keeping unlocks", () => {
  const before = maxedProfile();
  const after = resetProfile(before, "progress");

  it("returns a valid profile", () => {
    expect(profileSchema.safeParse(after).success).toBe(true);
  });

  it("sends level, results, mastery, missions, achievements, history and ranked back to the start", () => {
    const fresh = createDefaultProfile();
    expect(after.xp).toBe(0);
    expect(after.matchesPlayed).toBe(0);
    expect(after.played).toEqual({});
    expect(after.beat).toEqual({});
    expect(after.wonWith).toEqual({});
    expect(after.missions).toEqual(fresh.missions);
    expect(after.achievements).toEqual([]);
    expect(after.history).toEqual([]);
    expect(after.recent).toEqual([]);
    expect(after.ranked).toEqual(fresh.ranked);
    expect(after.lastPlayedAt).toBeUndefined();
  });

  it("keeps every unlocked or discovered fighter, and the player's own choices", () => {
    expect(after.unlocks).toEqual(before.unlocks);
    expect(after.trialsWon).toEqual(before.trialsWon);
    expect(after.discovered).toEqual(before.discovered);
    expect(after.settings).toEqual(before.settings);
    expect(after.favorites).toEqual(before.favorites);
    expect(after.presets).toEqual(before.presets);
    expect(after.install).toEqual(before.install);
  });
});

describe("resetting everything", () => {
  it("gives a brand-new profile and keeps only the install state", () => {
    const before = maxedProfile();
    const after = resetProfile(before, "everything");
    expect(after).toEqual({ ...createDefaultProfile(), install: before.install });
    expect(after.unlocks.legends).toEqual([]);
    expect(after.discovered.characters).toEqual([]);
    expect(after.favorites).toEqual([]);
  });
});

describe("clearing replays", () => {
  it("deletes every replay and nothing else", async () => {
    const store = createMemoryStore();
    await store.set("profile.other", { keep: true });
    await saveReplay(store, sampleReplay("a"));
    await saveReplay(store, sampleReplay("b"));
    expect(await clearReplays(store)).toBe(2);
    expect(await listReplays(store)).toEqual([]);
    expect(await store.get("profile.other")).toEqual({ keep: true });
  });
});
