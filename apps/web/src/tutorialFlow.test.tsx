// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createDefaultProfile, createMemoryStore, loadProfile, saveProfile, type Profile } from "@veilbreak/persistence";
import { AppShell } from "./App";
import { SettingsProvider } from "./settings/SettingsContext";

vi.mock("./game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));
afterEach(cleanup);

async function renderApp(profile: Profile) {
  const store = createMemoryStore();
  await saveProfile(store, { ...profile, install: { ...profile.install, firstLaunchHandled: true } });
  render(
    <SettingsProvider store={store}>
      <AppShell />
    </SettingsProvider>,
  );
  return store;
}

describe("first-run tutorial", () => {
  it("is offered to a brand-new player, and not to someone who has been playing", async () => {
    await renderApp(createDefaultProfile());
    expect(await screen.findByRole("region", { name: "New here?" })).toBeInTheDocument();
    cleanup();
    await renderApp({ ...createDefaultProfile(), tutorial: { status: "done" } });
    await screen.findByRole("button", { name: /Vs\. AI/ });
    expect(screen.queryByRole("region", { name: "New here?" })).toBeNull();
    // It is always available under How to play.
    expect(screen.getByRole("button", { name: /How to play/ })).toBeInTheDocument();
  });

  it("starts a guided match with a coach tip and no turn timer", async () => {
    const user = userEvent.setup();
    await renderApp(createDefaultProfile());
    await user.click(await screen.findByRole("button", { name: "Start the tutorial" }));
    const coach = await screen.findByRole("complementary", { name: "Tutorial tip" });
    expect(coach).toHaveTextContent("Choose an ability");
    expect(screen.getAllByText(/Tortuga Rex/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/seconds/i)).toBeNull();
  });

  it("can be skipped, and the offer does not come back", async () => {
    const user = userEvent.setup();
    const store = await renderApp(createDefaultProfile());
    await user.click(await screen.findByRole("button", { name: "I know how to play" }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "New here?" })).toBeNull());
    await waitFor(async () => expect((await loadProfile(store)).profile.tutorial.status).toBe("skipped"));
  });

  it("skipping from inside the tutorial match returns home and records it", async () => {
    const user = userEvent.setup();
    const store = await renderApp(createDefaultProfile());
    await user.click(await screen.findByRole("button", { name: "Start the tutorial" }));
    await user.click(await screen.findByRole("button", { name: "Skip tutorial" }));
    expect(await screen.findByRole("button", { name: /Vs\. AI/ })).toBeInTheDocument();
    await waitFor(async () => expect((await loadProfile(store)).profile.tutorial.status).toBe("skipped"));
  });
});
