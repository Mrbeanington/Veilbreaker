// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createDefaultProfile, createMemoryStore, saveProfile, saveReplay } from "@veilbreak/persistence";
import { SettingsProvider } from "../settings/SettingsContext";
import { finishMatch } from "../game/finishMatch";
import { playRealMatch } from "../game/testing";
import { StatsPanel } from "./StatsPanel";

afterEach(cleanup);

async function mount(fill: boolean) {
  const store = createMemoryStore();
  let profile = createDefaultProfile();
  if (fill) {
    const team = ["tortuga-rex", "hydra", "plague-doctor"];
    const foe = ["koschei", "baba-yaga", "the-referee"];
    for (const seed of [1, 2, 3]) {
      const done = finishMatch(profile, { mode: "bot", teamAIds: team, teamBIds: foe, seed }, playRealMatch(team, foe, seed), seed);
      profile = done.profile;
      await saveReplay(store, done.replay!);
    }
  }
  await saveProfile(store, { ...profile, install: { ...profile.install, firstLaunchHandled: true } });
  render(
    <SettingsProvider store={store}>
      <StatsPanel />
    </SettingsProvider>,
  );
}

describe("Your stats", () => {
  it("invites a new player to play, and says nothing leaves the device", async () => {
    await mount(false);
    expect(await screen.findByText(/Play a match against a bot or a friend/)).toBeInTheDocument();
    expect(screen.getByText(/nothing is sent anywhere/)).toBeInTheDocument();
  });

  it("shows win rates by fighter, team and opponent, and favourite abilities from saved replays", async () => {
    await mount(true);
    expect(await screen.findByText(/Last 3 matches:/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Best and most used fighters" })).toBeInTheDocument();
    expect(screen.getByText(/^Tortuga Rex: \d of 3 won/)).toBeInTheDocument();
    expect(screen.getAllByText(/^[^:,]+, [^:,]+, [^:,]+: \d of 3 won/)).toHaveLength(1); // the one team, three fighters
    expect(screen.getByText(/^Koschei[^:]*: \d of 3 won/)).toBeInTheDocument();
    expect((await screen.findAllByText(/used \d+ times?/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/newest 3 saved replays/)).toBeInTheDocument();
  });
});
