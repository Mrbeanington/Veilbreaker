import { defaultResourcesFor } from "@veilbreak/content";
import {
  createBattle,
  getEffectiveCost,
  payCost,
  resolveTurn,
  validateAction,
  type BattleState,
  type CreateBattleTeamInput,
  type PlayerAction,
} from "@veilbreak/engine";
import { contentHash, type RuleSet } from "./crypto-rules";
import { canonicalJson, cryptoRandomBytes, randomHex, sha256Hex, type RandomBytes } from "./hash";
import { decodeBundle, encodeBundle, type Action, type Bundle, type Message, type Role } from "./messages";
import { deriveSeed, mixRngState, mixSalts, seedCommitment, turnCommitment } from "./seed";

// The serverless friend-match state machine (spec/06 "Friend match by code").
// One Session per player, plain JSON so it can be saved to IndexedDB and
// resumed after the tab is closed. All functions are pure apart from the
// injected randomness and the Web Crypto hashing (hence async).
//
// Flow: host setup (with a seed commitment) -> guest setup (with its seed
// contribution) -> host seed reveal -> then per turn: commit, reveal (only once
// the other side's commitment is in), resolve locally, compare state hashes.

export type Phase = "awaiting-host-setup" | "awaiting-guest" | "awaiting-host-seed" | "playing" | "over" | "failed";

export type ProblemCode =
  | "malformed"
  | "wrongMatch"
  | "outOfOrder"
  | "handshake"
  | "invalidTeam"
  | "wrongReveal"
  | "illegalAction"
  | "desync"
  | "wrongPhase"
  | "illegalChoice"
  | "matchOver";

export interface Problem {
  code: ProblemCode;
  detail: string;
  /** A fatal problem ends the match (cheating, tampering, or an incompatible game). */
  fatal: boolean;
}

export type EndReason = "wipe" | "turnLimit" | "draw" | "resign";

interface TurnProgress {
  step: number;
  mine?: { actions: Action[]; salt: string; commitment: string; revealed: boolean };
  theirCommit?: string;
  theirReveal?: { actions: Action[]; salt: string };
}

export interface RecordedStep {
  a: Action[];
  b: Action[];
  /** The mixed per-turn salt that was folded into the RNG before this turn. */
  salt: string;
  /** The RNG state after that mixing: a replay sets it directly, with no hashing needed. */
  rng: string;
}

export interface Session {
  version: 1;
  matchId: string;
  role: Role;
  phase: Phase;
  balanceVersionId: string;
  contentHash: string;
  unlockRule: "own" | "all";
  myTeam: string[];
  theirTeam?: string[];
  hostSecret?: { contribution: string; salt: string };
  hostCommit?: string;
  guestContribution?: string;
  seed?: number;
  state?: BattleState;
  steps: RecordedStep[];
  turn: TurnProgress;
  hashes: Record<string, string>;
  peerHashes: Record<string, string>;
  outbox: Message[];
  peerAck: number;
  received: number;
  result?: { winner: Role | null; reason: EndReason };
  problem?: Problem;
}

export type Result<T = Session> = { ok: true; session: T } | { ok: false; problem: Problem; session: Session };

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const other = (role: Role): Role => (role === "playerA" ? "playerB" : "playerA");
const problem = (code: ProblemCode, detail: string, fatal = false): Problem => ({ code, detail, fatal });
const sortActions = (actions: readonly Action[]): Action[] =>
  [...actions].map((a) => ({ characterId: a.characterId, abilityId: a.abilityId, targetIds: [...a.targetIds] })).sort((x, y) => x.characterId.localeCompare(y.characterId));

export async function stateHash(state: BattleState): Promise<string> {
  return sha256Hex(canonicalJson(state));
}

function teamProblem(rules: RuleSet, team: readonly string[]): string | undefined {
  if (team.length !== rules.matchFormat.teamSize) return `A team needs exactly ${rules.matchFormat.teamSize} fighters.`;
  if (new Set(team).size !== team.length) return "A team cannot repeat a fighter.";
  const unknown = team.find((id) => !rules.playableIds.includes(id));
  return unknown ? `"${unknown}" is not a fighter in this game.` : undefined;
}

