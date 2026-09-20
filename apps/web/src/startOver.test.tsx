// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createDefaultProfile, createMemoryStore, listReplays, loadProfile, saveProfile, saveReplay, type Profile } from "@veilbreak/persistence";
import { ProfileProvider } from "./profile/ProfileContext";
import { ScreenBar } from "./components/ScreenBar";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsProvider } from "./settings/SettingsContext";

afterEach(cleanup);

const played = (): Profile => ({
  ...createDefaultProfile(),
  xp: 950,
  matchesPlayed: 12,
  favorites: ["hydra"],
  unlocks: { legends: ["zeiron"], namelessBossDefeated: false },
  trialsWon: ["trial.zeiron"],
  discovered: { characters: ["koschei", "zeiron"], abilities: [], passives: [], transformations: [] },
  achievements: ["achievement.clean-hands"],
  install: { firstLaunchHandled: true, installed: false, asks: 0 },
});

async function setup() {
  const store = createMemoryStore();
  await saveProfile(store, played());
  const { sampleReplay } = await import("../../../packages/persistence/src/testing");
  await saveReplay(store, sampleReplay("r1"));
  render(
    <SettingsProvider store={store}>
      <ProfileProvider store={store}>
        <ProfileScreen />
      </ProfileProvider>
    </SettingsProvider>,
  );
  await screen.findByText("Level 4", { selector: "strong" });
  return store;
}

describe("start over", () => {
  it("resets progress but keeps unlocked fighters, after a confirmation that says what changes", async () => {
    const user = userEvent.setup();
    const store = await setup();
    await user.click(screen.getByRole("button", { name: "Reset progress, keep my fighters" }));
    expect(screen.getByRole("alertdialog", { name: "Reset your progress?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset progress" }));
    await waitFor(async () => {
      const saved = await loadProfile(store);
      expect(saved.profile.xp).toBe(0);
      expect(saved.profile.unlocks.legends).toEqual(["zeiron"]);
      expect(saved.profile.discovered.characters).toEqual(["koschei", "zeiron"]);
      expect(saved.profile.favorites).toEqual(["hydra"]);
      expect(saved.profile.achievements).toEqual([]);
    });
    expect(await listReplays(store)).toEqual([]);
    expect(await screen.findByText(/Progress reset/)).toBeInTheDocument();
  });

  it("erases everything on confirmation, and does nothing if cancelled", async () => {
    const user = userEvent.setup();
    const store = await setup();
    await user.click(screen.getByRole("button", { name: "Erase everything" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect((await loadProfile(store)).profile.xp).toBe(950);
    await user.click(screen.getByRole("button", { name: "Erase everything" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Erase everything" }));
    await waitFor(async () => {
      const saved = (await loadProfile(store)).profile;
      expect(saved.xp).toBe(0);
      expect(saved.unlocks.legends).toEqual([]);
      expect(saved.discovered.characters).toEqual([]);
      expect(saved.install.firstLaunchHandled).toBe(true);
    });
  });
});

describe("screen bar", () => {
  it("offers back and the main action together, and disables the action until it is ready", async () => {
    const user = userEvent.setup();
    let back = 0;
    let start = 0;
    const { rerender } = render(<ScreenBar onBack={() => back++} status="2 of 3 picked" action={{ label: "Start match", onClick: () => start++, disabled: true }} />);
    expect(screen.getByRole("button", { name: "Start match" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3 picked");
    await user.click(screen.getByRole("button", { name: "Back" }));
    rerender(<ScreenBar onBack={() => back++} action={{ label: "Start match", onClick: () => start++ }} />);
    await user.click(screen.getByRole("button", { name: "Start match" }));
    expect([back, start]).toEqual([1, 1]);
  });
});
