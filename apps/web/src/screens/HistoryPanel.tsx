import { useEffect, useMemo, useState } from "react";
import { CHARACTER_LIBRARY } from "@veilbreak/content";
import {
  MAX_REPLAY_LINK_CHARS,
  decodeReplay,
  encodeReplay,
  loadReplay,
  parseReplayFile,
  replayFileText,
  saveReplay,
  type ReplayRecord,
} from "@veilbreak/persistence";
import { BattleLog } from "../components/BattleLog";
import { CharacterCard } from "../components/CharacterCard";
import { runReplay } from "../game/replay";
import { useProfile } from "../profile/ProfileContext";
import { downloadText, readFileText } from "../platform/files";

const PLAYER_LABELS: Record<string, string> = { playerA: "Player 1", playerB: "Player 2" };
const nameOf = (id: string) => CHARACTER_LIBRARY[id]?.displayName ?? id;

export function ReplayViewer({ record, onClose }: { record: ReplayRecord; onClose: () => void }) {
  const run = useMemo(() => runReplay(record), [record]);
  const [index, setIndex] = useState(0);
  const frames = run.frames;
  const frame = frames[Math.min(index, frames.length - 1)];
  const last = frames.length - 1;

  return (
    <div className="panel" aria-label="Replay">
      <div className="section-title">
        Replay: {record.teamAIds.map(nameOf).join(", ")} vs. {record.teamBIds.map(nameOf).join(", ")}
      </div>
      {!run.ok && <div className="error-banner" role="alert">{run.error}</div>}
      {run.ok && run.balanceMismatch && <p className="warn-text">This match was played under older game rules; it may not look exactly as it did then.</p>}
      {frame && (
        <>
          <p role="status">
            Turn {Math.min(index, last)} of {last}
            {run.ok && index >= last ? (run.winnerPlayerId ? `: ${PLAYER_LABELS[run.winnerPlayerId] ?? run.winnerPlayerId} wins` : ": draw") : ""}
          </p>
          <div className="match-grid">
            {frame.state.teams.map((team) => (
              <div className="team-column" key={team.playerId}>
                <div className="section-title">{PLAYER_LABELS[team.playerId] ?? team.playerId}&rsquo;s team</div>
                {team.characterIds.map((id) => (
                  <CharacterCard key={id} character={frame.state.characters[id]!} displayName={nameOf(id)} />
                ))}
              </div>
            ))}
          </div>
          <div className="button-row">
            <button type="button" className="btn" disabled={index <= 0} onClick={() => setIndex(0)}>
              Start
            </button>
            <button type="button" className="btn" disabled={index <= 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              Previous turn
            </button>
            <button type="button" className="btn primary" disabled={index >= last} onClick={() => setIndex((i) => Math.min(last, i + 1))}>
              Next turn
            </button>
            <button type="button" className="btn" disabled={index >= last} onClick={() => setIndex(last)}>
              End
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
          </div>
          <BattleLog events={frame.state.eventLog} />
        </>
      )}
    </div>
  );
}

export function HistoryPanel({ initialReplayCode }: { initialReplayCode?: string }) {
  const { profile, store } = useProfile();
  const [watching, setWatching] = useState<ReplayRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");

  // A `#replay=` link opened on this device plays straight away.
  useEffect(() => {
    if (!initialReplayCode) return;
    const result = decodeReplay(initialReplayCode);
    if (result.ok) setWatching(result.replay);
    else setError(result.error);
  }, [initialReplayCode]);

  async function watch(id: string | undefined) {
    setError(null);
    const record = id ? await loadReplay(store, id) : null;
    if (record) setWatching(record);
    else setError("That replay is no longer stored on this device.");
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const result = parseReplayFile(await readFileText(file));
      if (!result.ok) setError(result.error);
      else setWatching(result.replay);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file could not be read.");
    }
  }

  function importCode() {
    setError(null);
    const raw = pasted.trim();
    const code = /#replay=([A-Za-z0-9_.-]+)/.exec(raw)?.[1] ?? raw;
    const result = decodeReplay(code);
    if (result.ok) setWatching(result.replay);
    else setError(result.error);
  }

  async function share(record: ReplayRecord) {
    const code = encodeReplay(record);
    if (code.length > MAX_REPLAY_LINK_CHARS) {
      downloadText(replayFileText(record), `veilbreak-replay-${record.id}.json`);
      setMessage("This match is too long for a link, so it was saved as a file.");
      return;
    }
    const link = `${location.origin}${location.pathname}#replay=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Replay link copied.");
    } catch {
      setMessage(link);
    }
  }

  return (
    <div className="panel">
      <div className="section-title">Match history</div>
      {profile.history.length === 0 ? (
        <p className="hp-text">No matches yet. Finished matches appear here, and the latest ones can be replayed.</p>
      ) : (
        <ul className="preset-list">
          {profile.history.map((entry) => (
            <li key={entry.id}>
              <span>
                {new Date(entry.playedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {entry.mode === "trial" ? "Trial" : entry.mode === "bot" ? "Vs. AI" : "Hotseat"} ·{" "}
                {entry.winnerPlayerId ? `${PLAYER_LABELS[entry.winnerPlayerId] ?? entry.winnerPlayerId} won` : "draw"} · {entry.turns} turns ({entry.teamAIds.map(nameOf).join(", ")} vs. {entry.teamBIds.map(nameOf).join(", ")})
              </span>
              {entry.replayId && (
                <button type="button" className="btn" onClick={() => void watch(entry.replayId)}>
                  Watch replay
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3 className="sheet-section">Open a replay</h3>
      <div className="button-row">
        <label className="btn file-btn">
          From a file
          <input type="file" accept=".json,application/json" onChange={(e) => void importFile(e.target.files?.[0])} />
        </label>
      </div>
      <label htmlFor="replay-code">Or paste a replay code or link</label>
      <textarea id="replay-code" rows={2} value={pasted} onChange={(e) => setPasted(e.target.value)} />
      <button type="button" className="btn" disabled={pasted.trim().length === 0} onClick={importCode}>
        Open replay
      </button>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {message && <p role="status">{message}</p>}

      {watching && (
        <>
          <ReplayViewer record={watching} onClose={() => setWatching(null)} />
          <div className="button-row">
            <button type="button" className="btn" onClick={() => downloadText(replayFileText(watching), `veilbreak-replay-${watching.id}.json`)}>
              Save replay file
            </button>
            <button type="button" className="btn" onClick={() => void share(watching)}>
              Copy replay link
            </button>
            <button type="button" className="btn" onClick={() => void saveReplay(store, watching).then(() => setMessage("Replay kept on this device."))}>
              Keep on this device
            </button>
          </div>
        </>
      )}
    </div>
  );
}
