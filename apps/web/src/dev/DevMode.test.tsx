// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { applyBalanceDraft, balanceDraftSchema, baseLibraries, createDraft, listTunables } from "@veilbreak/content";
import { createDefaultProfile, createMemoryStore, saveProfile } from "@veilbreak/persistence";
import { SettingsProvider } from "../settings/SettingsContext";
import { AppShell } from "../App";
import DevMode from "./DevMode";
import { MAX_DRAFTS, deleteDraft, draftIdFrom, listDrafts, saveDraft } from "./drafts";
import { OUTLIER_HIGH, OUTLIER_LOW, compareReports, flagFor, simulateBalance } from "./simulation";

const downloads: { text: string; name: string }[] = [];
vi.mock("../platform/files", async (original) => ({
  ...(await original<typeof import("../platform/files")>()),
  downloadText: (text: string, name: string) => downloads.push({ text, name }),
}));
vi.mock("../game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));

beforeEach(() => {
  downloads.length = 0;
});
afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

async function seeded() {
  const store = createMemoryStore();
  const base = createDefaultProfile();
  await saveProfile(store, { ...base, install: { ...base.install, firstLaunchHandled: true } });
  return store;
}

async function mountWorkbench() {
  const store = await seeded();
  render(
    <SettingsProvider store={store}>
      <DevMode />
    </SettingsProvider>,
  );
  return store;
}

async function newDraft(user: ReturnType<typeof userEvent.setup>, name = "Tortoise buff") {
  await user.type(await screen.findByLabelText("New draft name"), name);
  await user.click(screen.getByRole("button", { name: "Create draft" }));
  await screen.findByLabelText("Editing");
}

describe("the balance workbench", () => {
  it("creates a draft, edits a value, and shows the diff with schema validation", async () => {
    const user = userEvent.setup();
    const store = await mountWorkbench();
    await newDraft(user);
    expect(screen.getByText(/0 values differ from the shipped version/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "tortuga rex: baseHp" } });
    const input = await screen.findByLabelText(/Tortuga Rex: baseHp/);
    const was = Number((input as HTMLInputElement).value);
    fireEvent.change(input, { target: { value: String(was + 30) } });

    expect(await screen.findByText(/1 value differs from the shipped version/)).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText(String(was))).toBeInTheDocument();
    expect(within(table).getByText(String(was + 30))).toBeInTheDocument();

    // It is saved as a draft in IndexedDB, and the change survives a reload of the list.
    await waitFor(async () => expect((await listDrafts(store))[0]?.changes).toEqual([{ path: "characters/tortuga-rex/baseHp", value: was + 30 }]));
  });

  it("puts a value back to normal when it is set to the shipped number again", async () => {
    const user = userEvent.setup();
    const store = await mountWorkbench();
    await newDraft(user);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "tortuga rex: baseHp" } });
    const input = (await screen.findByLabelText(/Tortuga Rex: baseHp/)) as HTMLInputElement;
    const was = Number(input.value);
    fireEvent.change(input, { target: { value: String(was + 10) } });
    await screen.findByText(/1 value differs/);
    fireEvent.change(input, { target: { value: String(was) } });
    await screen.findByText(/0 values differ/);
    await waitFor(async () => expect((await listDrafts(store))[0]?.changes).toEqual([]));
  });

  it("explains an invalid draft in plain words and blocks export and simulation", async () => {
    const user = userEvent.setup();
    await mountWorkbench();
    await newDraft(user);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "tortuga rex: baseHp" } });
    fireEvent.change(await screen.findByLabelText(/Tortuga Rex: baseHp/), { target: { value: "0" } });
    expect(await screen.findByText(/below the minimum of 1/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Run simulation" })).toBeDisabled();
  });

  it("filters the values by kind", async () => {
    const user = userEvent.setup();
    await mountWorkbench();
    await newDraft(user);
    await user.selectOptions(screen.getByLabelText("Kind"), "cooldown");
    const list = await screen.findAllByLabelText(/cooldown/i);
    expect(list.length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/baseHp/)).not.toBeInTheDocument();
  });

  it("runs a simulation of the shipped balance against the draft and shows outlier flags and recommendations", async () => {
    const user = userEvent.setup();
    await mountWorkbench();
    await newDraft(user);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "hydra: baseHp" } });
    fireEvent.change(await screen.findByLabelText(/Hydra: baseHp/), { target: { value: "10" } });
    await screen.findByText(/1 value differs/);
    fireEvent.change(screen.getByLabelText("Matches"), { target: { value: "20" } });
    await user.click(screen.getByRole("button", { name: "Run simulation" }));
    expect(await screen.findByRole("heading", { name: "Character win rates" }, { timeout: 20000 })).toBeInTheDocument();
    expect(screen.getByText(/nothing is changed automatically/i)).toBeInTheDocument();
    expect(screen.getAllByRole("row").some((r) => /hydra/.test(r.textContent ?? ""))).toBe(true);
  }, 30000);

  it("exports the draft as JSON that validates and re-applies to the same libraries", async () => {
    const user = userEvent.setup();
    await mountWorkbench();
    await newDraft(user, "Round trip");
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "hydra: baseHp" } });
    const buffed = (baseLibraries().characters.hydra?.baseHp ?? 100) + 40;
    fireEvent.change(await screen.findByLabelText(/Hydra: baseHp/), { target: { value: String(buffed) } });
    await screen.findByText(/1 value differs/);
    await user.click(screen.getByRole("button", { name: /Download round-trip.json/ }));

    expect(downloads).toHaveLength(1);
    expect(downloads[0]?.name).toBe("balance-round-trip.json");
    const exported = JSON.parse(downloads[0]!.text);
    const draft = balanceDraftSchema.parse(exported);
    expect(draft.changes).toEqual([{ path: "characters/hydra/baseHp", value: buffed }]);
    const applied = applyBalanceDraft(baseLibraries(), exported);
    expect(applied.ok && applied.libs.characters.hydra?.baseHp).toBe(buffed);
  });

  it("imports a valid draft file and refuses an invalid one with a reason", async () => {
    const user = userEvent.setup();
    const store = await mountWorkbench();
    const hp = listTunables(baseLibraries()).find((t) => t.path === "characters/shiro/baseHp")!;
    const good = createDraft("from-file", [{ path: hp.path, value: hp.value + 20 }], "2026-09-19T00:00:00.000Z");
    const upload = (name: string, text: string) => user.upload(screen.getByLabelText("Import a draft file"), new File([text], name, { type: "application/json" }));

    await upload("good.json", JSON.stringify(good));
    await waitFor(async () => expect((await listDrafts(store)).map((d) => d.id)).toEqual(["from-file"]));

    await upload("bad.json", JSON.stringify({ ...good, changes: [{ path: "characters/shiro/displayName", value: 1 }] }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/not a valid balance draft/);
    await upload("junk.json", "{not json");
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/could not be read/));
    expect(await listDrafts(store)).toHaveLength(1);
  });
});

