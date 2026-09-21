// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import {
  PLACEMENT_MATCHES,
  createDefaultProfile,
  createMemoryStore,
  createRanked,
  divisionIndexFor,
  loadProfile,
  saveProfile,
  seasonIdFor,
  type Profile,
  type RankedState,
} from "@veilbreak/persistence";
import { SettingsProvider } from "../settings/SettingsContext";
import { RankedScreen } from "./RankedScreen";

vi.mock("../game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const now = () => Date.now();
const placedAt = (rating: number, extra: Partial<RankedState> = {}): RankedState => ({
  ...createRanked(),
  season: seasonIdFor(now()),
  rating,
  division: divisionIndexFor(rating),
  placements: PLACEMENT_MATCHES,
  peakRating: rating,
  ...extra,
});

async function mount(ranked: RankedState | undefined, tweak: (p: Profile) => Profile = (p) => p) {
  const store = createMemoryStore();
  const base = createDefaultProfile();
  // Ranked opens at level 3 (ADR-044); these tests are about the ladder, so they start at 300 xp.
  await saveProfile(store, tweak({ ...base, xp: 300, install: { ...base.install, firstLaunchHandled: true }, ranked: ranked ?? base.ranked }));
  render(
    <SettingsProvider store={store}>
      <RankedScreen />
    </SettingsProvider>,
  );
  return store;
}

const savedRanked = async (store: Awaited<ReturnType<typeof mount>>) => (await loadProfile(store)).profile.ranked;

describe("Ranked home", () => {
  it("starts unranked, counting placement matches, with no division and no rating shown", async () => {
    await mount(undefined);
    const badge = await screen.findByTestId("division");
    expect(within(badge).getByText("Unranked")).toBeInTheDocument();
    expect(within(badge).getByText(/Placement matches: 0 of 5/)).toBeInTheDocument();
    expect(screen.queryByText(/rating/i)).not.toBeInTheDocument(); // the rating stays hidden
    expect(screen.getByRole("button", { name: "Play a ranked match" })).toBeInTheDocument();
    expect(screen.getByText(/Play a ranked match to start your records/)).toBeInTheDocument();
  });

  it("shows the division and a coarse standing once placed", async () => {
    await mount(placedAt(580));
    expect(within(await screen.findByTestId("division")).getByText("Silver I")).toBeInTheDocument();
    expect(screen.getByText(/Close to a promotion/)).toBeInTheDocument();
  });

  it("shows record, streak, personal bests, usage, best seasons and recent matches", async () => {
    let r = placedAt(700, { wins: 6, losses: 2, draws: 1, streak: 3, bestStreak: 4 });
    r = {
      ...r,
      bests: { rating: 720, division: 6, winStreak: 4, fastestWinTurns: 7, seasonWins: 6, matches: 9 },
      usage: { hydra: { played: 8, won: 5 }, shiro: { played: 3, won: 1 } },
      recent: [{ id: "r1", at: now(), result: "loss", delta: -12, division: 6, botLevel: "ADVANCED", team: ["hydra", "shiro", "koschei"], foe: ["malachar", "behemoth", "zeiron"], turns: 0, forfeit: true }],
      pastSeasons: [{ season: "2026-01", placed: true, division: 8, peakDivision: 9, peakRating: 950, wins: 14, losses: 6, draws: 0, bestStreak: 5 }],
    };
    await mount(r);
    expect(await screen.findByText(/6 won · 2 lost · 1 drawn/)).toBeInTheDocument();
    expect(screen.getByText(/3 wins in a row/)).toBeInTheDocument();
    expect(screen.getByText(/Highest division: Gold III/)).toBeInTheDocument();
    expect(screen.getByText(/Longest win streak: 4/)).toBeInTheDocument();
    expect(screen.getByText(/Fastest win: 7 turns/)).toBeInTheDocument();
    expect(screen.getByText(/Hydra: 8 played, 5 won \(63%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Loss \(left early\)/)).toBeInTheDocument();
    const seasons = screen.getByText("Your best seasons").parentElement!;
    expect(within(seasons).getByText(/January 2026: Platinum III · 14-6/)).toBeInTheDocument();
  });

  it("a match left unfinished is settled as a loss when the ladder is opened, once", async () => {
    const pending = { id: "p-x", at: now(), opponentRating: 700, botLevel: "ADVANCED", team: ["hydra", "shiro", "koschei"], foe: ["malachar", "behemoth", "zeiron"] };
    const store = await mount(placedAt(700, { pending }));
    expect(await screen.findByText(/left unfinished, so it counted as a loss/i)).toBeInTheDocument();
    await waitFor(async () => {
      const saved = await savedRanked(store);
      expect(saved.pending).toBeNull();
      expect(saved.losses).toBe(1);
      expect(saved.recent[0]).toMatchObject({ result: "loss", forfeit: true });
    });
    expect(screen.getByText(/0 won · 1 lost/)).toBeInTheDocument();
  });

  it("a new calendar month archives the last season and starts a fresh one", async () => {
    const store = await mount(placedAt(900, { season: "2001-01", wins: 10, losses: 4, placements: 14, peakRating: 950 }));
    expect(await screen.findByText(/A new season has begun/)).toBeInTheDocument();
    await waitFor(async () => {
      const saved = await savedRanked(store);
      expect(saved.season).toBe(seasonIdFor(now()));
      expect(saved.pastSeasons[0]).toMatchObject({ season: "2001-01", wins: 10, losses: 4 });
      expect(saved.rating).toBe(650); // half of the way back to 400
      expect(saved.placements).toBe(0);
    });
    expect(await screen.findByText(/Placement matches: 0 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/January 2001: Gold I|January 2001:/)).toBeInTheDocument();
  });
});

const CORE_TEAM = [/^Tortuga Rex/, /^Hydra/, /^The Plague Doctor/];

describe("playing a ranked match", () => {
  it("picks a team of three, and saves the match as pending the moment it starts", async () => {
    const user = userEvent.setup();
    const store = await mount(undefined);
    await user.click(await screen.findByRole("button", { name: "Play a ranked match" }));
    expect(await screen.findByRole("heading", { name: "Choose your team" })).toBeInTheDocument();
    expect(screen.getByText(/Intermediate bot/)).toBeInTheDocument();
    const start = screen.getByRole("button", { name: "Start ranked match" });
    expect(start).toBeDisabled();
    for (const name of CORE_TEAM) await user.click(await screen.findByRole("button", { name }));
    expect(start).toBeEnabled();
    await user.click(start);

    // The match is on screen, and leaving now would already count.
    expect(await screen.findByText(/Turn 1/)).toBeInTheDocument();
    await waitFor(async () => {
      const saved = await savedRanked(store);
      expect(saved.pending).toMatchObject({ botLevel: "INTERMEDIATE", team: expect.arrayContaining(["tortuga-rex", "hydra", "plague-doctor"]) });
      expect(saved.pending?.foe).toHaveLength(3);
    });
    expect((await savedRanked(store)).losses).toBe(0);
  });

  it("the Reveal-every-character spoiler switch does not unlock Legends for ranked", async () => {
    const user = userEvent.setup();
    await mount(undefined, (p) => ({ ...p, settings: { ...p.settings, showAllCharacters: true } }));
    await user.click(await screen.findByRole("button", { name: "Play a ranked match" }));
    await screen.findByRole("heading", { name: "Choose your team" });
    // A Legend the player has not unlocked cannot be picked (it is shown locked, not as a pick button).
    expect(screen.queryByRole("button", { name: /^Behemoth/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^The Black Knight/ })).not.toBeInTheDocument();
  });

  it("at Diamond both sides bring four: pick four, then ban one of the bot's", async () => {
    const user = userEvent.setup();
    // Baba Yaga is a discoverable fighter, so she has to have been met before she can be picked.
    const store = await mount(placedAt(1300), (p) => ({ ...p, discovered: { ...p.discovered, characters: ["baba-yaga"] }, unlocks: { ...p.unlocks, fighters: ["baba-yaga"] } }));
    await user.click(await screen.findByRole("button", { name: "Play a ranked match" }));
    expect(await screen.findByRole("heading", { name: "Choose your four" })).toBeInTheDocument();
    expect(screen.getByText(/Expert bot/)).toBeInTheDocument();
    const lockIn = screen.getByRole("button", { name: "Lock in" });
    for (const name of [...CORE_TEAM, /^Baba Yaga/]) await user.click(await screen.findByRole("button", { name }));
    expect(lockIn).toBeEnabled();
    await user.click(lockIn);

    expect(await screen.findByRole("heading", { name: "Pick and ban" })).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Confirm ban and start" });
    expect(confirm).toBeDisabled();
    const bans = screen.getAllByRole("listitem");
    expect(bans).toHaveLength(4);
    await user.click(bans[0]!);
    await user.click(confirm);

    expect(await screen.findByText(/Bans: you removed/)).toBeInTheDocument();
    await waitFor(async () => {
      const pending = (await savedRanked(store)).pending;
      expect(pending?.team).toHaveLength(3);
      expect(pending?.foe).toHaveLength(3);
    });
  });
});
