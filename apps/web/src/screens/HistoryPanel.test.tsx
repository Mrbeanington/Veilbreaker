// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createDefaultProfile, createMemoryStore, saveProfile, saveReplay, encodeReplay } from "@veilbreak/persistence";
import { SettingsProvider } from "../settings/SettingsContext";
import { ProfileScreen } from "./ProfileScreen";
import { finishMatch } from "../game/finishMatch";
import { playRealMatch } from "../game/testing";

afterEach(cleanup);

const teamA = ["tortuga-rex", "hydra", "malachar"];
const teamB = ["shiro", "koschei", "father-bell"];

async function storeWithOneMatch() {
  const store = createMemoryStore();
  const outcome = playRealMatch(teamA, teamB, 4);
  const done = finishMatch(createDefaultProfile(), { mode: "bot", teamAIds: teamA, teamBIds: teamB, seed: 4 }, outcome, 1_700_000_000_000);
  await saveProfile(store, { ...done.profile, install: { ...done.profile.install, firstLaunchHandled: true } }, { snapshot: true });
  await saveReplay(store, done.replay!);
  return { store, done, outcome };
}

describe("match history and the replay viewer", () => {
  it("lists a finished match and steps through its replay turn by turn", async () => {
    const user = userEvent.setup();
    const { store, outcome } = await storeWithOneMatch();
    render(
      <SettingsProvider store={store}>
        <ProfileScreen />
      </SettingsProvider>,
    );
    await user.click(await screen.findByRole("button", { name: "Watch replay" }));
    expect(await screen.findByText(new RegExp(`Turn 0 of ${outcome.turnLog!.length}`))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next turn" }));
    expect(screen.getByText(new RegExp(`Turn 1 of ${outcome.turnLog!.length}`))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "End" }));
    expect(screen.getByText(/wins|draw/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByText(new RegExp(`Turn 0 of`))).toBeInTheDocument();
  });

  it("opens a replay pasted as a link, and rejects a damaged one in plain words", async () => {
    const user = userEvent.setup();
    const { store, done } = await storeWithOneMatch();
    render(
      <SettingsProvider store={store}>
        <ProfileScreen />
      </SettingsProvider>,
    );
    const box = await screen.findByLabelText(/paste a replay code/i);
    fireEvent.change(box, { target: { value: "VR1.not-a-real-code" } });
    await user.click(screen.getByRole("button", { name: "Open replay" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/damaged|not a Veilbreak/i);
    const short = { ...done.replay!, turns: done.replay!.turns.slice(0, 3) };
    fireEvent.change(box, { target: { value: `https://example.test/game/#replay=${encodeReplay(short)}` } });
    await user.click(screen.getByRole("button", { name: "Open replay" }));
    await waitFor(() => expect(screen.getByText(/Turn 0 of 3/)).toBeInTheDocument());
  });
});