describe("dev mode is opt-in", () => {
  it("is not in the navigation without the URL flag", async () => {
    const store = await seeded();
    render(
      <SettingsProvider store={store}>
        <AppShell />
      </SettingsProvider>,
    );
    await screen.findByRole("button", { name: "Play" });
    expect(screen.queryByRole("button", { name: "Dev" })).not.toBeInTheDocument();
  });

  it("appears with ?dev=1 and opens the workbench", async () => {
    window.history.replaceState({}, "", "/?dev=1");
    const store = await seeded();
    const user = userEvent.setup();
    render(
      <SettingsProvider store={store}>
        <AppShell />
      </SettingsProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "Dev" }));
    expect(await screen.findByRole("heading", { name: "Balance workbench" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.queryByRole("heading", { name: "Balance workbench" })).not.toBeInTheDocument();
  });
});

describe("draft storage", () => {
  it("saves, lists (newest first) and deletes drafts, and refuses invalid ones", async () => {
    const store = createMemoryStore();
    await saveDraft(store, createDraft("older", [], "2026-01-01T00:00:00.000Z"));
    await saveDraft(store, createDraft("newer", [], "2026-06-01T00:00:00.000Z"));
    expect((await listDrafts(store)).map((d) => d.id)).toEqual(["newer", "older"]);
    await deleteDraft(store, "older");
    expect((await listDrafts(store)).map((d) => d.id)).toEqual(["newer"]);
    await expect(saveDraft(store, { ...createDraft("bad"), changes: [{ path: "x", value: -1 }] })).rejects.toThrow();
    await store.set("dev.balance.draft.junk", { nonsense: true });
    expect((await listDrafts(store)).map((d) => d.id)).toEqual(["newer"]); // damaged entries are skipped
  });

  it("caps the number of drafts, but lets an existing one be updated", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < MAX_DRAFTS; i += 1) await saveDraft(store, createDraft(`d-${i}`));
    await expect(saveDraft(store, createDraft("one-too-many"))).rejects.toThrow(/At most/);
    await expect(saveDraft(store, createDraft("d-3", [], "2027-01-01T00:00:00.000Z"))).resolves.toBeUndefined();
  });

  it("makes safe, unique ids from a free-form name", () => {
    expect(draftIdFrom("Tortoise Buff! (v2)", [])).toBe("tortoise-buff-v2");
    expect(draftIdFrom("Tortoise Buff", ["tortoise-buff"])).toBe("tortoise-buff-2");
    expect(draftIdFrom("!!!", [])).toBe("draft");
    expect(draftIdFrom("x".repeat(200), []).length).toBeLessThanOrEqual(36);
  });
});

describe("balance simulation", () => {
  it("is deterministic, and a draft changes the outcome", () => {
    const hydra = listTunables(baseLibraries()).find((t) => t.path === "characters/hydra/baseHp")!;
    const nerf = createDraft("hydra-nerf", [{ path: hydra.path, value: 10 }]);
    const run = (draft: typeof nerf | null) => simulateBalance({ draft, matches: 150, seed: 3, bot: "BEGINNER" });
    const a = run(null);
    const b = run(null);
    const c = run(nerf);
    expect(a).toEqual(b);
    if (!a.ok || !c.ok) throw new Error("simulation failed");
    const rate = (r: typeof a) => r.report.characters.find((x) => x.id === "hydra")!.winRate;
    expect(rate(c)).toBeLessThan(rate(a));
    const rows = compareReports(a.report, c.report);
    expect(rows[0]?.id).toBe("hydra"); // the biggest mover comes first
    expect(rows[0]!.delta).toBeLessThan(0);
  });

  it("refuses an invalid draft instead of simulating something else", () => {
    const bad = createDraft("bad", [{ path: "characters/hydra/displayName", value: 1 }]);
    const r = simulateBalance({ draft: bad, matches: 20, seed: 1, bot: "BEGINNER" });
    expect(r.ok).toBe(false);
  });

  it("flags outliers with wide bands, and recommendations never carry a change", () => {
    expect(flagFor(OUTLIER_HIGH)).toBe("high");
    expect(flagFor(OUTLIER_LOW)).toBe("low");
    expect(flagFor(50)).toBeNull();
    const r = simulateBalance({ draft: null, matches: 40, seed: 2, bot: "BEGINNER" });
    if (!r.ok) throw new Error("failed");
    for (const f of r.findings) expect(Object.keys(f).sort()).toEqual(["severity", "text"]); // text only: nothing to apply
  });
});
