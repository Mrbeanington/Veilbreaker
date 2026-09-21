// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createDefaultProfile, createMemoryStore, saveProfile } from "@veilbreak/persistence";
import { AppShell } from "../App";
import { ProfileProvider } from "../profile/ProfileContext";
import { SettingsProvider } from "../settings/SettingsContext";
import { FeedbackPanel } from "./FeedbackPanel";
import { MAX_EVENTS, readLog, recordEvent, type PlaytestEvent } from "./log";
import { buildReport, decodeReport, encodeReport, type ReportEnv } from "./report";

vi.mock("../game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));
afterEach(cleanup);

const env: ReportEnv = { balance: "release-4", ua: "TestBrowser/1", width: 1000, height: 700, touch: false, lang: "en" };
const ev = (t: number, type: PlaytestEvent["type"], data?: PlaytestEvent["data"]): PlaytestEvent => ({ t, type, ...(data ? { data } : {}) });

describe("playtest log", () => {
  it("keeps events in order even when written back to back", async () => {
    const store = createMemoryStore();
    await Promise.all([recordEvent(store, "open", undefined, 1), recordEvent(store, "screen", { name: "play" }, 2), recordEvent(store, "screen", { name: "teams" }, 3)]);
    expect((await readLog(store)).map((e) => e.t)).toEqual([1, 2, 3]);
  });
  it("is capped, and shortens long text", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < MAX_EVENTS + 20; i += 1) await recordEvent(store, "screen", { name: "x".repeat(400) }, i);
    const log = await readLog(store);
    expect(log).toHaveLength(MAX_EVENTS);
    expect(log[0]!.t).toBe(20);
    expect(String(log[0]!.data!.name).length).toBe(160);
  });
  it("never throws, even from a broken store", async () => {
    const broken = { get: () => Promise.reject(new Error("no")), set: () => Promise.reject(new Error("no")), setMany: () => Promise.reject(new Error("no")), delete: () => Promise.reject(new Error("no")), keys: () => Promise.resolve([]) };
    await expect(recordEvent(broken, "open")).resolves.toBeUndefined();
    expect(await readLog(broken)).toEqual([]);
  });
});

describe("playtest report", () => {
  const log: PlaytestEvent[] = [
    ev(1000, "open"),
    ev(2000, "screen", { name: "play" }),
    ev(3000, "tutorial-start"),
    ev(4000, "match-start", { mode: "bot", tutorial: true }),
    ev(9000, "match-end", { mode: "bot", result: "win", turns: 6, seconds: 5, tutorial: true, team: "a,b,c", foe: "d,e,f" }),
    ev(9100, "tutorial-done"),
    ev(9500, "error", { message: "boom" }),
  ];
  const profile = { ...createDefaultProfile(), xp: 350, matchesPlayed: 1 };

  it("summarises the funnel, progress and matches", () => {
    const r = buildReport({ profile, log, env, now: 5 });
    expect(r.funnel).toMatchObject({ sessions: 1, tutorialStarted: true, tutorialFinished: true, tutorialSkipped: false, secondsToFirstMatch: 3, matchesStarted: 1, matchesFinished: 1 });
    expect(r.progress).toMatchObject({ level: 3, matches: 1 });
    expect(r.matches[0]).toMatchObject({ result: "win", turns: 6, tutorial: true });
    expect(r.screens).toEqual({ play: 1 });
    expect(r.errors).toEqual(["boom"]);
  });
  it("round-trips through a code that is short and easy to paste", () => {
    const r = buildReport({ profile, log, env, feedback: { fun: 4, clear: 3, tutorial: "partly", again: "yes", comment: "The target step confused me." }, now: 5 });
    const code = encodeReport(r);
    expect(code.startsWith("VBP1.")).toBe(true);
    expect(code).toMatch(/^[A-Za-z0-9_.-]+$/);
    expect(code.length).toBeLessThan(2500);
    expect(decodeReport(code)).toEqual(r);
    expect(decodeReport(`  ${code.slice(0, 20)}\n${code.slice(20)}  `)).toEqual(r); // whitespace from a chat app is fine
  });
  it("cleans up feedback and rejects codes that are not reports", () => {
    const r = buildReport({ profile, log, env, feedback: { fun: 9, clear: -2, tutorial: "odd" as never, again: "odd" as never, comment: "x".repeat(2000) }, now: 5 });
    expect(r.feedback).toMatchObject({ fun: 5, clear: 1, tutorial: "skipped", again: "maybe" });
    expect(r.feedback!.comment).toHaveLength(600);
    for (const bad of ["", "hello", "VBP1.", "VBP1.notvalid!!", "VBP2.abc"]) expect(decodeReport(bad)).toBeNull();
  });
  it("contains nothing personal: no ids, names or save contents beyond counts", () => {
    const text = JSON.stringify(buildReport({ profile, log, env, now: 5 }));
    expect(text).not.toMatch(/favorites|presets|history|discovered/);
  });
});

describe("feedback panel", () => {
  it("needs the two ratings, then gives a decodable code", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    await saveProfile(store, createDefaultProfile());
    render(
      <SettingsProvider store={store}>
        <ProfileProvider store={store}>
          <FeedbackPanel />
        </ProfileProvider>
      </SettingsProvider>,
    );
    const create = await screen.findByRole("button", { name: "Create my report" });
    expect(create).toBeDisabled();
    await user.click(screen.getAllByRole("radio", { name: "4" })[0]!);
    await user.click(screen.getAllByRole("radio", { name: "2" })[1]!);
    await user.type(screen.getByLabelText(/Anything confusing/), "Too many buttons.");
    expect(create).toBeEnabled();
    await user.click(create);
    const code = (await screen.findByLabelText("Your report code")) as HTMLTextAreaElement;
    const report = decodeReport(code.value)!;
    expect(report.feedback).toMatchObject({ fun: 4, clear: 2, comment: "Too many buttons." });
    expect((await readLog(store)).some((e) => e.type === "feedback")).toBe(true);
  });
});

describe("what the app records", () => {
  it("logs the session opening, screens visited and a skipped tutorial", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore();
    const base = createDefaultProfile();
    await saveProfile(store, { ...base, install: { ...base.install, firstLaunchHandled: true } });
    render(
      <SettingsProvider store={store}>
        <AppShell />
      </SettingsProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "I know how to play" }));
    await user.click(screen.getByRole("button", { name: "Teams" }));
    await waitFor(async () => {
      const types = (await readLog(store)).map((e) => e.type);
      expect(types).toContain("open");
      expect(types).toContain("screen");
      expect(types).toContain("tutorial-skip");
    });
  });
});
