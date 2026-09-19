import { describe, expect, it } from "vitest";
import {
  BALANCE_FORMAT,
  BASE_BALANCE_VERSION_ID,
  SHIPPED_BALANCE_PATCHES,
  TUNABLE_CATEGORIES,
  applyBalanceDraft,
  balanceDraftSchema,
  baseLibraries,
  createDraft,
  librariesForVersion,
  listTunables,
} from "./balance";

const base = baseLibraries();
const tunables = listTunables(base);
const find = (predicate: (t: (typeof tunables)[number]) => boolean) => {
  const t = tunables.find(predicate);
  if (!t) throw new Error("no such tunable");
  return t;
};
const draftOf = (...changes: [string, number][]) => createDraft("test-draft", changes.map(([path, value]) => ({ path, value })), "2026-09-19T00:00:00.000Z");

describe("what the balance tools can change", () => {
  it("covers health, damage, healing, costs, cooldowns, durations, status values, transformation requirements, random weights and energy rules", () => {
    for (const { id } of TUNABLE_CATEGORIES) {
      expect(tunables.filter((t) => t.category === id).length, id).toBeGreaterThan(0);
    }
  });

  it("finds every character's health", () => {
    const hp = tunables.filter((t) => t.category === "hp" && t.library === "characters");
    expect(hp.length).toBe(Object.keys(base.characters).length);
    expect(hp.every((t) => t.path === `characters/${t.ownerId}/baseHp` && t.value === base.characters[t.ownerId]?.baseHp)).toBe(true);
  });

  it("has unique paths, whole numbers, and current values at or above the minimum", () => {
    expect(new Set(tunables.map((t) => t.path)).size).toBe(tunables.length);
    for (const t of tunables) {
      expect(Number.isInteger(t.value), t.path).toBe(true);
      expect(t.value, t.path).toBeGreaterThanOrEqual(t.min);
    }
  });

  it("reads the numbers from the real data", () => {
    const hydra = find((t) => t.path === "characters/hydra/baseHp");
    expect(hydra.value).toBe(base.characters.hydra?.baseHp);
    expect(hydra.label).toMatch(/Hydra/);
  });
});

