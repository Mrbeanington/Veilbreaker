import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScreenBar } from "../components/ScreenBar";
import { ABILITY_LIBRARY, CHARACTER_LIBRARY, type Ability } from "@veilbreak/content";
import { canAct, getEffectiveCost, payCost, validateAction } from "@veilbreak/engine";
import { saveReplay, type HistoryEntry } from "@veilbreak/persistence";
import {
  chooseActions,
  createHost,
  hasUnsent,
  joinFromInvite,
  matchLink,
  outgoingCode,
  receive,
  resign,
  statusOf,
  type Problem,
  type Result,
  type Session,
} from "@veilbreak/protocol";
import { AbilityList } from "../components/AbilityList";
import { BattleLog } from "../components/BattleLog";
import { CharacterCard } from "../components/CharacterCard";
import { EnergyRow } from "../components/EnergyRow";
import { QueuedActionsPanel } from "../components/QueuedActionsPanel";
import { TeamPicker } from "../components/TeamPicker";
import { describeValidationError } from "../game/describeValidationError";
import { remainingPool } from "../game/energyBudget";
import { finishMatch } from "../game/finishMatch";
import { TEAM_SIZE } from "../game/roster";
import { useProfile } from "../profile/ProfileContext";
import { deleteSession, friendHistoryId, friendRules, listSessions, loadSession, outcomeFromSession, peekInvite, peekMatchId, saveSession } from "./friend";

const RULE_TEXT = {
  own: "Own unlocks only. This is on the honor system: nothing stops a friend from picking fighters they have not unlocked, so play it with people you trust.",
  all: "Everything unlocked. Every fighter is available to both of you.",
} as const;

const COMMIT_REVEAL_TEXT = "Your moves are locked in secretly until both of you have chosen.";

type View =
  | { name: "menu" }
  | { name: "host" }
  | { name: "join"; code: string }
  | { name: "session"; matchId: string; pendingCode?: string };

interface FriendScreenProps {
  /** A `#match=` code that arrived through a link. */
  initialCode?: string;
  onBack: () => void;
}