function teamInput(playerId: string, ids: readonly string[], rules: RuleSet): CreateBattleTeamInput {
  return {
    playerId,
    characters: ids.map((id) => {
      const def = rules.characters[id];
      if (!def) throw new Error(`unknown character ${id}`);
      return { characterId: id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, tags: def.tags, resources: defaultResourcesFor(def) };
    }),
  };
}

// ------------------------------------------------------------------ creating a match

export async function createHost(
  rules: RuleSet,
  input: { team: string[]; unlockRule: "own" | "all" },
  random: RandomBytes = cryptoRandomBytes,
): Promise<Result> {
  const bad = teamProblem(rules, input.team);
  const matchId = randomHex(random, 8);
  const hash = await contentHash(rules);
  const session: Session = {
    version: 1,
    matchId,
    role: "playerA",
    phase: "awaiting-guest",
    balanceVersionId: rules.balanceVersionId,
    contentHash: hash,
    unlockRule: input.unlockRule,
    myTeam: [...input.team],
    steps: [],
    turn: { step: 0 },
    hashes: {},
    peerHashes: {},
    outbox: [],
    peerAck: 0,
    received: 0,
  };
  if (bad) return { ok: false, problem: problem("invalidTeam", bad), session };
  const contribution = randomHex(random);
  const salt = randomHex(random);
  session.hostSecret = { contribution, salt };
  session.outbox.push({
    type: "setup",
    role: "playerA",
    matchId,
    balanceVersionId: rules.balanceVersionId,
    contentHash: hash,
    unlockRule: input.unlockRule,
    team: [...input.team],
    seedCommit: await seedCommitment(matchId, contribution, salt),
  });
  return { ok: true, session };
}

/** The guest turns the host's invite code into a session, and its own setup message becomes the reply. */
export async function joinFromInvite(rules: RuleSet, code: string, team: string[], random: RandomBytes = cryptoRandomBytes): Promise<Result> {
  const decoded = decodeBundle(code);
  const fail = (p: Problem): Result => ({ ok: false, problem: p, session: emptySession(rules, "unknown") });
  if (!decoded.ok) return fail(problem("malformed", decoded.error));
  const setup = decoded.bundle.msgs[0];
  if (decoded.bundle.from !== "playerA" || decoded.bundle.start !== 0 || !setup || setup.type !== "setup" || setup.role !== "playerA") {
    return fail(problem("malformed", "That is not an invite to a friend match."));
  }
  const session = emptySession(rules, setup.matchId);
  session.role = "playerB";
  session.phase = "awaiting-host-setup";
  session.myTeam = [...team];
  session.contentHash = await contentHash(rules);
  session.balanceVersionId = rules.balanceVersionId;
  session.unlockRule = setup.unlockRule;
  const bad = teamProblem(rules, team);
  if (bad) return { ok: false, problem: problem("invalidTeam", bad), session };
  session.hostSecret = undefined;
  // Remember our seed contribution (sent in the clear; the host is already committed).
  session.guestContribution = randomHex(random);
  return receive(session, code, rules);
}

function emptySession(rules: RuleSet, matchId: string): Session {
  return {
    version: 1,
    matchId,
    role: "playerB",
    phase: "failed",
    balanceVersionId: rules.balanceVersionId,
    contentHash: "",
    unlockRule: "all",
    myTeam: [],
    steps: [],
    turn: { step: 0 },
    hashes: {},
    peerHashes: {},
    outbox: [],
    peerAck: 0,
    received: 0,
  };
}

// ------------------------------------------------------------------ receiving

