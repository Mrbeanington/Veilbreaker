import { useState } from "react";
import { CURRENT_BALANCE_VERSION_ID } from "@veilbreak/content";
import { useProfile } from "../profile/ProfileContext";
import { downloadText } from "../platform/files";
import { clearLog, readLog, recordEvent } from "./log";
import { buildReport, encodeReport, type Feedback, type ReportEnv } from "./report";

// ADR-049: the tester's side of the playtest kit (Settings > Playtest). A few quick questions, then a report
// code to paste into a message or save as a file. Nothing is sent by the game itself.

export function readReportEnv(): ReportEnv {
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  return {
    balance: CURRENT_BALANCE_VERSION_ID,
    ua: nav?.userAgent ?? "",
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
    touch: typeof window !== "undefined" && ("ontouchstart" in window || (nav?.maxTouchPoints ?? 0) > 0),
    lang: nav?.language ?? "",
  };
}

function Scale({ name, legend, low, high, value, onChange }: { name: string; legend: string; low: string; high: string; value: number; onChange: (n: number) => void }) {
  return (
    <fieldset className="scale">
      <legend>{legend}</legend>
      <div className="scale-row">
        <span className="hp-text">{low}</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="scale-choice">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} /> {n}
          </label>
        ))}
        <span className="hp-text">{high}</span>
      </div>
    </fieldset>
  );
}

export function FeedbackPanel() {
  const { profile, store } = useProfile();
  const [fun, setFun] = useState(0);
  const [clear, setClear] = useState(0);
  const [tutorial, setTutorial] = useState<Feedback["tutorial"]>(profile.tutorial.status === "skipped" ? "skipped" : "yes");
  const [again, setAgain] = useState<Feedback["again"]>("maybe");
  const [comment, setComment] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");

  async function create() {
    const report = buildReport({ profile, log: await readLog(store), env: readReportEnv(), feedback: { fun, clear, tutorial, again, comment } });
    setCode(encodeReport(report));
    setNote("");
    void recordEvent(store, "feedback");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setNote("Copied. Paste it into a message to the developer.");
    } catch {
      setNote("Select the code and copy it by hand.");
    }
  }

  return (
    <div className="panel" id="playtest">
      <div className="section-title">Playtest feedback</div>
      <p className="hp-text">
        Helping test the game? Answer a few questions and send the code below to the developer. The game keeps a small log on this device (screens opened, matches played, errors) and adds it to the code. Nothing is sent
        anywhere by the game, and the code has no name or personal details.
      </p>
      <Scale name="pt-fun" legend="How fun was it?" low="Not fun" high="Great" value={fun} onChange={setFun} />
      <Scale name="pt-clear" legend="Could you tell what was going on in a match?" low="Confusing" high="Clear" value={clear} onChange={setClear} />
      <div className="setting-row">
        <label htmlFor="pt-tutorial">Did the tutorial teach you enough?</label>{" "}
        <select id="pt-tutorial" value={tutorial} onChange={(e) => setTutorial(e.target.value as Feedback["tutorial"])}>
          <option value="yes">Yes</option>
          <option value="partly">Partly</option>
          <option value="no">No</option>
          <option value="skipped">I skipped it</option>
        </select>
      </div>
      <div className="setting-row">
        <label htmlFor="pt-again">Would you play again?</label>{" "}
        <select id="pt-again" value={again} onChange={(e) => setAgain(e.target.value as Feedback["again"])}>
          <option value="yes">Yes</option>
          <option value="maybe">Maybe</option>
          <option value="no">No</option>
        </select>
      </div>
      <label htmlFor="pt-comment">Anything confusing, broken or great? (optional, up to 600 characters)</label>
      <textarea id="pt-comment" rows={3} maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="button-row">
        <button type="button" className="btn primary" disabled={fun === 0 || clear === 0} onClick={() => void create()}>
          Create my report
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void clearLog(store);
            setCode("");
            setNote("The local log was cleared.");
          }}
        >
          Clear the local log
        </button>
      </div>
      {(fun === 0 || clear === 0) && <p className="hp-text">Answer the first two questions to create a report.</p>}
      {code && (
        <div className="transfer-send">
          <label htmlFor="pt-code">Your report code</label>
          <textarea id="pt-code" readOnly rows={4} value={code} onFocus={(e) => e.currentTarget.select()} />
          <div className="button-row">
            <button type="button" className="btn" onClick={() => void copy()}>
              Copy code
            </button>
            <button type="button" className="btn" onClick={() => downloadText(code, `veilbreak-playtest-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain")}>
              Save as a file
            </button>
          </div>
        </div>
      )}
      {note && <p role="status">{note}</p>}
    </div>
  );
}
