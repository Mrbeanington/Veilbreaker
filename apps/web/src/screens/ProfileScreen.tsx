import { useCallback, useEffect, useMemo, useState } from "react";
import {
  QR_MAX_BYTES,
  decodeTransfer,
  encodeTransfer,
  exportBackup,
  extractTransferCode,
  importBackup,
  levelProgress,
  listReplays,
  renderQrSvg,
  saveReplay,
  summarizeProfile,
  type Profile,
  type ProfileSummary,
  type ReplayRecord,
} from "@veilbreak/persistence";
import { QrScanner } from "../components/QrScanner";
import { buildIdTable } from "../game/progression";
import { useProfile } from "../profile/ProfileContext";
import { DELETE_WARNING, offerMoveProgress, readEnv, detectPlatform } from "../platform/install";
import { backupFileName, chooseAutosaveFile, downloadText, hasAutosaveFile, readFileText, shareOrDownload, stopAutosave, supportsAutosave } from "../platform/files";
import { protectionLabel } from "../platform/protection";
import { HistoryPanel } from "./HistoryPanel";

interface Incoming {
  profile: Profile;
  replays: ReplayRecord[];
  summary: ProfileSummary;
  from: "transfer" | "backup";
}

function describe(summary: ProfileSummary): string {
  const played = summary.lastPlayedAt ? `last played ${new Date(summary.lastPlayedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "not played yet";
  return `Level ${summary.level} · ${summary.legends} Legend${summary.legends === 1 ? "" : "s"} · ${summary.matches} match${summary.matches === 1 ? "" : "es"} · ${played}`;
}

interface ProfileScreenProps {
  initialTransferCode?: string;
  initialReplayCode?: string;
}

export function ProfileScreen({ initialTransferCode, initialReplayCode }: ProfileScreenProps) {
  const { profile, replace, store, protection, persistent, loadInfo } = useProfile();
  const idTable = useMemo(() => buildIdTable(), []);
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [pasted, setPasted] = useState(initialTransferCode ?? "");
  const [scanning, setScanning] = useState(false);
  const [autosave, setAutosave] = useState(false);
  const env = useMemo(() => readEnv(), []);
  const platform = useMemo(() => detectPlatform(env), [env]);
  const move = offerMoveProgress(profile, env, platform);
  const progress = levelProgress(profile.xp);

  useEffect(() => {
    void hasAutosaveFile(store).then(setAutosave);
  }, [store]);

  const receiveCode = useCallback(
    (text: string) => {
      setError(null);
      setMessage(null);
      const result = decodeTransfer(extractTransferCode(text), idTable);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIncoming({ profile: result.profile, replays: [], summary: result.summary, from: "transfer" });
      setScanning(false);
    },
    [idTable],
  );

  // A `#transfer=` link opened on this device arrives here already filled in.
  useEffect(() => {
    if (initialTransferCode) receiveCode(initialTransferCode);
  }, [initialTransferCode, receiveCode]);

  const code = useMemo(() => (showSend ? encodeTransfer(profile, idTable) : ""), [showSend, profile, idTable]);
  const link = code ? `${location.origin}${location.pathname}#transfer=${code}` : "";
  const qr = code && code.length <= QR_MAX_BYTES ? renderQrSvg(code) : "";

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${what} copied.`);
    } catch {
      setMessage(`Select the ${what.toLowerCase()} and copy it by hand.`);
    }
  }

  async function backUp(share: boolean) {
    setError(null);
    const text = exportBackup(profile, await listReplays(store));
    if (share) {
      const result = await shareOrDownload(text, backupFileName());
      setMessage(result === "shared" ? "Backup shared." : result === "downloaded" ? "Backup saved to your downloads." : null);
    } else {
      downloadText(text, backupFileName());
      setMessage("Backup saved to your downloads.");
    }
  }

  async function restoreFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const result = importBackup(await readFileText(file));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIncoming({ profile: result.profile, replays: result.replays, summary: result.summary, from: "backup" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file could not be read.");
    }
  }

  async function confirmIncoming() {
    if (!incoming) return;
    // `replace` writes a backup snapshot of the save being replaced first (spec/06).
    replace(incoming.profile);
    for (const r of incoming.replays) await saveReplay(store, r);
    setMessage("Your progress has been replaced.");
    setIncoming(null);
  }

  async function toggleAutosave() {
    if (autosave) {
      await stopAutosave(store);
      setAutosave(false);
    } else {
      setAutosave(await chooseAutosaveFile(store));
    }
  }

  return (
    <div>
      <h2 className="title small">Profile</h2>

      {loadInfo && loadInfo.source === "backup" && (
        <p className="warn-text" role="status">
          Your latest save was damaged, so the game restored an automatic backup.
        </p>
      )}

      <div className="panel">
        <div className="section-title">Progress</div>
        <p>
          <strong>Level {progress.level}</strong> · {progress.into} / {progress.needed} to the next level
        </p>
        <div className="hp-bar-track" aria-hidden="true">
          <div className="hp-bar-fill" style={{ width: `${Math.round((progress.into / progress.needed) * 100)}%` }} />
        </div>
        <p className="hp-text">{describe(summarizeProfile(profile))}</p>
      </div>

      <div className="panel">
        <div className="section-title">Progress protection</div>
        <p>{persistent ? protectionLabel(protection) : "This browser is not letting the game save anything, so progress lasts only until you close the page. Make a backup."}</p>
        <p className="hp-text">{DELETE_WARNING}</p>
        {move === "in-app" && <p className="hp-text">You are using the installed app. To bring progress from Safari, open the game there, choose &ldquo;Move to another device&rdquo;, and paste the code below.</p>}
        {move === "in-safari-with-progress" && <p className="warn-text">Installing on iPhone starts a separate save. Copy your transfer code below first, then paste it in the app.</p>}
      </div>

      {incoming && (
        <div className="panel" role="alertdialog" aria-labelledby="overwrite-title">
          <div className="section-title" id="overwrite-title">
            Replace your progress?
          </div>
          <p>
            <strong>Incoming:</strong> {describe(incoming.summary)}
          </p>
          <p>
            <strong>On this device:</strong> {describe(summarizeProfile(profile))}
          </p>
          <p className="hp-text">Your current save is kept as an automatic backup. {incoming.from === "transfer" ? "Match history and replays are not part of a transfer." : ""}</p>
          <div className="button-row">
            <button type="button" className="btn primary" onClick={() => void confirmIncoming()}>
              Replace my progress
            </button>
            <button type="button" className="btn" onClick={() => setIncoming(null)}>
              Keep what I have
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {message && <p role="status">{message}</p>}

      <div className="panel">
        <div className="section-title">Move to another device</div>
        <p className="hp-text">Show a code on this device and scan or paste it on the other one.</p>
        <div className="button-row">
          <button type="button" className="btn" onClick={() => setShowSend((v) => !v)} aria-expanded={showSend}>
            {showSend ? "Hide my code" : "Transfer to another device"}
          </button>
        </div>
        {showSend && (
          <div className="transfer-send">
            {qr ? <div className="qr" role="img" aria-label="QR code for your progress" dangerouslySetInnerHTML={{ __html: qr }} /> : <p className="hp-text">This save is too large for a single picture, so use the code or a backup file.</p>}
            <label htmlFor="transfer-code">Code</label>
            <textarea id="transfer-code" readOnly rows={4} value={code} onFocus={(e) => e.currentTarget.select()} />
            <div className="button-row">
              <button type="button" className="btn" onClick={() => void copy(code, "Code")}>
                Copy code
              </button>
              <button type="button" className="btn" onClick={() => void copy(link, "Link")}>
                Copy link
              </button>
            </div>
          </div>
        )}

        <h3 className="sheet-section">Receive progress</h3>
        <label htmlFor="receive-code">Paste a code or link</label>
        <textarea id="receive-code" rows={3} value={pasted} onChange={(e) => setPasted(e.target.value)} />
        <div className="button-row">
          <button type="button" className="btn primary" disabled={pasted.trim().length === 0} onClick={() => receiveCode(pasted)}>
            Check code
          </button>
          <button type="button" className="btn" onClick={() => setScanning((v) => !v)}>
            {scanning ? "Stop scanning" : "Scan with camera"}
          </button>
        </div>
        {scanning && <QrScanner onCode={receiveCode} onClose={() => setScanning(false)} />}
      </div>

      <div className="panel">
        <div className="section-title">Back up and restore</div>
        <div className="button-row">
          <button type="button" className="btn primary" onClick={() => void backUp(true)}>
            Back up
          </button>
          <button type="button" className="btn" onClick={() => void backUp(false)}>
            Save a backup file
          </button>
          <label className="btn file-btn">
            Restore from a file
            <input type="file" accept=".json,application/json" onChange={(e) => void restoreFile(e.target.files?.[0])} />
          </label>
        </div>
        <p className="hp-text">A backup holds everything, including match history and replays.</p>
        {supportsAutosave() && (
          <div className="setting-row">
            <button type="button" className="btn" onClick={() => void toggleAutosave()}>
              {autosave ? "Stop auto-saving to a file" : "Auto-save to a file I choose"}
            </button>
            <p className="hp-text">Pick a file in a cloud folder (Dropbox, OneDrive) and it is kept up to date after every save. Optional.</p>
          </div>
        )}
      </div>

      <HistoryPanel initialReplayCode={initialReplayCode} />
    </div>
  );
}