/** Applies a friend's code. Nothing changes unless the whole bundle is accepted; a fatal problem marks the match as failed. */
export async function receive(session: Session, code: string, rules: RuleSet): Promise<Result> {
  if (session.problem?.fatal) return { ok: false, problem: session.problem, session };
  const decoded = decodeBundle(code);
  if (!decoded.ok) return { ok: false, problem: problem("malformed", decoded.error), session };
  const bundle = decoded.bundle;
  if (session.phase !== "awaiting-host-setup" && bundle.match !== session.matchId) return { ok: false, problem: problem("wrongMatch", "That code belongs to a different match."), session };
  if (bundle.from === session.role) return { ok: false, problem: problem("wrongMatch", "That is your own code. Send it to your friend instead."), session };
  if (bundle.ack > session.outbox.length) return { ok: false, problem: problem("malformed", "That code acknowledges messages that were never sent."), session };
  if (bundle.start > session.received) return { ok: false, problem: problem("outOfOrder", "An earlier code from your friend is missing. Ask them to send their latest code again."), session };

  const work = clone(session);
  work.peerAck = Math.max(work.peerAck, bundle.ack);
  for (const [k, message] of bundle.msgs.entries()) {
    const index = bundle.start + k;
    if (index < work.received) continue; // already processed: sending a code twice is harmless
    const failure = await applyMessage(work, message, rules);
    if (failure) return fail(session, work, failure);
    work.received += 1;
  }
  if (bundle.sh) {
    const failure = noteHash(work, bundle.sh.step, bundle.sh.hash);
    if (failure) return fail(session, work, failure);
  }
  return { ok: true, session: work };
}

function fail(before: Session, work: Session, p: Problem): Result {
  if (!p.fatal) return { ok: false, problem: p, session: before };
  const failed = clone(before);
  failed.phase = "failed";
  failed.problem = p;
  void work;
  return { ok: false, problem: p, session: failed };
}

function noteHash(s: Session, step: number, hash: string): Problem | undefined {
  s.peerHashes[String(step)] = hash;
  const mine = s.hashes[String(step)];
  if (mine !== undefined && mine !== hash) {
    return problem("desync", `The game states no longer match after turn ${step}. Either side may have been tampered with or is running different rules.`, true);
  }
  return undefined;
}

async function applyMessage(s: Session, m: Message, rules: RuleSet): Promise<Problem | undefined> {
  if (s.phase === "over") return m.type === "stateHash" ? noteHash(s, m.step, m.hash) : problem("matchOver", "The match is already over.");
  switch (m.type) {
    case "setup":
      return s.role === "playerA" ? hostReceivesGuest(s, m, rules) : guestReceivesHost(s, m, rules);
    case "reveal":
      if (m.kind === "seed") return guestReceivesSeed(s, m, rules);
      return receiveTurnReveal(s, m, rules);
    case "commit": {
      if (s.phase !== "playing") return problem("wrongPhase", "Your friend sent a move before the match started.", true);
      if (m.step !== s.turn.step) return problem("outOfOrder", "Your friend's move is for a different turn.", true);
      if (s.turn.theirCommit) return problem("wrongPhase", "Your friend committed twice in one turn.", true);
      s.turn.theirCommit = m.commitment;
      await autoReveal(s);
      return resolveIfReady(s, rules);
    }
    case "stateHash":
      return noteHash(s, m.step, m.hash);
    case "resign":
      s.result = { winner: s.role, reason: "resign" };
      s.phase = "over";
      return undefined;
  }
}

async function hostReceivesGuest(s: Session, m: Extract<Message, { type: "setup" }>, rules: RuleSet): Promise<Problem | undefined> {
  if (s.phase !== "awaiting-guest" || m.role !== "playerB") return problem("wrongPhase", "Unexpected setup message.", true);
  const mismatch = handshakeProblem(s, m);
  if (mismatch) return mismatch;
  const bad = teamProblem(rules, m.team);
  if (bad) return problem("invalidTeam", `Your friend's team is not allowed: ${bad}`, true);
  if (!m.seedContribution || !s.hostSecret) return problem("malformed", "Your friend's reply has no seed contribution.", true);
  s.theirTeam = [...m.team];
  s.guestContribution = m.seedContribution;
  // Reveal our contribution now that the guest has chosen theirs blind.
  s.outbox.push({ type: "reveal", kind: "seed", seedContribution: s.hostSecret.contribution, salt: s.hostSecret.salt });
  s.seed = await deriveSeed(s.matchId, s.hostSecret.contribution, m.seedContribution);
  await startBattle(s, rules);
  return undefined;
}

