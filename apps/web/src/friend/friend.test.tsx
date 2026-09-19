// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createRandom, decideActions } from "@veilbreak/ai";
import { createDefaultProfile, createMemoryStore, saveProfile, type KeyValueStore } from "@veilbreak/persistence";
import { chooseActions, createHost, joinFromInvite, outgoingCode, receive, statusOf, stateHash, type Session } from "@veilbreak/protocol";
import { SettingsProvider } from "../settings/SettingsContext";
import { runReplay } from "../game/replay";
import { finishMatch } from "../game/finishMatch";
import { FriendScreen } from "./FriendScreen";
import { friendHistoryId, friendRules, listSessions, outcomeFromSession, peekInvite } from "./friend";

vi.mock("../game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));
afterEach(cleanup);

const rules = friendRules();
const seeded = (seed: number) => {
  const next = createRandom(seed);
  return (n: number) => Uint8Array.from({ length: n }, () => Math.floor(next() * 256));
};
const must = <T,>(r: { ok: true; session: T } | { ok: false; problem: { detail: string } }): T => {
  if (!r.ok) throw new Error(r.problem.detail);
  return r.session;
};
const actionsFor = (s: Session, seed: number) =>
  decideActions("INTERMEDIATE", s.state!, s.role, { deps: rules.deps, random: createRandom(seed) }).map((a) => ({ characterId: a.characterId, abilityId: a.abilityId, targetIds: a.targetIds }));

/** Locks in the bot's plan; if the canonical payment order cannot afford all of it, drops the last action until it can. */
async function lockIn(s: Session, seed: number, secret: number): Promise<Session> {
  const plan = actionsFor(s, seed).sort((a, b) => a.characterId.localeCompare(b.characterId));
  for (let n = plan.length; n >= 0; n -= 1) {
    const r = await chooseActions(s, plan.slice(0, n), rules, seeded(secret));
    if (r.ok) return r.session;
  }
  throw new Error("no affordable plan");
}

async function playToTheEnd() {
  const h0 = must(await createHost(rules, { team: ["tortuga-rex", "hydra", "malachar"], unlockRule: "all" }, seeded(1)));
  const g0 = must(await joinFromInvite(rules, outgoingCode(h0), ["shiro", "koschei", "father-bell"], seeded(2)));
  let host = must(await receive(h0, outgoingCode(g0), rules));
  let guest = must(await receive(g0, outgoingCode(host), rules));
  for (let i = 0; i < 300 && !(host.phase === "over" && guest.phase === "over"); i += 1) {
    if (statusOf(host) === "your-move") host = await lockIn(host, i + 1, 100 + i);
    if (statusOf(guest) === "your-move") guest = await lockIn(guest, i + 500, 900 + i);
    guest = must(await receive(guest, outgoingCode(host), rules));
    host = must(await receive(host, outgoingCode(guest), rules));
  }
  return { host, guest };
}

describe("a finished friend match becomes an ordinary match in the profile", () => {
  it("records xp, history and a replay that reproduces the exact result (salted RNG included)", async () => {
    const { host, guest } = await playToTheEnd();
    expect(host.phase).toBe("over");
    const outcome = outcomeFromSession(host)!;
    expect(outcome.turnLog?.every((t) => typeof t.rng === "string")).toBe(true);

    const done = finishMatch(
      createDefaultProfile(),
      { mode: "friend", humanSide: "A", replayId: friendHistoryId(host.matchId), teamAIds: host.myTeam, teamBIds: host.theirTeam!, seed: host.seed! },
      outcome,
      1_700_000_000_000,
    );
    expect(done.profile.matchesPlayed).toBe(1);
    expect(done.profile.history[0]).toMatchObject({ id: friendHistoryId(host.matchId), mode: "friend" });
    expect(done.profile.played["tortuga-rex"]).toBe(1);
    expect(done.profile.played.shiro).toBeUndefined(); // only the side this device played counts
    expect(done.replay?.mode).toBe("friend");

    // Replaying the saved record re-runs the engine, mixed RNG states and all.
    const run = runReplay(done.replay!);
    expect(run.ok).toBe(true);
    if (run.ok) {
      expect(await stateHash(run.frames[run.frames.length - 1]!.state)).toBe(await stateHash(host.state!));
      expect(await stateHash(run.frames[run.frames.length - 1]!.state)).toBe(await stateHash(guest.state!));
    }
  });

  it("the guest's device records the same match from the other side", async () => {
    const { guest } = await playToTheEnd();
    const outcome = outcomeFromSession(guest)!;
    const done = finishMatch(createDefaultProfile(), { mode: "friend", humanSide: "B", replayId: "x", teamAIds: guest.theirTeam!, teamBIds: guest.myTeam, seed: guest.seed! }, outcome, 1);
    expect(done.profile.played.shiro).toBe(1);
    expect(done.profile.played["tortuga-rex"]).toBeUndefined();
  });
});

async function seededStore(): Promise<KeyValueStore> {
  const store = createMemoryStore();
  const p = createDefaultProfile();
  await saveProfile(store, { ...p, install: { ...p.install, firstLaunchHandled: true } });
  return store;
}

function mount(store: KeyValueStore, initialCode?: string) {
  render(
    <SettingsProvider store={store}>
      <FriendScreen onBack={() => {}} initialCode={initialCode} />
    </SettingsProvider>,
  );
}

describe("Friend Match screens", () => {
  it("host creates an invite, guest joins from the pasted code, and the host applies the reply (across page reloads)", async () => {
    const user = userEvent.setup();
    const hostStore = await seededStore();
    const guestStore = await seededStore();

    // --- host creates the match
    mount(hostStore);
    await user.click(await screen.findByRole("button", { name: /Start a match/ }));
    for (const name of [/^Tortuga Rex/, /^Hydra/, /^The Plague Doctor/]) await user.click(await screen.findByRole("button", { name: name }));
    await user.click(screen.getByRole("button", { name: "Create invite" }));
    const invite = ((await screen.findByLabelText("Your code")) as HTMLTextAreaElement).value;
    expect(invite).toMatch(/^VM1\./);
    expect(screen.getAllByText(/locked in secretly/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/waiting for your friend to join/i)).toBeInTheDocument();
    cleanup();

    // --- guest joins in their own browser
    mount(guestStore);
    await user.click(await screen.findByRole("button", { name: /Join with a code/ }));
    fireEvent.change(await screen.findByLabelText(/Invite code or link/), { target: { value: `https://example.test/game/#match=${invite}` } });
    expect(await screen.findByText(/Host.s team:/)).toBeInTheDocument();
    expect(screen.getByText(/Everything unlocked/)).toBeInTheDocument();
    for (const name of [/^Baba Yaga/, /^Mister Whiskers/, /^Patient Zero/]) await user.click(await screen.findByRole("button", { name }));
    await user.click(screen.getByRole("button", { name: "Join match" }));
    const reply = ((await screen.findByLabelText("Your code")) as HTMLTextAreaElement).value;
    expect(reply).toMatch(/^VM1\./);
    expect(reply).not.toBe(invite);
    expect(await listSessions(guestStore)).toHaveLength(1);
    cleanup();

    // --- host closes the page, comes back later, and opens the saved match
    mount(hostStore);
    await user.click(await screen.findByRole("button", { name: "Open" }));
    fireEvent.change(await screen.findByLabelText(/Paste the code or link your friend sent back/), { target: { value: reply } });
    await user.click(screen.getByRole("button", { name: "Check and apply" }));
    expect(await screen.findByText(/Your move\./)).toBeInTheDocument();
    expect(screen.getByText(/Verified|Waiting for the first check/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resign/ })).toBeInTheDocument();
  });

  it("a garbage reply is refused in plain words and changes nothing", async () => {
    const user = userEvent.setup();
    const store = await seededStore();
    const host = must(await createHost(rules, { team: ["tortuga-rex", "hydra", "malachar"], unlockRule: "all" }, seeded(1)));
    await store.set(`friend.${host.matchId}`, host);
    mount(store);
    await user.click(await screen.findByRole("button", { name: "Open" }));
    fireEvent.change(await screen.findByLabelText(/Paste the code or link your friend sent back/), { target: { value: "VM1.this-is-not-a-real-code" } });
    await user.click(screen.getByRole("button", { name: "Check and apply" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/damaged|not a Veilbreak|too long|code/i);
    expect(screen.getByText(/waiting for your friend to join/i)).toBeInTheDocument();
  });

  it("opening a #match link for a new match goes straight to joining, with the code filled in", async () => {
    const host = must(await createHost(rules, { team: ["tortuga-rex", "hydra", "malachar"], unlockRule: "own" }, seeded(3)));
    const code = outgoingCode(host);
    expect(peekInvite(code)).toMatchObject({ unlockRule: "own", hostTeam: ["tortuga-rex", "hydra", "malachar"] });
    mount(await seededStore(), code);
    expect(await screen.findByText(/Host.s team:/)).toBeInTheDocument();
    expect(screen.getByText(/honor system/i)).toBeInTheDocument(); // the own-unlocks rule is labelled as honor-based
  });

  it("a fatal problem stops the match and says why", async () => {
    const store = await seededStore();
    const host = must(await createHost(rules, { team: ["tortuga-rex", "hydra", "malachar"], unlockRule: "all" }, seeded(1)));
    const failed: Session = { ...host, phase: "failed", problem: { code: "desync", detail: "The game states no longer match after turn 2.", fatal: true } };
    await store.set(`friend.${host.matchId}`, failed);
    mount(store);
    fireEvent.click(await screen.findByRole("button", { name: "Open" }));
    expect(await screen.findByText(/This match was stopped/)).toBeInTheDocument();
    expect(screen.getByText(/Desync detected/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText(/Paste the code or link/)).not.toBeInTheDocument());
  });
});