export function FriendScreen({ initialCode, onBack }: FriendScreenProps) {
  const { store } = useProfile();
  const [view, setView] = useState<View>({ name: "menu" });
  const [saved, setSaved] = useState<Session[]>([]);
  const routed = useRef(false);

  const refresh = useCallback(() => void listSessions(store).then(setSaved), [store]);
  useEffect(refresh, [refresh, view.name]);

  // A code from a link either continues a match we already have or starts joining a new one.
  useEffect(() => {
    if (!initialCode || routed.current) return;
    routed.current = true;
    const matchId = peekMatchId(initialCode);
    if (!matchId) {
      setView({ name: "join", code: initialCode });
      return;
    }
    void loadSession(store, matchId).then((existing) => setView(existing ? { name: "session", matchId, pendingCode: initialCode } : { name: "join", code: initialCode }));
  }, [initialCode, store]);

  return (
    <div>
      {view.name === "menu" && <ScreenBar onBack={onBack} />}
      <h2 className="title small">Friend match</h2>
      <p className="subtitle">Play a friend without any account or server: you swap short codes by message, email or any chat. {COMMIT_REVEAL_TEXT}</p>
      {view.name === "menu" && (
        <div>
          <div className="mode-grid">
            <button type="button" className="mode-card" onClick={() => setView({ name: "host" })}>
              <strong>Start a match</strong>
              <span>Pick your team and send an invite code.</span>
            </button>
            <button type="button" className="mode-card" onClick={() => setView({ name: "join", code: "" })}>
              <strong>Join with a code</strong>
              <span>Paste the invite your friend sent you.</span>
            </button>
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="section-title">Your friend matches</div>
            {saved.length === 0 ? (
              <p className="hp-text">None yet. Matches you start or join are saved here so you can close the page and continue later.</p>
            ) : (
              <ul className="preset-list">
                {saved.map((s) => (
                  <li key={s.matchId}>
                    <span>
                      {(s.theirTeam ?? []).map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id).join(", ") || "Waiting for a friend"} · {describeStatus(s)}
                    </span>
                    <button type="button" className="btn" onClick={() => setView({ name: "session", matchId: s.matchId })}>
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {view.name === "host" && <HostSetup onCancel={() => setView({ name: "menu" })} onCreated={(matchId) => setView({ name: "session", matchId })} />}
      {view.name === "join" && <JoinSetup initialCode={view.code} onCancel={() => setView({ name: "menu" })} onJoined={(matchId) => setView({ name: "session", matchId })} />}
      {view.name === "session" && (
        <SessionView
          matchId={view.matchId}
          pendingCode={view.pendingCode}
          onLeave={() => {
            refresh();
            setView({ name: "menu" });
          }}
          onDeleted={() => setView({ name: "menu" })}
        />
      )}
    </div>
  );
}

export function describeStatus(session: Session): string {
  switch (statusOf(session)) {
    case "waiting-for-guest":
      return "waiting for your friend to join";
    case "waiting-for-host":
      return "waiting for the host";
    case "your-move":
      return "your move";
    case "waiting-for-friend-move":
      return "waiting for your friend's move";
    case "waiting-for-friend-reveal":
      return "waiting for your friend to reveal";
    case "over":
      return "finished";
    case "failed":
      return "stopped";
  }
}

function explain(problem: Problem): string {
  return problem.detail;
}

// ---------------------------------------------------------------- start / join

function HostSetup({ onCancel, onCreated }: { onCancel: () => void; onCreated: (matchId: string) => void }) {
  const { store } = useProfile();
  const [rule, setRule] = useState<"own" | "all">("all");
  const [team, setTeam] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const result = await createHost(friendRules(), { team, unlockRule: rule });
    if (!result.ok) return setError(explain(result.problem));
    await saveSession(store, result.session);
    onCreated(result.session.matchId);
  }

  return (
    <div>
      <ScreenBar onBack={onCancel} status={`${team.length} of ${TEAM_SIZE} picked`} action={{ label: "Create invite", onClick: () => void create(), disabled: team.length !== TEAM_SIZE }} />
      <div className="panel">
        <div className="section-title">Unlock rule</div>
        {(["all", "own"] as const).map((r) => (
          <label key={r} className="setting-row" style={{ display: "block" }}>
            <input type="radio" name="rule" checked={rule === r} onChange={() => setRule(r)} /> {r === "all" ? "Everything unlocked" : "Own unlocks only"}
            <span className="hp-text" style={{ display: "block" }}>
              {RULE_TEXT[r]}
            </span>
          </label>
        ))}
      </div>
      <TeamPicker label="Your team" picked={team} onChange={setTeam} everythingUnlocked={rule === "all"} />
      {error && <div className="error-banner" role="alert">{error}</div>}
    </div>
  );
}

function JoinSetup({ initialCode, onCancel, onJoined }: { initialCode: string; onCancel: () => void; onJoined: (matchId: string) => void }) {
  const { store } = useProfile();
  const [code, setCode] = useState(initialCode);
  const [team, setTeam] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const invite = useMemo(() => (code.trim() ? peekInvite(code.trim()) : null), [code]);

  async function join() {
    const result = await joinFromInvite(friendRules(), code.trim(), team);
    if (!result.ok) return setError(explain(result.problem));
    await saveSession(store, result.session);
    onJoined(result.session.matchId);
  }

  return (
    <div>
      <ScreenBar onBack={onCancel} status={invite ? `${team.length} of ${TEAM_SIZE} picked` : undefined} action={{ label: "Join match", onClick: () => void join(), disabled: !invite || team.length !== TEAM_SIZE }} />
      <div className="panel">
        <label htmlFor="invite-code">Invite code or link from your friend</label>
        <textarea id="invite-code" rows={3} value={code} onChange={(e) => { setCode(e.target.value); setError(null); }} />
        {code.trim() && !invite && <p className="warn-text">That does not look like an invite code yet.</p>}
        {invite && (
          <>
            <p>
              <strong>Host&rsquo;s team:</strong> {invite.hostTeam.map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id).join(", ")}
            </p>
            <p className="hp-text">{RULE_TEXT[invite.unlockRule]}</p>
          </>
        )}
      </div>
      {invite && <TeamPicker label="Your team" picked={team} onChange={setTeam} everythingUnlocked={invite.unlockRule === "all"} />}
      {error && <div className="error-banner" role="alert">{error}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- a running match

function SessionView({ matchId, pendingCode, onLeave, onDeleted }: { matchId: string; pendingCode?: string; onLeave: () => void; onDeleted: () => void }) {
  const { store, profile, update } = useProfile();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const rules = useMemo(() => friendRules(), []);
  const applied = useRef(false);

  const commit = useCallback(
    (result: Result) => {
      setSession(result.session);
      void saveSession(store, result.session);
      setError(result.ok ? null : explain(result.problem));
      setMessage(null);
    },
    [store],
  );

  useEffect(() => {
    void loadSession(store, matchId).then((s) => {
      if (!s) return setError("That match could not be found on this device.");
      setSession(s);
      if (pendingCode && !applied.current) {
        applied.current = true;
        void receive(s, pendingCode, rules).then(commit);
      }
    });
  }, [store, matchId, pendingCode, rules, commit]);

  // Once a match ends, record it like any other match (xp, missions, history) and keep its replay.
  useEffect(() => {
    if (!session || session.phase !== "over") return;
    const id = friendHistoryId(session.matchId);
    if (profile.history.some((h: HistoryEntry) => h.id === id)) return;
    const outcome = outcomeFromSession(session);
    if (!outcome || !session.theirTeam) return;
    const done = finishMatch(
      profile,
      {
        mode: "friend",
        humanSide: session.role === "playerA" ? "A" : "B",
        replayId: id,
        teamAIds: session.role === "playerA" ? session.myTeam : session.theirTeam,
        teamBIds: session.role === "playerA" ? session.theirTeam : session.myTeam,
        seed: session.seed ?? 0,
      },
      outcome,
      Date.now(),
    );
    update(() => done.profile, { milestone: true });
    if (done.replay) void saveReplay(store, done.replay).catch(() => undefined);
  }, [session, profile, update, store]);

  if (!session) return <p role="status">{error ?? "Loading the match..."}</p>;

  const status = statusOf(session);
  const code = hasUnsent(session) ? outgoingCode(session) : "";
  const link = code ? matchLink(`${location.origin}${location.pathname}`, code) : "";

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${what} copied. Send it to your friend.`);
    } catch {
      setMessage(`Select the ${what.toLowerCase()} and copy it by hand.`);
    }
  }

  async function shareIt() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Veilbreak match", text: "Your move in our Veilbreak match", url: link });
        return;
      } catch {
        /* cancelled: fall through to copying */
      }
    }
    await copy(link, "Link");
  }

  async function apply() {
    if (!session) return;
    const result = await receive(session, pasted.trim(), rules);
    commit(result);
    if (result.ok) setPasted("");
  }

  return (
    <div>
      <p role="status" className="friend-status">
        <strong>{describeStatus(session)[0]?.toUpperCase()}{describeStatus(session).slice(1)}.</strong> <VerificationBadge session={session} />
      </p>
      {session.problem?.fatal && (
        <div className="error-banner" role="alert">
          This match was stopped. {explain(session.problem)}
        </div>
      )}
      {error && !session.problem?.fatal && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {message && <p role="status">{message}</p>}

      {session.state && (
        <div className="match-grid">
          {session.state.teams.map((team) => (
            <div className="team-column" key={team.playerId}>
              <div className="section-title">{team.playerId === session.role ? "Your team" : "Your friend's team"}</div>
              {team.characterIds.map((id) => (
                <CharacterCard key={id} character={session.state!.characters[id]!} displayName={CHARACTER_LIBRARY[id]?.displayName ?? id} />
              ))}
            </div>
          ))}
        </div>
      )}

      {status === "your-move" && <Planner session={session} rules={rules} onLocked={commit} />}
      {(status === "waiting-for-friend-move" || status === "waiting-for-friend-reveal") && (
        <p className="hp-text">Your move is locked in. {status === "waiting-for-friend-move" ? "Waiting for your friend to lock in theirs." : "Waiting for your friend's reveal."}</p>
      )}

      {session.phase === "over" && session.result && (
        <div className="panel">
          <div className="section-title">Match over</div>
          <p>
            {session.result.winner === null ? "It ended in a draw." : session.result.winner === session.role ? "You won!" : "Your friend won."}
            {session.result.reason === "resign" ? " (A player resigned.)" : ""}
          </p>
          <p className="hp-text">The match is saved to your history, and you can watch it again from Profile.</p>
        </div>
      )}

      {code && session.phase !== "failed" && (
        <div className="panel">
          <div className="section-title">Send this to your friend</div>
          <p className="hp-text">
            {session.phase === "awaiting-guest" ? "This is your invite. " : ""}It works in any chat or email. {COMMIT_REVEAL_TEXT}
          </p>
          <label htmlFor="out-code">Your code</label>
          <textarea id="out-code" readOnly rows={3} value={code} onFocus={(e) => e.currentTarget.select()} />
          <div className="button-row">
            <button type="button" className="btn primary" onClick={() => void copy(code, "Code")}>
              Copy code
            </button>
            <button type="button" className="btn" onClick={() => void copy(link, "Link")}>
              Copy link
            </button>
            <button type="button" className="btn" onClick={() => void shareIt()}>
              Share
            </button>
          </div>
        </div>
      )}

      {session.phase !== "failed" && (
        <div className="panel">
          <div className="section-title">Your friend&rsquo;s reply</div>
          <label htmlFor="in-code">Paste the code or link your friend sent back</label>
          <textarea id="in-code" rows={3} value={pasted} onChange={(e) => setPasted(e.target.value)} />
          <button type="button" className="btn primary" disabled={pasted.trim().length === 0} onClick={() => void apply()}>
            Check and apply
          </button>
        </div>
      )}

      {session.state && <BattleLog events={session.state.eventLog} />}

      <div className="button-row" style={{ marginTop: 16 }}>
        <button type="button" className="btn" onClick={onLeave}>
          Back to my matches
        </button>
        {session.phase === "playing" && !confirmResign && (
          <button type="button" className="btn" onClick={() => setConfirmResign(true)}>
            Resign
          </button>
        )}
        {confirmResign && (
          <>
            <button type="button" className="btn primary" onClick={() => void resign(session).then((r) => { commit(r); setConfirmResign(false); })}>
              Yes, resign
            </button>
            <button type="button" className="btn" onClick={() => setConfirmResign(false)}>
              Keep playing
            </button>
          </>
        )}
        {(session.phase === "over" || session.phase === "failed" || session.phase === "awaiting-guest") && (
          <button type="button" className="btn" onClick={() => void deleteSession(store, session.matchId).then(onDeleted)}>
            Remove from my list
          </button>
        )}
      </div>
    </div>
  );
}

/** "Verified", "Desync detected" and the like, in words plus a symbol (never colour alone). */
function VerificationBadge({ session }: { session: Session }) {
  if (session.problem?.code === "desync") return <span className="badge bad">✗ Desync detected</span>;
  if (session.problem?.fatal) return <span className="badge bad">✗ Not verified</span>;
  const checked = Object.entries(session.peerHashes).filter(([step, hash]) => session.hashes[step] === hash).length;
  if (session.phase === "playing" || session.phase === "over") {
    return checked > 0 ? <span className="badge good">✓ Verified ({checked} check{checked === 1 ? "" : "s"} matched)</span> : <span className="badge">Waiting for the first check</span>;
  }
  return null;
}

// ---------------------------------------------------------------- choosing moves

function Planner({ session, rules, onLocked }: { session: Session; rules: ReturnType<typeof friendRules>; onLocked: (result: Result) => void }) {
  const state = session.state!;
  const [pending, setPending] = useState<Record<string, { characterId: string; abilityId: string; targetIds: string[] }>>({});
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [aiming, setAiming] = useState<{ characterId: string; ability: Ability } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mine = state.teams.find((t) => t.playerId === session.role)?.characterIds ?? [];
  const ready = mine.filter((id) => state.characters[id]?.alive && canAct(state.characters[id]!));
  const queued = Object.values(pending).map((a) => ({ playerId: session.role, ...a }));
  const pool = remainingPool(state, session.role, queued, ABILITY_LIBRARY);
  const activeId = ready.find((id) => !pending[id] && !skipped.has(id));
  const active = activeId ? state.characters[activeId] : undefined;

  function queue(characterId: string, ability: Ability, targetIds: string[]) {
    const action = { characterId, abilityId: ability.id, targetIds };
    const errors = validateLocal(session, characterId, ability, targetIds, queued, rules);
    if (errors) return setError(errors);
    setError(null);
    setPending((p) => ({ ...p, [characterId]: action }));
    setAiming(null);
  }

  function pick(characterId: string, ability: Ability) {
    setError(null);
    if (ability.target.side === "self") queue(characterId, ability, [characterId]);
    else if (ability.target.scope !== "single") queue(characterId, ability, []);
    else setAiming({ characterId, ability });
  }

  async function lockIn() {
    onLocked(await chooseActions(session, Object.values(pending), rules));
  }

  return (
    <div>
      {pool && <EnergyRow pool={pool} />}
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="panel">
        {aiming ? (
          <>
            <div className="section-title">Choose a target for {aiming.ability.displayName}</div>
            <div className="button-row">
              {state.teams.flatMap((t) => t.characterIds).filter((id) => state.characters[id]?.alive).map((id) => (
                <button key={id} type="button" className="btn" onClick={() => queue(aiming.characterId, aiming.ability, [id])}>
                  {CHARACTER_LIBRARY[id]?.displayName ?? id}
                  {mine.includes(id) ? " (yours)" : ""}
                </button>
              ))}
              <button type="button" className="btn" onClick={() => setAiming(null)}>
                Cancel
              </button>
            </div>
          </>
        ) : active && activeId ? (
          <>
            <div className="section-title">{CHARACTER_LIBRARY[activeId]?.displayName}&rsquo;s action</div>
            <AbilityList
              abilities={active.abilityIds.map((id) => ABILITY_LIBRARY[id]).filter((a): a is Ability => !!a)}
              actor={active}
              pool={pool ?? { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 }}
              selectedAbilityId={null}
              onSelect={(ability) => pick(activeId, ability)}
            />
            <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => setSkipped((s) => new Set(s).add(activeId))}>
              Pass (no action)
            </button>
          </>
        ) : (
          <p>Every action is chosen. Lock them in when you are ready.</p>
        )}
      </div>
      <QueuedActionsPanel
        actions={Object.fromEntries(Object.entries(pending).map(([k, a]) => [k, { playerId: session.role, ...a }]))}
        skipped={skipped}
        readyCharacterIds={ready}
        onCancel={(id) => {
          setPending((p) => {
            const next = { ...p };
            delete next[id];
            return next;
          });
          setSkipped((s) => {
            const next = new Set(s);
            next.delete(id);
            return next;
          });
        }}
        onConfirm={() => void lockIn()}
      />
    </div>
  );
}

function validateLocal(
  session: Session,
  characterId: string,
  ability: Ability,
  targetIds: string[],
  queued: { playerId: string; characterId: string; abilityId: string; targetIds: string[] }[],
  rules: ReturnType<typeof friendRules>,
): string | null {
  // The protocol re-validates when the move is locked in; this gives instant, friendly feedback.
  const state = session.state;
  const actor = state?.characters[characterId];
  if (!state || !actor) return "That fighter cannot act.";
  const errors = validateAction(state, { playerId: session.role, characterId, abilityId: ability.id, targetIds }, rules.deps.abilities);
  if (errors[0]) return describeValidationError(errors[0]);
  // The protocol pays for a turn's actions in fighter order (so both clients agree), so check in that same order.
  const ordered = [...queued.filter((q) => q.characterId !== characterId), { playerId: session.role, characterId, abilityId: ability.id, targetIds }].sort((x, y) => x.characterId.localeCompare(y.characterId));
  let pool = state.energyPools[session.role];
  for (const action of ordered) {
    const a = ABILITY_LIBRARY[action.abilityId];
    const c = state.characters[action.characterId];
    if (!a || !c || !pool) return "That action is not available.";
    const paid = payCost(pool, getEffectiveCost(a, c));
    if (!paid) return "Your team does not have enough energy left for that after your other actions.";
    pool = paid;
  }
  return null;
}
