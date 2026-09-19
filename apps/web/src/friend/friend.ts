import { CHARACTER_LIBRARY, PLAYABLE_CHARACTERS, defaultMatchFormat } from "@veilbreak/content";
import type { KeyValueStore } from "@veilbreak/persistence";
import { decodeBundle, replaySource, type RuleSet, type Session } from "@veilbreak/protocol";
import { BALANCE_VERSION_ID, matchDeps } from "../game/setup";
import type { MatchOutcome } from "../screens/MatchScreen";

// Friend matches (spec/06) run on the shared protocol package. This file is the
// web side of it: the rule set both clients must agree on, saving sessions so
// a match can be continued after the tab is closed, and turning a finished
// session into what the profile and replay code already understand.

export function friendRules(): RuleSet {
  return {
    balanceVersionId: BALANCE_VERSION_ID,
    deps: matchDeps(),
    characters: CHARACTER_LIBRARY,
    matchFormat: defaultMatchFormat,
    playableIds: PLAYABLE_CHARACTERS.map((c) => c.id),
  };
}

const KEY_PREFIX = "friend.";
const keyFor = (matchId: string) => `${KEY_PREFIX}${matchId}`;
/** Keep the most recent sessions; old finished matches live on as history and replays. */
export const MAX_SAVED_FRIEND_MATCHES = 12;

export async function saveSession(store: KeyValueStore, session: Session): Promise<void> {
  await store.set(keyFor(session.matchId), session);
}

export async function loadSession(store: KeyValueStore, matchId: string): Promise<Session | null> {
  const raw = (await store.get(keyFor(matchId))) as Session | undefined;
  return raw && raw.version === 1 && raw.matchId === matchId ? raw : null;
}

export async function deleteSession(store: KeyValueStore, matchId: string): Promise<void> {
  await store.delete(keyFor(matchId));
}

export async function listSessions(store: KeyValueStore): Promise<Session[]> {
  const out: Session[] = [];
  for (const key of (await store.keys()).filter((k) => k.startsWith(KEY_PREFIX))) {
    const raw = (await store.get(key)) as Session | undefined;
    if (raw && raw.version === 1 && typeof raw.matchId === "string") out.push(raw);
  }
  return out.sort((a, b) => (b.state?.eventLog.length ?? 0) - (a.state?.eventLog.length ?? 0));
}

/** What an invite code says, without joining: shown so the guest can see the rule and the host's team before choosing. */
export function peekInvite(code: string): { matchId: string; unlockRule: "own" | "all"; hostTeam: string[] } | null {
  const decoded = decodeBundle(code);
  if (!decoded.ok) return null;
  const setup = decoded.bundle.msgs[0];
  if (decoded.bundle.from !== "playerA" || !setup || setup.type !== "setup") return null;
  return { matchId: setup.matchId, unlockRule: setup.unlockRule, hostTeam: setup.team };
}

export function peekMatchId(code: string): string | null {
  const decoded = decodeBundle(code);
  return decoded.ok ? decoded.bundle.match : null;
}

/** A finished friend match, shaped like a local one so the same profile pipeline (xp, missions, history, replay) handles it. */
export function outcomeFromSession(session: Session): MatchOutcome | null {
  const source = replaySource(session);
  if (!source || !session.state || session.phase !== "over") return null;
  const asActions = (role: "playerA" | "playerB", list: typeof source.steps[number]["a"]) => list.map((a) => ({ playerId: role, ...a }));
  const winner = session.result?.winner ?? null;
  return {
    result: winner ? "win" : "draw",
    winnerPlayerId: winner,
    eventLog: session.state.eventLog,
    turnLog: source.steps.map((s) => ({ a: asActions("playerA", s.a), b: asActions("playerB", s.b), rng: s.rng })),
    turns: source.steps.length,
    seed: source.seed,
    energyRules: session.state && matchDeps().energyRules,
    finalCharacters: Object.fromEntries(Object.entries(session.state.characters).map(([id, c]) => [id, { hp: c.currentHp, alive: c.alive }])),
  };
}

export const friendHistoryId = (matchId: string) => `friend-${matchId}`;
