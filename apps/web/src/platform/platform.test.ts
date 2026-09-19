import { describe, expect, it, vi } from "vitest";
import { ABILITY_LIBRARY, CHARACTER_LIBRARY, PASSIVE_LIBRARY, PLAYABLE_CHARACTERS, TRANSFORMATION_LIBRARY } from "@veilbreak/content";
import {
  QR_MAX_BYTES,
  createDefaultProfile,
  decodeQr,
  decodeTransfer,
  encodeTransfer,
  profileSchema,
  renderQrRgba,
  type Profile,
} from "@veilbreak/persistence";
import { ACHIEVEMENTS, LEGEND_ORDER, LEGEND_TRIALS, MISSIONS, buildIdTable } from "../game/progression";
import { chooseAutosaveFile, hasAutosaveFile, stopAutosave, supportsAutosave, writeAutosave, backupFileName } from "./files";
import { DELETE_WARNING, detectPlatform, installPlan, offerMoveProgress, type Env } from "./install";
import { protectionLabel, requestPersistence } from "./protection";

const env = (over: Partial<Env> = {}): Env => ({ userAgent: "", maxTouchPoints: 0, standalone: false, canPrompt: false, ...over });
const profile = (over: Partial<Profile> = {}): Profile => ({ ...createDefaultProfile(), ...over });
const handled = (over: Partial<Profile> = {}) => profile({ install: { firstLaunchHandled: true, installed: false, asks: 0 }, ...over });

const UA = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0",
  android: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  ipadDesktopUa: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
  firefoxAndroid: "Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
};

describe("platform detection (spec/06 install flow)", () => {
  it("recognises each install path", () => {
    expect(detectPlatform({ userAgent: UA.chrome, maxTouchPoints: 0 })).toBe("chromium");
    expect(detectPlatform({ userAgent: UA.edge, maxTouchPoints: 0 })).toBe("chromium");
    expect(detectPlatform({ userAgent: UA.android, maxTouchPoints: 5 })).toBe("chromium");
    expect(detectPlatform({ userAgent: UA.iphone, maxTouchPoints: 5 })).toBe("ios");
    expect(detectPlatform({ userAgent: UA.ipadDesktopUa, maxTouchPoints: 5 })).toBe("ios"); // iPadOS looks like a Mac
    expect(detectPlatform({ userAgent: UA.safariMac, maxTouchPoints: 0 })).toBe("other");
    expect(detectPlatform({ userAgent: UA.firefox, maxTouchPoints: 0 })).toBe("firefox-desktop");
    expect(detectPlatform({ userAgent: UA.firefoxAndroid, maxTouchPoints: 5 })).not.toBe("firefox-desktop");
  });
});

describe("when the install pitch appears", () => {
  const now = 10 * 24 * 60 * 60 * 1000;

  it("shows the friendly screen on first launch, on every platform that can install", () => {
    for (const platform of ["chromium", "ios", "other", "firefox-desktop"] as const) expect(installPlan(profile(), env(), platform, now)).toBe("screen");
  });

  it("never once installed or already running as the installed app", () => {
    expect(installPlan(profile(), env({ standalone: true }), "ios", now)).toBe("none");
    expect(installPlan(handled({ install: { firstLaunchHandled: true, installed: true, asks: 0 } }), env(), "chromium", now)).toBe("none");
  });

  it("re-asks gently after the first Legend unlock, but never nags", () => {
    const noLegend = handled();
    const withLegend = handled({ unlocks: { legends: ["zeiron"], namelessBossDefeated: false } });
    expect(installPlan(noLegend, env(), "chromium", now)).toBe("none");
    expect(installPlan(withLegend, env(), "chromium", now)).toBe("banner");
    const justAsked = handled({ unlocks: withLegend.unlocks, install: { firstLaunchHandled: true, installed: false, asks: 1, lastAskAt: now - 1000 } });
    expect(installPlan(justAsked, env(), "chromium", now)).toBe("none"); // not again the same day
    const dayLater = handled({ unlocks: withLegend.unlocks, install: { firstLaunchHandled: true, installed: false, asks: 1, lastAskAt: now - 2 * 24 * 3600 * 1000 } });
    expect(installPlan(dayLater, env(), "chromium", now)).toBe("banner");
    const asksExhausted = handled({ unlocks: withLegend.unlocks, install: { firstLaunchHandled: true, installed: false, asks: 3, lastAskAt: 0 } });
    expect(installPlan(asksExhausted, env(), "chromium", now)).toBe("none");
  });

  it("never pitches installing on Firefox desktop after the first screen (backups are emphasised instead)", () => {
    const p = handled({ unlocks: { legends: ["zeiron"], namelessBossDefeated: false } });
    expect(installPlan(p, env(), "firefox-desktop", now)).toBe("none");
  });

  it("offers 'Move my progress into the app' only on iOS, where Safari and the app do not share a save", () => {
    const played = profile({ matchesPlayed: 3 });
    expect(offerMoveProgress(played, env(), "ios")).toBe("in-safari-with-progress");
    expect(offerMoveProgress(profile(), env(), "ios")).toBe("no");
    expect(offerMoveProgress(played, env({ standalone: true }), "ios")).toBe("in-app");
    expect(offerMoveProgress(played, env(), "chromium")).toBe("no");
    expect(DELETE_WARNING).toMatch(/delete the app/i);
  });
});

