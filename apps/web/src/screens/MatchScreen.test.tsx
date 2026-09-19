// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { EnergyRules } from "@veilbreak/content";
import { MatchScreen } from "./MatchScreen";
import { SettingsProvider } from "../settings/SettingsContext";

// jsdom doesn't implement Web Workers at all — none of these tests exercise
// "vs. bot" mode, which is the only path that ever calls requestBotActions,
// so a no-op stub is enough (see apps/web/src/game/useBotWorker.ts).
vi.mock("../game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));

// vitest.config.ts doesn't set `test.globals: true` (root config, shared
// with every non-DOM package), so @testing-library/react's usual automatic
// afterEach(cleanup) never registers — done explicitly here instead.
afterEach(cleanup);

// A generous, non-random energy setup so an ability's affordability never
// depends on the same RNG draw the real match uses (packages/engine/src/
// energy.test.ts and resolver.test.ts use this exact pattern for the same
// reason).
const GENEROUS_ENERGY: EnergyRules = {
  generation: { perLivingCharacter: 10, mode: "fixed" },
  poolCap: 40,
  carryover: true,
  initiativePlayerSkipsTurnOneGeneration: false,
};

function renderMatch() {
  return render(
    <SettingsProvider>
      <MatchScreen
        mode="hotseat"
        teamAIds={["tortuga-rex", "moonshot-maddox", "mister-whiskers"]}
        teamBIds={["patient-zero", "malachar", "tortuga-rex"]}
        seed={1}
        energyRules={GENEROUS_ENERGY}
        onMatchOver={() => {}}
      />
    </SettingsProvider>,
  );
}

describe("MatchScreen — action selection (phase-05-local-playable.md)", () => {
  it("starts on a pass-device screen that hides the board until Player 1 is ready", () => {
    renderMatch();
    expect(screen.getByRole("heading", { name: /Pass the device to Player 1/i })).toBeInTheDocument();
    expect(screen.queryByText(/Shell Bash/i)).not.toBeInTheDocument();
  });

  it("queues an ability + target action for the acting character, shown in the queued-actions panel", async () => {
    const user = userEvent.setup();
    renderMatch();

    await user.click(screen.getByRole("button", { name: /I'm Player 1 — Ready/i }));

    // Tortuga Rex is teamAIds[0] and should be the character currently acting.
    await user.click(screen.getByRole("button", { name: /Shell Bash/i }));
    expect(screen.getByText(/Choose a target for Shell Bash/i)).toBeInTheDocument();

    // Only one "Patient Zero" exists across both teams, so this is unambiguous.
    await user.click(screen.getByRole("button", { name: /Patient Zero/i }));

    expect(screen.getByText(/Tortuga Rex: Shell Bash → Patient Zero/i)).toBeInTheDocument();
  });

  it("moves on to the next character once an action is queued", async () => {
    const user = userEvent.setup();
    renderMatch();
    await user.click(screen.getByRole("button", { name: /I'm Player 1 — Ready/i }));
    await user.click(screen.getByRole("button", { name: /Shell Bash/i }));
    await user.click(screen.getByRole("button", { name: /Patient Zero/i }));

    // Moonshot Maddox (teamAIds[1]) should now be the acting character.
    expect(screen.getByText(/Mason "Moonshot" Maddox's action/i)).toBeInTheDocument();
  });
});

describe("MatchScreen — validation feedback (phase-05-local-playable.md)", () => {
  it("shows a real engine validation error when an illegal target is picked", async () => {
    const user = userEvent.setup();
    renderMatch();
    await user.click(screen.getByRole("button", { name: /I'm Player 1 — Ready/i }));

    // Shell Bash only legally targets an enemy — clicking an ally (Moonshot,
    // on Tortuga's own team) must be rejected by the real validateAction,
    // not silently accepted by the UI.
    await user.click(screen.getByRole("button", { name: /Shell Bash/i }));
    await user.click(screen.getByRole("button", { name: /Mason "Moonshot" Maddox/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Invalid target/i);
    // The action must not have been queued.
    expect(screen.queryByText(/Tortuga Rex: Shell Bash →/i)).not.toBeInTheDocument();
  });

  it("disables an ability the character cannot afford, with no energy generated", async () => {
    // Affordability math itself is exercised at the engine level
    // (packages/engine/src/energy.test.ts) — this only checks the UI reflects
    // whatever the engine says is affordable, never recomputing it itself.
    const zeroEnergy: EnergyRules = {
      generation: { perLivingCharacter: 0, mode: "fixed" },
      poolCap: 10,
      carryover: true,
      initiativePlayerSkipsTurnOneGeneration: false,
    };
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <MatchScreen
          mode="hotseat"
          teamAIds={["tortuga-rex", "moonshot-maddox", "mister-whiskers"]}
          teamBIds={["patient-zero", "malachar", "tortuga-rex"]}
          seed={1}
          energyRules={zeroEnergy}
          onMatchOver={() => {}}
        />
      </SettingsProvider>,
    );
    await user.click(screen.getByRole("button", { name: /I'm Player 1 — Ready/i }));
    expect(screen.getByRole("button", { name: /Shell Bash/i })).toBeDisabled();
  });

  it("lets a character with no affordable action pass, so the turn can still be confirmed", async () => {
    // Regression test: with zero energy every ability is disabled, so
    // without an explicit "pass" the Confirm button could never enable —
    // a character always needing a queued action would make the turn
    // permanently unconfirmable.
    const zeroEnergy: EnergyRules = {
      generation: { perLivingCharacter: 0, mode: "fixed" },
      poolCap: 10,
      carryover: true,
      initiativePlayerSkipsTurnOneGeneration: false,
    };
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <MatchScreen
          mode="hotseat"
          teamAIds={["tortuga-rex", "moonshot-maddox", "mister-whiskers"]}
          teamBIds={["patient-zero", "malachar", "tortuga-rex"]}
          seed={1}
          energyRules={zeroEnergy}
          onMatchOver={() => {}}
        />
      </SettingsProvider>,
    );
    await user.click(screen.getByRole("button", { name: /I'm Player 1 — Ready/i }));
    expect(screen.getByRole("button", { name: /Confirm turn/i })).toBeDisabled();

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /Pass \(no affordable action\)/i }));
    }
    expect(screen.getByRole("button", { name: /Confirm turn/i })).toBeEnabled();
  });
});

describe("MatchScreen — turn timer (spec/05, spec/06 OQ-08)", () => {
  it("auto-confirms whatever is queued once the countdown reaches zero", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ delay: null });
      renderMatch();
      await user.click(screen.getByRole("button", { name: /I'm Player 1 — Ready/i }));
      expect(screen.getByText(/⏱/)).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(60_000);

      // Player A's turn timer expiring hands off to the pass-device screen
      // for Player 2, exactly as pressing Confirm would.
      expect(screen.getByRole("heading", { name: /Pass the device to Player 2/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
