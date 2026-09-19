// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createDefaultProfile, createMemoryStore, encodeTransfer, loadProfile, saveProfile, type Profile } from "@veilbreak/persistence";
import { AppShell, SECTIONS } from "./App";
import { SettingsProvider } from "./settings/SettingsContext";
import { buildIdTable } from "./game/progression";

vi.mock("./game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));
afterEach(cleanup);

/** A returning player: the install pitch has already been handled, so the app opens normally. */
async function seededStore(change: (p: Profile) => Profile = (p) => p) {
  const store = createMemoryStore();
  const base = createDefaultProfile();
  await saveProfile(store, change({ ...base, install: { ...base.install, firstLaunchHandled: true } }));
  return store;
}

async function renderApp(store?: Awaited<ReturnType<typeof seededStore>>) {
  const used = store ?? (await seededStore());
  render(
    <SettingsProvider store={used}>
      <AppShell />
    </SettingsProvider>,
  );
  return used;
}

describe("main navigation (spec/05)", () => {
  it("lists every section in spec order", async () => {
    await renderApp();
    const nav = screen.getByRole("navigation", { name: "Main" });
    const labels = within(nav).getAllByRole("button").map((b) => b.textContent?.trim());
    expect(labels).toEqual(["Play", "Characters", "Teams", "Ranked", "Codex", "Missions", "Legends", "Profile", "Settings"]);
    expect(SECTIONS).toHaveLength(9);
  });

  it("is fully operable with the keyboard alone", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.tab(); // skip link
    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Play" })).toHaveFocus();
    for (let i = 0; i < 6; i += 1) await user.tab();
    expect(screen.getByRole("button", { name: "Legends" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Legend Chamber" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Legends" })).toHaveAttribute("aria-current", "page");
  });

  it("Ranked opens the local ladder, and the Play screen has a card that goes there", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Ranked" }));
    expect(await screen.findByText(/Placement matches: 0 of 5/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play a ranked match" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Play" }));
    await user.click(screen.getByRole("button", { name: /Ranked Ladder/ }));
    expect(screen.getByRole("button", { name: "Ranked" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByText(/Placement matches: 0 of 5/)).toBeInTheDocument();
  });
});

describe("install flow (spec/06)", () => {
  it("a first launch shows the friendly install screen before anything else, and Not now is always allowed", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore(); // brand new player
    render(
      <SettingsProvider store={store}>
        <AppShell />
      </SettingsProvider>,
    );
    expect(await screen.findByRole("dialog", { name: /keep your progress safe/i })).toBeInTheDocument();
    expect(screen.getByText(/deleted with it|delete the app/i)).toBeInTheDocument();
    expect(screen.queryByText(/IndexedDB|JSON|PWA/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(await screen.findByRole("heading", { name: /Veilbreak/i })).toBeInTheDocument();
    await waitFor(async () => expect((await loadProfile(store)).profile.install.firstLaunchHandled).toBe(true));
  });

  it("is not shown again after it has been handled", async () => {
    await renderApp();
    expect(screen.queryByRole("dialog", { name: /keep your progress safe/i })).not.toBeInTheDocument();
  });
});

describe("secrets are hidden correctly", () => {
  it("a new player sees silhouettes, not secret or Legend names, until they are met", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Characters" }));
    const list = screen.getByRole("list", { name: "Characters" });
    expect(within(list).getByText("Tortuga Rex")).toBeInTheDocument();
    expect(within(list).queryByText(/Koschei/)).not.toBeInTheDocument();
    expect(within(list).queryByText(/Zeiron/)).not.toBeInTheDocument();
    expect(within(list).getAllByText("Unknown fighter").length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText("Search"), "koschei");
    expect(within(screen.getByRole("list", { name: "Characters" })).queryByText(/Koschei/)).not.toBeInTheDocument();
  });

  it("the Codex reveals an entry once the profile records meeting the fighter", async () => {
    const user = userEvent.setup();
    const store = await seededStore((p) => ({ ...p, discovered: { ...p.discovered, characters: ["koschei"] } }));
    await renderApp(store);
    await user.click(screen.getByRole("button", { name: "Codex" }));
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Characters" })).getByText(/Koschei/)).toBeInTheDocument());
    expect(within(screen.getByRole("list", { name: "Characters" })).queryByText(/Zeiron/)).not.toBeInTheDocument();
  });

  it("the Codex hides an undiscovered passive behind a hint", async () => {
    const user = userEvent.setup();
    const store = await seededStore((p) => ({ ...p, discovered: { ...p.discovered, characters: ["koschei"] } }));
    await renderApp(store);
    await user.click(screen.getByRole("button", { name: "Codex" }));
    await user.click(await screen.findByRole("button", { name: /Koschei/ }));
    expect(screen.getByText(/A hidden trait/)).toBeInTheDocument();
  });

  it("secret achievements stay cryptic until earned", async () => {
    const user = userEvent.setup();
    const store = await seededStore((p) => ({ ...p, achievements: ["achievement.by-a-thread"] }));
    await renderApp(store);
    await user.click(screen.getByRole("button", { name: "Missions" }));
    await waitFor(() => expect(screen.getByText("By a thread")).toBeInTheDocument());
    expect(screen.queryByText("Clean hands")).not.toBeInTheDocument();
    expect(screen.getByText(/Victory without a single blow struck/)).toBeInTheDocument(); // the hint, not the title
  });
});