describe("applying a draft", () => {
  it("an empty draft gives libraries equal to the shipped ones", () => {
    const r = applyBalanceDraft(base, draftOf());
    expect(r.ok && r.libs).toEqual(base);
    expect(r.ok && r.diff).toEqual([]);
  });

  it("changes only what the draft says, and never touches the shipped data", () => {
    const before = JSON.stringify(base.characters);
    const hp = find((t) => t.path === "characters/hydra/baseHp");
    const r = applyBalanceDraft(base, draftOf([hp.path, hp.value + 50]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.libs.characters.hydra?.baseHp).toBe(hp.value + 50);
    expect(r.libs.characters.shiro).toEqual(base.characters.shiro);
    expect(r.diff).toEqual([expect.objectContaining({ path: hp.path, before: hp.value, after: hp.value + 50, category: "hp" })]);
    expect(JSON.stringify(base.characters)).toBe(before);
    expect(base.characters.hydra?.baseHp).toBe(hp.value);
  });

  it("edits deep values: damage, cooldown, cost, duration, random weight, transformation requirement and energy rules", () => {
    const pick = (category: string) => find((t) => t.category === category && t.library !== "characters");
    const targets = ["damage", "cooldown", "cost", "duration", "rng", "transformation", "energy"].map(pick);
    const changes = targets.map((t) => [t.path, t.value + 10] as [string, number]);
    const r = applyBalanceDraft(base, draftOf(...changes));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.diff).toHaveLength(targets.length);
    const after = new Map(listTunables(r.libs).map((t) => [t.path, t.value]));
    for (const t of targets) expect(after.get(t.path), t.path).toBe(t.value + 10);
    // Everything else is unchanged.
    const changed = new Set(targets.map((t) => t.path));
    for (const t of tunables) if (!changed.has(t.path)) expect(after.get(t.path), t.path).toBe(t.value);
  });

  it("warns when damage or healing leaves the multiples-of-10 damage language, but still applies it", () => {
    const dmg = find((t) => t.category === "damage");
    const r = applyBalanceDraft(base, draftOf([dmg.path, 25]));
    expect(r.ok && r.warnings[0]).toMatch(/multiple of 10/);
    expect(r.ok && listTunables(r.libs).find((t) => t.path === dmg.path)?.value).toBe(25);
  });

  it("is atomic: one bad change rejects the whole draft", () => {
    const hp = find((t) => t.path === "characters/hydra/baseHp");
    const r = applyBalanceDraft(base, draftOf([hp.path, 999], ["characters/hydra/nonsense", 1]));
    expect(r.ok).toBe(false);
  });

  it("rejects paths that are not tunable, duplicates, and values under the minimum, saying why", () => {
    const hp = find((t) => t.path === "characters/hydra/baseHp");
    const notTunable = applyBalanceDraft(base, draftOf(["characters/hydra/displayName", 3]));
    expect(!notTunable.ok && notTunable.errors[0]).toMatch(/not a value the balance tools can change/);
    const missing = applyBalanceDraft(base, draftOf(["characters/nobody/baseHp", 3]));
    expect(missing.ok).toBe(false);
    const twice = applyBalanceDraft(base, draftOf([hp.path, 100], [hp.path, 200]));
    expect(!twice.ok && twice.errors[0]).toMatch(/twice/);
    const zeroHp = applyBalanceDraft(base, draftOf([hp.path, 0]));
    expect(!zeroHp.ok && zeroHp.errors[0]).toMatch(/minimum/);
    const dmg = find((t) => t.category === "damage");
    expect(applyBalanceDraft(base, draftOf([dmg.path, 0])).ok).toBe(false); // damage must stay positive
  });

  it("rejects malformed files: wrong format, wrong types, out of range, not an object", () => {
    const good = draftOf();
    for (const bad of [null, "text", 5, [], { ...good, format: "other" }, { ...good, formatVersion: 2 }, { ...good, id: "Not Kebab" }, { ...good, createdAt: "yesterday" }, { ...good, changes: [{ path: "x", value: 1.5 }] }, { ...good, changes: [{ path: "x", value: -1 }] }, { ...good, changes: [{ path: "x", value: 1e9 }] }, { ...good, changes: "no" }]) {
      expect(applyBalanceDraft(base, bad).ok, JSON.stringify(bad)).toBe(false);
    }
    expect(balanceDraftSchema.safeParse({ ...good, changes: Array.from({ length: 3001 }, () => ({ path: "x", value: 1 })) }).success).toBe(false);
  });

  it("is deterministic: the same draft always gives the same libraries", () => {
    const changes = tunables.filter((t) => t.category === "damage").slice(0, 8).map((t) => [t.path, t.value + 10] as [string, number]);
    expect(applyBalanceDraft(base, draftOf(...changes))).toEqual(applyBalanceDraft(base, draftOf(...changes)));
  });
});

describe("an exported balance file round-trips through validation", () => {
  it("survives JSON export, re-parse and re-apply with identical results", () => {
    const changes = tunables.filter((t) => ["hp", "damage", "cooldown", "cost", "rng"].includes(t.category)).filter((_, i) => i % 9 === 0).map((t) => ({ path: t.path, value: t.value + (t.category === "hp" ? 30 : 10) }));
    expect(changes.length).toBeGreaterThan(10);
    const draft = createDraft("round-trip", changes, "2026-09-19T00:00:00.000Z", "Buff a few things.");
    const applied = applyBalanceDraft(base, draft);
    expect(applied.ok).toBe(true);

    const file = JSON.stringify(draft, null, 2);
    const reread = JSON.parse(file);
    expect(balanceDraftSchema.parse(reread)).toEqual(draft);
    const reapplied = applyBalanceDraft(base, reread);
    expect(reapplied).toEqual(applied);
    expect(draft.format).toBe(BALANCE_FORMAT);
  });
});

describe("balance versions", () => {
  it("resolves the shipped base version, and does not know invented ones", () => {
    expect(librariesForVersion(BASE_BALANCE_VERSION_ID)).toEqual(base);
    expect(librariesForVersion("some-future-version")).toBeNull();
  });

  it("every version published with the game applies cleanly and resolves by id", () => {
    for (const patch of SHIPPED_BALANCE_PATCHES) {
      expect(applyBalanceDraft(base, patch).ok, patch.id).toBe(true);
      expect(librariesForVersion(patch.id)).not.toBeNull();
      expect(patch.id).not.toBe(BASE_BALANCE_VERSION_ID);
    }
  });
});
