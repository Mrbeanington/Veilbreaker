import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  createDefaultProfile,
  createIndexedDbStore,
  createMemoryStore,
  loadProfile,
  migrateProfile,
  saveProfile,
} from "./index";

describe("stores", () => {
  it("memory store round-trips and isolates values", async () => {
    const store = createMemoryStore();
    const value = { a: [1, 2] };
    await store.set("k", value);
    value.a.push(3);
    expect(await store.get("k")).toEqual({ a: [1, 2] });
    await store.delete("k");
    expect(await store.get("k")).toBeUndefined();
  });

  it("IndexedDB store persists across connections", async () => {
    const first = createIndexedDbStore("test-db-1");
    await first.set("profile", { hello: "world" });
    const second = createIndexedDbStore("test-db-1");
    expect(await second.get("profile")).toEqual({ hello: "world" });
    await second.delete("profile");
    expect(await first.get("profile")).toBeUndefined();
  });
});

describe("profile", () => {
  it("a first launch creates a default profile automatically", async () => {
    const profile = await loadProfile(createMemoryStore());
    expect(profile).toEqual(createDefaultProfile());
    expect(profile.settings.turnTimer).toBe(true);
    expect(profile.settings.soundEnabled).toBe(false); // silent by default
  });

  it("saves and loads through IndexedDB", async () => {
    const store = createIndexedDbStore("test-db-2");
    const profile = { ...createDefaultProfile(), favorites: ["tortuga-rex"] };
    await saveProfile(store, profile);
    expect((await loadProfile(createIndexedDbStore("test-db-2"))).favorites).toEqual(["tortuga-rex"]);
  });

  it("garbage, damaged and future data never crash loading", () => {
    expect(migrateProfile("nonsense")).toEqual(createDefaultProfile());
    expect(migrateProfile(null)).toEqual(createDefaultProfile());
    expect(migrateProfile({ version: 99, favorites: 5 })).toEqual(createDefaultProfile());
  });

  it("a damaged settings block is dropped but the rest of the profile survives", () => {
    const damaged = { ...createDefaultProfile(), favorites: ["hydra"], settings: { uiScale: "gigantic" } };
    const result = migrateProfile(damaged);
    expect(result.favorites).toEqual(["hydra"]);
    expect(result.settings.uiScale).toBe("normal");
  });

  it("a store that throws still yields a usable profile", async () => {
    const broken = { get: () => Promise.reject(new Error("blocked")), set: () => Promise.resolve(), delete: () => Promise.resolve() };
    expect(await loadProfile(broken)).toEqual(createDefaultProfile());
  });
});