async function guestReceivesHost(s: Session, m: Extract<Message, { type: "setup" }>, rules: RuleSet): Promise<Problem | undefined> {
  if (s.phase !== "awaiting-host-setup" || m.role !== "playerA") return problem("wrongPhase", "Unexpected setup message.", true);
  const mismatch = handshakeProblem(s, m);
  if (mismatch) return mismatch;
  const bad = teamProblem(rules, m.team);
  if (bad) return problem("invalidTeam", `The host's team is not allowed: ${bad}`, true);
  if (!m.seedCommit || !s.guestContribution) return problem("malformed", "The invite has no seed commitment.", true);
  s.theirTeam = [...m.team];
  s.hostCommit = m.seedCommit;
  s.phase = "awaiting-host-seed";
  s.outbox.push({
    type: "setup",
    role: "playerB",
    matchId: s.matchId,
    balanceVersionId: s.balanceVersionId,
    contentHash: s.contentHash,
    unlockRule: s.unlockRule,
    team: [...s.myTeam],
    seedContribution: s.guestContribution,
  });
  return undefined;
}

function handshakeProblem(s: Session, m: Extract<Message, { type: "setup" }>): Problem | undefined {
  if (m.matchId !== s.matchId) return problem("wrongMatch", "That code belongs to a different match.", true);
  if (m.balanceVersionId !== s.balanceVersionId) return problem("handshake", "You and your friend are running different balance versions. Update both to the latest game.", true);
  if (m.contentHash !== s.contentHash) return problem("handshake", "You and your friend have different versions of the game rules. Update both to the latest game.", true);
  if (m.unlockRule !== s.unlockRule) return problem("handshake", "You disagree about the unlock rule.", true);
  return undefined;
}

async function guestReceivesSeed(s: Session, m: Extract<Message, { type: "reveal"; kind: "seed" }>, rules: RuleSet): Promise<Problem | undefined> {
  if (s.phase !== "awaiting-host-seed" || s.role !== "playerB" || !s.hostCommit || !s.guestContribution) return problem("wrongPhase", "Unexpected seed reveal.", true);
  if ((await seedCommitment(s.matchId, m.seedContribution, m.salt)) !== s.hostCommit) {
    return problem("wrongReveal", "The host's seed does not match what they committed to. The match cannot be trusted.", true);
  }
  s.seed = await deriveSeed(s.matchId, m.seedContribution, s.guestContribution);
  await startBattle(s, rules);
  return undefined;
}

async function startBattle(s: Session, rules: RuleSet): Promise<void> {
  const teamA = s.role === "playerA" ? s.myTeam : (s.theirTeam ?? []);
  const teamB = s.role === "playerA" ? (s.theirTeam ?? []) : s.myTeam;
  s.state = createBattle([teamInput("playerA", teamA, rules), teamInput("playerB", teamB, rules)], s.seed ?? 0, {
    balanceVersionId: rules.balanceVersionId,
    matchFormat: rules.matchFormat,
    energyRules: rules.deps.energyRules,
  });
  s.phase = "playing";
  s.turn = { step: 0 };
  s.hashes["0"] = await stateHash(s.state);
}

// ------------------------------------------------------------------ turns

function asPlayerActions(role: Role, actions: readonly Action[]): PlayerAction[] {
  return actions.map((a) => ({ playerId: role, characterId: a.characterId, abilityId: a.abilityId, targetIds: a.targetIds }));
}