describe("progress protection (navigator.storage.persist)", () => {
  it("reports Strong when persistence is granted or already held, Standard when refused", async () => {
    expect(await requestPersistence({ persist: async () => true })).toBe("strong");
    expect(await requestPersistence({ persisted: async () => true, persist: async () => false })).toBe("strong");
    expect(await requestPersistence({ persist: async () => false })).toBe("standard");
  });

  it("reports Unknown when the browser has no API or throws", async () => {
    expect(await requestPersistence(undefined)).toBe("unknown");
    expect(await requestPersistence({})).toBe("unknown");
    expect(await requestPersistence({ persist: async () => { throw new Error("blocked"); } })).toBe("unknown");
    expect(protectionLabel("strong")).toMatch(/^Strong/);
    expect(protectionLabel("standard")).toMatch(/^Standard/);
  });
});

describe("auto-save to a chosen file (Chrome/Edge desktop only)", () => {
  function fakeStore() {
    const data = new Map<string, unknown>();
    return { get: async (k: string) => data.get(k), set: async (k: string, v: unknown) => void data.set(k, v), delete: async (k: string) => void data.delete(k) };
  }
  function fakeHandle(permission: PermissionState = "granted") {
    const writes: string[] = [];
    return {
      writes,
      queryPermission: vi.fn(async () => permission),
      requestPermission: vi.fn(async () => "granted" as PermissionState),
      createWritable: async () => ({ write: async (t: string) => void writes.push(t), close: async () => undefined }),
    };
  }

  it("is hidden where the File System Access API does not exist", () => {
    expect(supportsAutosave({})).toBe(false);
    expect(supportsAutosave({ showSaveFilePicker: () => Promise.resolve() })).toBe(true);
  });

  it("stores the chosen file and rewrites it after saves", async () => {
    const store = fakeStore();
    const handle = fakeHandle();
    expect(await hasAutosaveFile(store)).toBe(false);
    expect(await writeAutosave(store, "x")).toBe("none");
    expect(await chooseAutosaveFile(store, { showSaveFilePicker: async () => handle })).toBe(true);
    expect(await hasAutosaveFile(store)).toBe(true);
    expect(await writeAutosave(store, "first")).toBe("written");
    expect(await writeAutosave(store, "second")).toBe("written");
    expect(handle.writes).toEqual(["first", "second"]);
    await stopAutosave(store);
    expect(await writeAutosave(store, "third")).toBe("none");
  });

  it("after a relaunch it asks for one click instead of prompting on its own", async () => {
    const store = fakeStore();
    const handle = fakeHandle("prompt");
    await chooseAutosaveFile(store, { showSaveFilePicker: async () => handle });
    expect(await writeAutosave(store, "a")).toBe("needs-permission");
    expect(handle.requestPermission).not.toHaveBeenCalled();
    expect(await writeAutosave(store, "a", true)).toBe("written");
  });

  it("cancelling the picker is not an error", async () => {
    const store = fakeStore();
    expect(await chooseAutosaveFile(store, { showSaveFilePicker: async () => { throw new DOMException("cancelled", "AbortError"); } })).toBe(false);
  });

  it("names backups by date", () => {
    expect(backupFileName(new Date("2026-09-19T12:00:00Z"))).toBe("veilbreak-backup-2026-09-19.json");
  });
});

describe("a maxed-out profile with the real game content fits one QR code", () => {
  const characters = PLAYABLE_CHARACTERS.map((c) => c.id);
  const pairs = () => Object.fromEntries(characters.map((a) => [a, Object.fromEntries(characters.filter((b) => b !== a).map((b) => [b, 99]))]));
  const maxed = (): Profile =>
    profileSchema.parse({
      version: 3,
      settings: { animationSpeed: "slow", reducedMotion: "on", turnTimer: false, uiScale: "xlarge", highContrast: true, soundEnabled: true, soundVolume: 100, showAllCharacters: true, botLevel: "EXPERT" },
      favorites: characters,
      recent: characters.slice(0, 12),
      played: Object.fromEntries(characters.map((c) => [c, 9999])),
      presets: Array.from({ length: 24 }, (_, i) => ({ id: `preset-${i.toString(36)}m0abcd`, name: `A team with a rather long name ${i}`, characterIds: characters.slice(i % 10, (i % 10) + 3) })),
      discovered: { characters: Object.keys(CHARACTER_LIBRARY), abilities: Object.keys(ABILITY_LIBRARY), passives: Object.keys(PASSIVE_LIBRARY), transformations: Object.keys(TRANSFORMATION_LIBRARY) },
      beat: pairs(),
      wonWith: pairs(),
      matchesPlayed: 99999,
      xp: 9_999_999,
      unlocks: { legends: [...LEGEND_ORDER], namelessBossDefeated: true },
      trialsWon: LEGEND_TRIALS.map((t) => t.id),
      missions: { progress: Object.fromEntries(MISSIONS.map((m) => [m.id, m.goal])), completed: MISSIONS.map((m) => m.id) },
      achievements: ACHIEVEMENTS.map((a) => a.id),
      install: { firstLaunchHandled: true, installed: true, asks: 3, lastAskAt: 1_800_000_000_000 },
      lastPlayedAt: 1_800_000_000_000,
    });

  it("fits in a single QR code, survives being drawn and scanned, and decodes to the same progress", () => {
    const table = buildIdTable();
    const code = encodeTransfer(maxed(), table);
    expect(code.length).toBeLessThanOrEqual(QR_MAX_BYTES);
    const scanned = decodeQr(renderQrRgba(code, 3));
    expect(scanned).toBe(code);
    const decoded = decodeTransfer(scanned!, table);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.profile.unlocks).toEqual(maxed().unlocks);
    expect(decoded.profile.missions.completed).toEqual(maxed().missions.completed);
    expect(decoded.profile.achievements).toEqual(maxed().achievements);
    expect(decoded.profile.xp).toBe(9_999_999);
  });
});
