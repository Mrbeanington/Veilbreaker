import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  BACKUP_KEYS,
  MIGRATIONS,
  PROFILE_VERSION,
  SAVE_KEY,
  createDefaultProfile,
  createIndexedDbStore,
  createMemoryStore,
  levelForXp,
  levelProgress,
  loadProfile,
  migrateProfile,
  parseProfile,
  saveProfile,
  summarizeProfile,
  type KeyValueStore,
} from "./index";

const withXp = (xp: number) => ({ ...createDefaultProfile(), xp });

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

  it("IndexedDB store persists across connections and writes several keys in one transaction", async () => {
    const first = createIndexedDbStore("test-db-a");
    await first.setMany({ one: 1, two: { deep: true } });
    const second = createIndexedDbStore("test-db-a");
    expect(await second.get("one")).toBe(1);
    expect(await second.get("two")).toEqual({ deep: true });
    expect((await second.keys()).sort()).toEqual(["one", "two"]);
    await second.delete("one");
    expect(await first.get("one")).toBeUndefined();
  });

  it("an aborted multi-key write leaves nothing behind (atomic)", async () => {
    const store = createIndexedDbStore("test-db-atomic");
    await store.set("keep", "old");
    // A value IndexedDB cannot clone makes the whole transaction fail.
    await expect(store.setMany({ keep: "new", bad: () => 1 })).rejects.toBeDefined();
    expect(await store.get("keep")).toBe("old");
    expect(await store.get("bad")).toBeUndefined();
  });
});

describe("automatic saving", () => {
  it("a first launch creates a default profile with no login", async () => {
    const result = await loadProfile(createMemoryStore());
    expect(result.source).toBe("fresh");
    expect(result.profile).toEqual(createDefaultProfile());
    expect(result.profile.settings.soundEnabled).toBe(false);
  });

  it("saves and loads through IndexedDB", async () => {
    const store = createIndexedDbStore("test-db-b");
    await saveProfile(store, withXp(250));
    const loaded = await loadProfile(createIndexedDbStore("test-db-b"));
    expect(loaded.source).toBe("current");
    expect(loaded.profile.xp).toBe(250);
  });

  it("keeps a rolling backup of the last 3 snapshots, newest first", async () => {
    const store = createMemoryStore();
    for (let i = 1; i <= 6; i += 1) await saveProfile(store, withXp(i * 100), { snapshot: true, now: i * 1000 });
    const xpAt = async (key: string) => ((await store.get(key)) as { data: { xp: number } }).data.xp;
    expect(await xpAt(SAVE_KEY)).toBe(600);
    expect(await xpAt(BACKUP_KEYS[0])).toBe(500);
    expect(await xpAt(BACKUP_KEYS[1])).toBe(400);
    expect(await xpAt(BACKUP_KEYS[2])).toBe(300);
    expect(await store.keys()).toHaveLength(4); // never more than 3 backups
  });

  it("frequent saves overwrite the current save without churning the backups", async () => {
    const store = createMemoryStore();
    await saveProfile(store, withXp(1), { snapshot: true, now: 0 });
    await saveProfile(store, withXp(2), { now: 1000 });
    await saveProfile(store, withXp(3), { now: 2000 });
    expect(await store.get(BACKUP_KEYS[0])).toBeUndefined();
  });

  it("recovers from a corrupted write using the rolling backups", async () => {
    const store = createMemoryStore();
    await saveProfile(store, withXp(100), { snapshot: true, now: 1 });
    await saveProfile(store, withXp(200), { snapshot: true, now: 2 });
    // Simulate a half-written / damaged current save.
    const damaged = (await store.get(SAVE_KEY)) as { data: { xp: number } };
    damaged.data.xp = 12345; // checksum no longer matches
    await store.set(SAVE_KEY, damaged);
    const result = await loadProfile(store);
    expect(result.source).toBe("backup");
    expect(result.backupIndex).toBe(1);
    expect(result.profile.xp).toBe(100);
    expect(result.problems.join(" ")).toMatch(/checksum/);
  });

  it("skips damaged backups too, and falls back to fresh only when nothing is intact", async () => {
    const store = createMemoryStore({ [SAVE_KEY]: "garbage", [BACKUP_KEYS[0]]: { format: "veilbreak-save" }, [BACKUP_KEYS[1]]: 42 });
    const result = await loadProfile(store);
    expect(result.source).toBe("fresh");
    expect(result.profile).toEqual(createDefaultProfile());
  });

  it("a store that throws never breaks loading", async () => {
    const broken: KeyValueStore = {
      get: () => Promise.reject(new Error("blocked")),
      set: () => Promise.resolve(),
      setMany: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      keys: () => Promise.resolve([]),
    };
    expect((await loadProfile(broken)).source).toBe("fresh");
  });

  it("reads a Phase 08 profile saved under the old key, so nobody loses progress", async () => {
    const legacy = { version: 1, favorites: ["hydra"], matchesPlayed: 4 };
    const result = await loadProfile(createMemoryStore({ profile: legacy }));
    expect(result.source).toBe("legacy");
    expect(result.migratedFrom).toBe(1);
    expect(result.profile.favorites).toEqual(["hydra"]);
    expect(result.profile.version).toBe(PROFILE_VERSION);
  });
});