function actionsProblem(s: Session, role: Role, actions: readonly Action[], rules: RuleSet): string | undefined {
  const state = s.state;
  if (!state) return "The match has not started.";
  const team = state.teams.find((t) => t.playerId === role)?.characterIds ?? [];
  const seen = new Set<string>();
  let pool = state.energyPools[role];
  for (const action of actions) {
    if (!team.includes(action.characterId)) return "An action is for a fighter that is not on that team.";
    if (seen.has(action.characterId)) return "A fighter has more than one action.";
    seen.add(action.characterId);
    const errors = validateAction(state, { playerId: role, ...action }, rules.deps.abilities);
    if (errors.length > 0) return `An action is not legal (${errors[0]?.code}).`;
    const ability = rules.deps.abilities[action.abilityId];
    const actor = state.characters[action.characterId];
    if (!ability || !actor || !pool) return "An action is not legal.";
    const paid = payCost(pool, getEffectiveCost(ability, actor));
    if (!paid) return "The team does not have the energy for those actions together.";
    pool = paid;
  }
  return undefined;
}

/** Locks in this side's actions for the turn: a commitment now, the reveal as soon as the friend's commitment is in. */
export async function chooseActions(session: Session, actions: Action[], rules: RuleSet, random: RandomBytes = cryptoRandomBytes): Promise<Result> {
  if (session.phase !== "playing" || !session.state) return { ok: false, problem: problem("wrongPhase", "The match is not ready for moves yet."), session };
  if (session.turn.mine) return { ok: false, problem: problem("illegalChoice", "You have already locked in this turn."), session };
  const sorted = sortActions(actions);
  const bad = actionsProblem(session, session.role, sorted, rules);
  if (bad) return { ok: false, problem: problem("illegalChoice", bad), session };
  const work = clone(session);
  const salt = randomHex(random);
  const commitment = await turnCommitment(work.matchId, work.turn.step, work.role, canonicalJson(sorted), salt);
  work.turn.mine = { actions: sorted, salt, commitment, revealed: false };
  work.outbox.push({ type: "commit", step: work.turn.step, commitment });
  await autoReveal(work);
  const failure = await resolveIfReady(work, rules);
  if (failure) return fail(session, work, failure);
  return { ok: true, session: work };
}

/** Reveal only once BOTH commitments exist: revealing first would let the other side adapt. */
async function autoReveal(s: Session): Promise<void> {
  const mine = s.turn.mine;
  if (!mine || mine.revealed || !s.turn.theirCommit) return;
  mine.revealed = true;
  s.outbox.push({ type: "reveal", kind: "turn", step: s.turn.step, actions: mine.actions, salt: mine.salt });
}

async function receiveTurnReveal(s: Session, m: Extract<Message, { type: "reveal"; kind: "turn" }>, rules: RuleSet): Promise<Problem | undefined> {
  if (s.phase !== "playing") return problem("wrongPhase", "Your friend revealed a move before the match started.", true);
  if (m.step !== s.turn.step) return problem("outOfOrder", "Your friend's reveal is for a different turn.", true);
  if (!s.turn.theirCommit) return problem("wrongReveal", "Your friend revealed a move without committing to it first.", true);
  const theirs = other(s.role);
  const sorted = sortActions(m.actions);
  if ((await turnCommitment(s.matchId, m.step, theirs, canonicalJson(sorted), m.salt)) !== s.turn.theirCommit) {
    return problem("wrongReveal", "Your friend's revealed move does not match what they committed to. The match cannot be trusted.", true);
  }
  const bad = actionsProblem(s, theirs, sorted, rules);
  if (bad) return problem("illegalAction", `Your friend's move is not legal: ${bad}`, true);
  s.turn.theirReveal = { actions: sorted, salt: m.salt };
  return resolveIfReady(s, rules);
}