describe("Legend Chamber (spec/05)", () => {
  it("has twelve positions with The Nameless One sealed as ??? in the ultimate position", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Legends" }));
    expect(screen.getAllByRole("button", { name: /^Position \d+/ })).toHaveLength(12);
    expect(screen.getByRole("button", { name: "Position 12: ???" })).toBeInTheDocument();
    expect(screen.queryByText(/Nameless/)).not.toBeInTheDocument();
  });

  it("meeting a Legend shows its trial; winning the trial wakes its position", async () => {
    const user = userEvent.setup();
    const met = await seededStore((p) => ({ ...p, discovered: { ...p.discovered, characters: ["zeiron"] } }));
    await renderApp(met);
    await user.click(screen.getByRole("button", { name: "Legends" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Position 1: Zeiron.*trial awaits/ })).toBeInTheDocument());
    expect(screen.getByText(/0 of 12 Legends awake/)).toBeInTheDocument();
    cleanup();

    const won = await seededStore((p) => ({ ...p, discovered: { ...p.discovered, characters: ["zeiron"] }, unlocks: { legends: ["zeiron"], namelessBossDefeated: false } }));
    await renderApp(won);
    await user.click(screen.getByRole("button", { name: "Legends" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Position 1: Zeiron[^(]*$/ })).toBeInTheDocument());
    expect(screen.getByText(/1 of 12 Legends awake/)).toBeInTheDocument();
  });

  it("a met Legend cannot be picked for a team until its trial is won", async () => {
    const user = userEvent.setup();
    const store = await seededStore((p) => ({ ...p, discovered: { ...p.discovered, characters: ["zeiron", "shiro"] }, unlocks: { legends: ["shiro"], namelessBossDefeated: false } }));
    await renderApp(store);
    await user.click(screen.getByRole("button", { name: "Play" }));
    await user.click(await screen.findByRole("button", { name: /Vs\. AI/ }));
    expect(await screen.findByRole("button", { name: /^Shiro/ })).toBeEnabled(); // unlocked: pickable
    expect(screen.queryByRole("button", { name: /Zeiron/ })).not.toBeInTheDocument(); // met but locked: not a button
    expect(screen.getByText(/Win its trial to unlock/)).toBeInTheDocument();
  });

  it("the Nameless One's boss encounter stays sealed in the trials list", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Play" }));
    await user.click(await screen.findByRole("button", { name: /Legend Trials/ }));
    expect(await screen.findByText(/Sealed until every other Legend is unlocked/)).toBeInTheDocument();
    expect(screen.queryByText(/Nameless/)).not.toBeInTheDocument();
  });
});

describe("settings persist to the local profile", () => {
  it("saves accessibility settings and applies them to the page", async () => {
    const user = userEvent.setup();
    const store = await renderApp();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.selectOptions(screen.getByLabelText("Interface size"), "large");
    await user.click(screen.getByLabelText("High contrast"));
    await waitFor(async () => {
      const saved = (await loadProfile(store)).profile;
      expect(saved.settings.uiScale).toBe("large");
      expect(saved.settings.highContrast).toBe(true);
    });
    expect(document.documentElement.style.fontSize).toBe("118%");
    expect(document.documentElement.dataset.contrast).toBe("high");
  });

  it("lists the full accessibility set and keeps sound off by default", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    for (const label of ["Interface size", "High contrast", "Animation speed", "Reduced motion", "Sound effects", "Turn timer", "Bot skill"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Sound effects")).not.toBeChecked();
  });
});

describe("install stays reachable after choosing Not now", () => {
  it("Settings has an Install section with the protection status and the delete-the-app warning", async () => {
    const user = userEvent.setup();
    await renderApp(); // install pitch already handled ("Not now")
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText("Install the game", { selector: ".section-title" })).toBeInTheDocument();
    expect(screen.getByText(/Progress protection:/)).toBeInTheDocument();
    expect(screen.getByText(/delete the app/i)).toBeInTheDocument();
    // jsdom has no install prompt, so the panel explains where to find it instead of showing a dead button.
    expect(screen.getByText(/has not offered an install button/i)).toBeInTheDocument();
  });
});

