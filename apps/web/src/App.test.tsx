// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createMemoryStore } from "@veilbreak/persistence";
import { AppShell, SECTIONS } from "./App";
import { SettingsProvider } from "./settings/SettingsContext";

vi.mock("./game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));
afterEach(cleanup);

function renderApp(store = createMemoryStore()) {
  render(
    <SettingsProvider store={store}>
      <AppShell />
    </SettingsProvider>,
  );
  return store;
}

describe("main navigation (spec/05)", () => {
  it("lists every section in spec order", () => {
    renderApp();
    const nav = screen.getByRole("navigation", { name: "Main" });
    const labels = within(nav).getAllByRole("button").map((b) => b.textContent?.trim());
    expect(labels).toEqual(["Play", "Characters", "Teams", "Ranked", "Codex", "Missions", "Legends", "Profile", "Settings"]);
    expect(SECTIONS).toHaveLength(9);
  });

  it("is fully operable with the keyboard alone", async () => {
    const user = userEvent.setup();
    renderApp();
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

  it("placeholder sections say plainly that they are not built yet", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Ranked" }));
    expect(screen.getByText(/not built yet/i)).toBeInTheDocument();
  });
});

describe("secrets are hidden correctly", () => {
  it("a new player sees silhouettes, not secret or Legend names, until they are met", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Characters" }));
    const list = screen.getByRole("list", { name: "Characters" });
    expect(within(list).getByText("Tortuga Rex")).toBeInTheDocument();
    expect(within(list).queryByText(/Koschei/)).not.toBeInTheDocument();
    expect(within(list).queryByText(/Zeiron/)).not.toBeInTheDocument();
    expect(within(list).getAllByText("Unknown fighter").length).toBeGreaterThan(0);
    // Searching for a secret's name finds nothing.
    await user.type(screen.getByLabelText("Search"), "koschei");
    expect(within(screen.getByRole("list", { name: "Characters" })).queryByText(/Koschei/)).not.toBeInTheDocument();
  });

  it("the Codex reveals an entry once the profile records meeting the fighter", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore({
      profile: { version: 1, discovered: { characters: ["koschei"], abilities: [], passives: [], transformations: [] } },
    });
    renderApp(store);
    await user.click(screen.getByRole("button", { name: "Codex" }));
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Characters" })).getByText(/Koschei/)).toBeInTheDocument());
    expect(within(screen.getByRole("list", { name: "Characters" })).queryByText(/Zeiron/)).not.toBeInTheDocument();
  });

  it("the Codex hides an undiscovered passive behind a hint", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore({ profile: { version: 1, discovered: { characters: ["koschei"] } } });
    renderApp(store);
    await user.click(screen.getByRole("button", { name: "Codex" }));
    await user.click(await screen.findByRole("button", { name: /Koschei/ }));
    expect(screen.getByText(/A hidden trait/)).toBeInTheDocument();
  });
});

describe("Legend Chamber (spec/05)", () => {
  it("has twelve positions with The Nameless One sealed as ??? in the ultimate position", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Legends" }));
    const slots = screen.getAllByRole("button", { name: /^Position \d+/ });
    expect(slots).toHaveLength(12);
    expect(screen.getByRole("button", { name: "Position 12: ???" })).toBeInTheDocument();
    expect(screen.queryByText(/Nameless/)).not.toBeInTheDocument();
  });

  it("evolves: a met Legend wakes its position", async () => {
    const user = userEvent.setup();
    const store = createMemoryStore({ profile: { version: 1, discovered: { characters: ["zeiron"] } } });
    renderApp(store);
    await user.click(screen.getByRole("button", { name: "Legends" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Position 1: Zeiron/ })).toBeInTheDocument());
    expect(screen.getByText(/1 of 12 Legends awake/)).toBeInTheDocument();
  });
});

describe("settings persist to the local profile", () => {
  it("saves accessibility settings and applies them to the page", async () => {
    const user = userEvent.setup();
    const store = renderApp();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.selectOptions(screen.getByLabelText("Interface size"), "large");
    await user.click(screen.getByLabelText("High contrast"));
    await waitFor(async () => {
      const saved = (await store.get("profile")) as { settings: { uiScale: string; highContrast: boolean } };
      expect(saved.settings.uiScale).toBe("large");
      expect(saved.settings.highContrast).toBe(true);
    });
    expect(document.documentElement.style.fontSize).toBe("118%");
    expect(document.documentElement.dataset.contrast).toBe("high");
  });

  it("lists the full accessibility set and keeps sound off by default", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    for (const label of ["Interface size", "High contrast", "Animation speed", "Reduced motion", "Sound effects", "Turn timer", "Bot skill"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Sound effects")).not.toBeChecked();
  });
});

describe("team presets and favorites", () => {
  it("favorites toggle from the roster and persist", async () => {
    const user = userEvent.setup();
    const store = renderApp();
    await user.click(screen.getByRole("button", { name: "Characters" }));
    await user.click(await screen.findByRole("button", { name: /Add to favorites/ }));
    await waitFor(async () => expect(((await store.get("profile")) as { favorites: string[] }).favorites).toHaveLength(1));
  });
});