async function resolveIfReady(s: Session, rules: RuleSet): Promise<Problem | undefined> {
  const { mine, theirReveal } = s.turn;
  if (!s.state || !mine?.revealed || !theirReveal) return undefined;
  const a = s.role === "playerA" ? mine : theirReveal;
  const b = s.role === "playerA" ? theirReveal : mine;
  const mixed = await mixSalts(s.matchId, s.turn.step, a.salt, b.salt);
  const rng = await mixRngState(s.state.rngState, mixed);
  const seeded: BattleState = { ...s.state, rngState: rng };
  const result = resolveTurn(seeded, asPlayerActions("playerA", a.actions), asPlayerActions("playerB", b.actions), rules.deps);
  if (!result.ok) return problem("illegalAction", "The turn could not be resolved: an action was not legal.", true);
  s.state = result.state;
  s.steps.push({ a: a.actions, b: b.actions, salt: mixed, rng });
  s.turn = { step: s.turn.step + 1 };
  const hash = await stateHash(result.state);
  s.hashes[String(s.turn.step)] = hash;
  const end = result.events.find((e) => e.type.startsWith("matchEnded"));
  if (end) {
    const winner = typeof end.payload?.winnerPlayerId === "string" ? (end.payload.winnerPlayerId as Role) : null;
    s.result = { winner, reason: end.type === "matchEndedInDraw" ? "draw" : end.type === "matchEndedByTurnLimit" ? "turnLimit" : "wipe" };
    s.phase = "over";
    s.outbox.push({ type: "stateHash", step: s.turn.step, hash });
  }
  const peer = s.peerHashes[String(s.turn.step)];
  return peer !== undefined ? noteHash(s, s.turn.step, peer) : undefined;
}

export async function resign(session: Session): Promise<Result> {
  if (session.phase !== "playing") return { ok: false, problem: problem("wrongPhase", "There is no match to resign from."), session };
  const work = clone(session);
  work.outbox.push({ type: "resign", step: work.turn.step });
  work.result = { winner: other(work.role), reason: "resign" };
  work.phase = "over";
  return { ok: true, session: work };
}

// ------------------------------------------------------------------ outgoing codes and status

/** The code to send your friend: every message they have not confirmed yet, plus your latest state hash. */
export function outgoingCode(session: Session): string {
  const step = session.steps.length;
  const hash = session.hashes[String(step)];
  const bundle: Bundle = {
    v: 1,
    match: session.matchId,
    from: session.role,
    start: session.peerAck,
    ack: session.received,
    msgs: session.outbox.slice(session.peerAck),
    ...(hash ? { sh: { step, hash } } : {}),
  };
  return encodeBundle(bundle);
}

/** True when there is something your friend has not seen yet. */
export const hasUnsent = (session: Session): boolean => session.outbox.length > session.peerAck;

export type StatusKind = "waiting-for-guest" | "waiting-for-host" | "your-move" | "waiting-for-friend-move" | "waiting-for-friend-reveal" | "over" | "failed";

export function statusOf(session: Session): StatusKind {
  if (session.phase === "failed") return "failed";
  if (session.phase === "over") return "over";
  if (session.phase === "awaiting-guest") return "waiting-for-guest";
  if (session.phase === "awaiting-host-setup" || session.phase === "awaiting-host-seed") return "waiting-for-host";
  if (!session.turn.mine) return "your-move";
  return session.turn.theirCommit ? "waiting-for-friend-reveal" : "waiting-for-friend-move";
}

export interface ReplaySource {
  seed: number;
  teamAIds: string[];
  teamBIds: string[];
  steps: RecordedStep[];
  winnerPlayerId: string | null;
}

/** What a replay of a finished (or running) friend match needs. */
export function replaySource(session: Session): ReplaySource | undefined {
  if (session.seed === undefined || !session.theirTeam) return undefined;
  const mine = session.myTeam;
  return {
    seed: session.seed,
    teamAIds: session.role === "playerA" ? mine : session.theirTeam,
    teamBIds: session.role === "playerA" ? session.theirTeam : mine,
    steps: session.steps,
    winnerPlayerId: session.result?.winner ?? null,
  };
}
