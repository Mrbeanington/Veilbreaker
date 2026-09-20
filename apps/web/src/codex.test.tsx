// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { CHARACTER_LORE, defaultEnergyRules } from "@veilbreak/content";
import { createMemoryStore } from "@veilbreak/persistence";
import { CodexScreen } from "./screens/CodexScreen";
import { ProfileProvider } from "./profile/ProfileContext";
import { SettingsProvider } from "./settings/SettingsContext";

// ADR-036: the Codex has Fighters, Rules and Statuses, and shows real lore.
afterEach(cleanup);

async function renderCodex() {
  const store = createMemoryStore();
  render(
    <SettingsProvider store={store}>
      <ProfileProvider store={store}>
        <CodexScreen />
      </ProfileProvider>
    </SettingsProvider>,
  );
}

describe("codex", () => {
  it("opens on the fighters and offers Rules and Statuses", async () => {
    await renderCodex();
    expect(screen.getByRole("tab", { name: "Fighters", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Rules" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Statuses" })).toBeInTheDocument();
  });

  it("shows the rules from the live energy config", async () => {
    await renderCodex();
    await userEvent.click(screen.getByRole("tab", { name: "Rules" }));
    const { generation, poolCap } = defaultEnergyRules;
    expect(screen.getByText(`${generation.perLivingCharacter} energy for every living fighter`)).toBeInTheDocument();
    expect(screen.getByText(String(poolCap), { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Damage language" })).toBeInTheDocument();
  });

  it("lists the public statuses and filters them", async () => {
    await renderCodex();
    await userEvent.click(screen.getByRole("tab", { name: "Statuses" }));
    const before = screen.getAllByRole("listitem").length;
    expect(before).toBeGreaterThan(20);
    await userEvent.type(screen.getByRole("searchbox"), "bleed");
    expect(screen.getAllByRole("listitem").length).toBeLessThan(before);
    expect(screen.getByText("Bleed")).toBeInTheDocument();
  });

  it("has lore text to show for a revealed fighter", () => {
    expect(CHARACTER_LORE["tortuga-rex"]).toMatch(/shell/i);
  });
});