describe("favorites", () => {
  it("toggle from the roster and persist", async () => {
    const user = userEvent.setup();
    const store = await renderApp();
    await user.click(screen.getByRole("button", { name: "Characters" }));
    await user.click(await screen.findByRole("button", { name: /Add to favorites/ }));
    await waitFor(async () => expect((await loadProfile(store)).profile.favorites).toHaveLength(1));
  });
});

describe("progress survives a reload", () => {
  it("what one session saves, the next session shows", async () => {
    const user = userEvent.setup();
    const store = await seededStore((p) => ({ ...p, xp: 350, matchesPlayed: 4, unlocks: { legends: ["shiro"], namelessBossDefeated: false } }));
    await renderApp(store);
    await user.click(screen.getByRole("button", { name: "Profile" }));
    expect(await screen.findByText("Level 3", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/1 Legend · 4 matches/)).toBeInTheDocument();
    cleanup(); // "close the tab"
    await renderApp(store); // reopen against the same saved data
    await user.click(screen.getByRole("button", { name: "Profile" }));
    expect(await screen.findByText("Level 3", { selector: "strong" })).toBeInTheDocument();
  });

  it("an automatic backup restores a damaged save without the player doing anything", async () => {
    const store = await seededStore((p) => ({ ...p, xp: 250 }));
    await saveProfile(store, { ...(await loadProfile(store)).profile, xp: 900 }, { snapshot: true });
    const damaged = (await store.get("save")) as { data: { xp: number } };
    damaged.data.xp = 1; // checksum now wrong
    await store.set("save", damaged);
    const user = userEvent.setup();
    await renderApp(store);
    await user.click(screen.getByRole("button", { name: "Profile" }));
    expect(await screen.findByText(/restored an automatic backup/i)).toBeInTheDocument();
    expect(screen.getByText("Level 2", { selector: "strong" })).toBeInTheDocument(); // 250 xp from the backup
  });
});

describe("device transfer between two devices", () => {
  it("a code made on device A is confirmed and applied on device B, keeping B's old save as a backup", async () => {
    const user = userEvent.setup();
    const deviceA: Profile = { ...createDefaultProfile(), install: { firstLaunchHandled: true, installed: false, asks: 0 }, xp: 620, matchesPlayed: 12, lastPlayedAt: 1_700_000_000_000, unlocks: { legends: ["zeiron", "shiro"], namelessBossDefeated: false }, achievements: ["achievement.by-a-thread"] };
    const code = encodeTransfer(deviceA, buildIdTable());

    const storeB = await seededStore((p) => ({ ...p, xp: 30, matchesPlayed: 1 }));
    await renderApp(storeB);
    await user.click(screen.getByRole("button", { name: "Profile" }));
    // Set the value directly: clipboard emulation differs between environments.
    fireEvent.change(await screen.findByLabelText("Paste a code or link"), { target: { value: `https://example.test/game/#transfer=${code}` } });
    await user.click(screen.getByRole("button", { name: "Check code" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/Level 4 · 2 Legends · 12 matches/)).toBeInTheDocument(); // incoming
    expect(within(dialog).getByText(/Level 1 · 0 Legends · 1 match/)).toBeInTheDocument(); // on this device
    await user.click(within(dialog).getByRole("button", { name: "Replace my progress" }));

    await waitFor(async () => {
      const after = (await loadProfile(storeB)).profile;
      expect(after.xp).toBe(620);
      expect(after.unlocks.legends).toEqual(["zeiron", "shiro"]);
      expect(after.achievements).toEqual(["achievement.by-a-thread"]);
    });
    const backup = (await storeB.get("backup.1")) as { data: { xp: number } };
    expect(backup.data.xp).toBe(30); // the replaced save is kept
  });

  it("a damaged code is rejected in plain words and changes nothing", async () => {
    const user = userEvent.setup();
    const store = await renderApp();
    await user.click(screen.getByRole("button", { name: "Profile" }));
    fireEvent.change(await screen.findByLabelText("Paste a code or link"), { target: { value: "VB1.definitely-not-valid" } });
    await user.click(screen.getByRole("button", { name: "Check code" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/damaged|not a Veilbreak code/i);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect((await loadProfile(store)).profile.xp).toBe(0);
  });

  it("the sender shows a QR code, a text code and a link", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Profile" }));
    await user.click(await screen.findByRole("button", { name: "Transfer to another device" }));
    expect(screen.getByRole("img", { name: /QR code/ })).toBeInTheDocument();
    expect((screen.getByLabelText("Code") as HTMLTextAreaElement).value).toMatch(/^VB1\./);
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });
});
