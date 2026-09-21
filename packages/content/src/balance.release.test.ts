import { describe, expect, it } from "vitest";
import {
  ABILITY_LIBRARY,
  CHARACTER_LIBRARY,
  PASSIVE_LIBRARY,
  STATUS_LIBRARY,
  SUMMON_LIBRARY,
  TRANSFORMATION_LIBRARY,
  BASE_BALANCE_VERSION_ID,
  CURRENT_BALANCE_VERSION_ID,
  SHIPPED_BALANCE_PATCHES,
  activateBalance,
  applyBalanceDraft,
  balanceFingerprint,
  baseLibraries,
  createDraft,
  currentBalanceVersionId,
  defaultEnergyRules,
  librariesForVersion,
  listTunables,
} from "./index";

// Release balance versioning (ADR-035). Numbers in source are the base version;
// changing one means publishing a patch, so recorded replays stay reproducible.

const BASE_FINGERPRINT = "bd1d5c96";

describe("the released base balance", () => {
  it("has a pinned fingerprint: changing a number in source without publishing a patch fails here", () => {
    expect(balanceFingerprint(baseLibraries())).toBe(BASE_FINGERPRINT);
  });

  it("with no patch shipped, new matches use the base id", () => {
    expect(SHIPPED_BALANCE_PATCHES.length === 0 ? CURRENT_BALANCE_VERSION_ID : "skip").toBe(SHIPPED_BALANCE_PATCHES.length === 0 ? BASE_BALANCE_VERSION_ID : "skip");
  });

  it("every shipped patch applies cleanly to the base, is cumulative against it, and has a unique id", () => {
    const ids = new Set<string>([BASE_BALANCE_VERSION_ID]);
    for (const patch of SHIPPED_BALANCE_PATCHES) {
      expect(ids.has(patch.id), `duplicate id ${patch.id}`).toBe(false);
      ids.add(patch.id);
      expect(patch.baseVersionId).toBe(BASE_BALANCE_VERSION_ID);
      expect(applyBalanceDraft(baseLibraries(), patch).ok, patch.id).toBe(true);
      expect(librariesForVersion(patch.id)).not.toBeNull();
    }
    expect(CURRENT_BALANCE_VERSION_ID).toBe(currentBalanceVersionId());
  });

  it("does not know the old development id, so its replays are flagged rather than replayed", () => {
    expect(librariesForVersion("phase-05-v1")).toBeNull();
  });
});

describe("the published release-2 patch", () => {
  const patch = SHIPPED_BALANCE_PATCHES.find((p) => p.id === "release-2")!;
  it("is shipped, is the current version, and builds on release-1", () => {
    expect(patch).toBeDefined();
    expect(patch.baseVersionId).toBe(BASE_BALANCE_VERSION_ID);
    expect(CURRENT_BALANCE_VERSION_ID).toBe("release-3");
  });
  it("applies cleanly: every change alters a number, stays in the damage language and passes its schema", () => {
    const applied = applyBalanceDraft(baseLibraries(), patch);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.diff).toHaveLength(patch.changes.length);
    expect(applied.warnings).toEqual([]);
  });
  it("has a pinned fingerprint, so an edit to the patch file is deliberate", () => {
    expect(balanceFingerprint(librariesForVersion("release-2")!)).toBe("87a63a4e");
  });
  it("leaves release-1 exactly as released for old replays", () => {
    expect(balanceFingerprint(librariesForVersion(BASE_BALANCE_VERSION_ID)!)).toBe("bd1d5c96");
  });
});

describe("the published release-3 patch", () => {
  const patch = SHIPPED_BALANCE_PATCHES.find((p) => p.id === "release-3")!;
  it("is the newest version and contains every release-2 change, so it can stand alone against release-1", () => {
    expect(SHIPPED_BALANCE_PATCHES[SHIPPED_BALANCE_PATCHES.length - 1]).toBe(patch);
    const release2 = SHIPPED_BALANCE_PATCHES.find((p) => p.id === "release-2")!;
    const paths = new Set(patch.changes.map((c) => c.path));
    for (const c of release2.changes) expect(paths.has(c.path), c.path).toBe(true);
    expect(patch.changes.length).toBeGreaterThan(release2.changes.length);
  });
  it("applies cleanly with no damage-language warnings", () => {
    const applied = applyBalanceDraft(baseLibraries(), patch);
    expect(applied.ok).toBe(true);
    if (applied.ok) expect(applied.warnings).toEqual([]);
  });
  it("has a pinned fingerprint", () => {
    expect(balanceFingerprint(librariesForVersion("release-3")!)).toBe("987a9eeb");
  });
});

describe("activating a published patch", () => {
  const target = listTunables(baseLibraries()).find((t) => t.category === "damage")!;
  const before = target.value;
  const energy = listTunables(baseLibraries()).find((t) => t.library === "energyRules" && t.path.endsWith("poolCap"))!;
  const patch = createDraft("release-test", [{ path: target.path, value: before + 10 }, { path: energy.path, value: energy.value + 1 }], "2026-09-20T00:00:00.000Z");
  const patches = [patch];

  it("reports the newest patch as current and keeps every version resolvable", () => {
    expect(currentBalanceVersionId(patches)).toBe("release-test");
    const old = librariesForVersion(BASE_BALANCE_VERSION_ID, patches)!;
    const next = librariesForVersion("release-test", patches)!;
    expect(listTunables(old).find((t) => t.path === target.path)!.value).toBe(before);
    expect(listTunables(next).find((t) => t.path === target.path)!.value).toBe(before + 10);
  });

  it("changes the live libraries in place, while the base stays exactly as released", () => {
    const fingerprint = balanceFingerprint(baseLibraries());
    expect(activateBalance(patches)).toBe("release-test");
    const live = listTunables({ characters: CHARACTER_LIBRARY, abilities: ABILITY_LIBRARY, passives: PASSIVE_LIBRARY, statuses: STATUS_LIBRARY, transformations: TRANSFORMATION_LIBRARY, summons: SUMMON_LIBRARY, energyRules: defaultEnergyRules });
    expect(live.find((t) => t.path === target.path)?.value).toBe(before + 10);
    expect(defaultEnergyRules.poolCap).toBe(energy.value + 1);
    expect(balanceFingerprint(baseLibraries())).toBe(fingerprint);
    expect(librariesForVersion(BASE_BALANCE_VERSION_ID, patches)!.energyRules.poolCap).toBe(energy.value);
  });

  it("refuses a broken patch instead of half-applying it", () => {
    expect(() => activateBalance([createDraft("release-3", [{ path: "abilities/nope/amount", value: 10 }])])).toThrow(/invalid/);
  });
});