describe("migrations (every path)", () => {
  it("has a migration for every version below the current one", () => {
    for (let v = 1; v < PROFILE_VERSION; v += 1) expect(MIGRATIONS[v]).toBeTypeOf("function");
  });

  it("v1 -> current keeps every v1 field and fills the new ones", () => {
    const v1 = {
      version: 1,
      settings: { uiScale: "large", botLevel: "EXPERT" },
      favorites: ["hydra"],
      recent: ["koschei"],
      played: { hydra: 3 },
      presets: [{ id: "p1", name: "Trio", characterIds: ["hydra", "shiro", "koschei"] }],
      discovered: { characters: ["hydra"], abilities: ["ability.hydra.serpent-bite"], passives: [], transformations: [] },
      beat: { hydra: { shiro: 2 } },
      wonWith: {},
      matchesPlayed: 7,
    };
    const parsed = parseProfile(v1);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.migratedFrom).toBe(1);
    const p = parsed.profile;
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.settings.uiScale).toBe("large");
    expect(p.favorites).toEqual(["hydra"]);
    expect(p.presets[0]?.name).toBe("Trio");
    expect(p.beat.hydra?.shiro).toBe(2);
    expect(p.matchesPlayed).toBe(7);
    expect(p.xp).toBe(0);
    expect(p.unlocks).toEqual({ legends: [], namelessBossDefeated: false });
    expect(p.history).toEqual([]);
    expect(p.install.firstLaunchHandled).toBe(false);
  });

  it("the current version needs no migration", () => {
    const parsed = parseProfile(createDefaultProfile());
    expect(parsed.ok && parsed.migratedFrom).toBeFalsy();
  });

  it("rejects garbage, missing versions and saves from a newer game", () => {
    for (const bad of [null, "x", 5, [], {}, { version: "2" }, { version: 0 }, { version: 1.5 }]) expect(parseProfile(bad).ok).toBe(false);
    const future = parseProfile({ version: PROFILE_VERSION + 1 });
    expect(future.ok).toBe(false);
    if (!future.ok) expect(future.reason).toMatch(/newer/);
  });

  it("lenient migration drops a damaged settings block but keeps the rest", () => {
    const damaged = { ...createDefaultProfile(), favorites: ["hydra"], settings: { uiScale: "gigantic" } };
    const result = migrateProfile(damaged);
    expect(result.favorites).toEqual(["hydra"]);
    expect(result.settings.uiScale).toBe("normal");
    expect(migrateProfile("nonsense")).toEqual(createDefaultProfile());
  });
});

describe("account level", () => {
  it("grows with xp, each level needing 100 more than the last", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelProgress(350)).toEqual({ level: 3, into: 50, needed: 300 });
  });

  it("summarises a profile for the overwrite confirmation", () => {
    const s = summarizeProfile({ ...withXp(300), matchesPlayed: 9, lastPlayedAt: 5, unlocks: { legends: ["zeiron", "shiro"], namelessBossDefeated: false } });
    expect(s).toEqual({ level: 3, legends: 2, matches: 9, lastPlayedAt: 5 });
  });
});
