import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BASE_BALANCE_VERSION_ID,
  TUNABLE_CATEGORIES,
  applyBalanceDraft,
  balanceDraftSchema,
  baseLibraries,
  createDraft,
  listTunables,
  type BalanceDraft,
  type TunableCategory,
} from "@veilbreak/content";
import type { BotLevel } from "@veilbreak/ai";
import { useProfile } from "../profile/ProfileContext";
import { downloadText, readFileText } from "../platform/files";
import { deleteDraft, draftIdFrom, listDrafts, saveDraft } from "./drafts";
import { DEV_MODE_MARKER, compareReports, simulateBalance, type SimRequest, type SimResult } from "./simulation";
import type { SimWorkerMessage } from "./sim.worker";

// phase-12 / spec/06 "Balance tools (developer mode)". A workbench for changing
// numbers without touching source: edit a draft, see the diff and validation,
// run a quick simulation, and export JSON to commit into packages/content.
// Nothing here is reachable in a normal production build.

export const DEV_MARKER = DEV_MODE_MARKER;
const ROW_LIMIT = 40;
const BOTS: BotLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

type OkResult = SimResult & { ok: true };
type Comparison = { rows: ReturnType<typeof compareReports>; notes: OkResult; baseline: OkResult };
type Progress = { label: string; done: number; total: number } | null;

/** Runs a simulation in a Worker where there is one, and inline otherwise. */
function runSimulation(req: SimRequest, onProgress: (done: number, total: number) => void): { promise: Promise<SimResult>; cancel: () => void } {
  if (typeof Worker === "undefined") {
    return { promise: Promise.resolve(simulateBalance(req, onProgress)), cancel: () => undefined };
  }
  const worker = new Worker(new URL("./sim.worker.ts", import.meta.url), { type: "module" });
  const promise = new Promise<SimResult>((resolve) => {
    worker.onmessage = (event: MessageEvent<SimWorkerMessage>) => {
      if (event.data.type === "progress") onProgress(event.data.done, event.data.total);
      else {
        resolve(event.data.result);
        worker.terminate();
      }
    };
    worker.onerror = () => {
      resolve({ ok: false, errors: ["The simulation worker failed."] });
      worker.terminate();
    };
    worker.postMessage(req);
  });
  return { promise, cancel: () => worker.terminate() };
}

export default function DevMode() {
  const { store } = useProfile();
  const base = useMemo(() => baseLibraries(), []);
  const tunables = useMemo(() => listTunables(base), [base]);
  const baseByPath = useMemo(() => new Map(tunables.map((t) => [t.path, t])), [tunables]);

  const [drafts, setDrafts] = useState<BalanceDraft[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TunableCategory | "all">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [matches, setMatches] = useState(300);
  const [seed, setSeed] = useState(1);
  const [bot, setBot] = useState<BotLevel>("INTERMEDIATE");
  const [progress, setProgress] = useState<Progress>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const cancel = useRef<() => void>(() => undefined);

  const current = drafts.find((d) => d.id === currentId) ?? null;

  const reload = useCallback(async (select?: string) => {
    const list = await listDrafts(store);
    setDrafts(list);
    setCurrentId((id) => select ?? (id && list.some((d) => d.id === id) ? id : (list[0]?.id ?? null)));
  }, [store]);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => () => cancel.current(), []);

  async function persist(draft: BalanceDraft) {
    try {
      await saveDraft(store, draft);
      setMessage(null);
      await reload(draft.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save the draft.");
    }
  }

  const applied = useMemo(() => (current ? applyBalanceDraft(base, current) : null), [base, current]);

  function setValue(path: string, value: number | null) {
    if (!current) return;
    const original = baseByPath.get(path)?.value;
    const others = current.changes.filter((c) => c.path !== path);
    const changes = value === null || value === original ? others : [...others, { path, value }];
    void persist({ ...current, changes });
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tunables.filter((t) => (category === "all" || t.category === category) && (q === "" || t.label.toLowerCase().includes(q) || t.path.toLowerCase().includes(q)));
  }, [tunables, search, category]);

  async function simulate() {
    if (!current) return;
    setComparison(null);
    const run = async (label: string, draft: BalanceDraft | null) => {
      setProgress({ label, done: 0, total: matches });
      const job = runSimulation({ draft, matches, seed, bot }, (done, total) => setProgress({ label, done, total }));
      cancel.current = job.cancel;
      return job.promise;
    };
    const before = await run("Shipped balance", null);
    const after = await run("Draft", current);
    setProgress(null);
    if (!before.ok || !after.ok) {
      setMessage(`Simulation failed: ${[...(before.ok ? [] : before.errors), ...(after.ok ? [] : after.errors)].join("; ")}`);
      return;
    }
    setComparison({ rows: compareReports(before.report, after.report), notes: after, baseline: before });
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await readFileText(file, 2 * 1024 * 1024));
      const result = applyBalanceDraft(base, parsed);
      if (!result.ok) {
        setMessage(`That file is not a valid balance draft: ${result.errors.slice(0, 3).join(" ")}`);
        return;
      }
      const draft = balanceDraftSchema.parse(parsed);
      await persist({ ...draft, id: draftIdFrom(draft.id, drafts.map((d) => d.id)) });
    } catch {
      setMessage("That file could not be read as JSON.");
    }
  }

  return (
    <div data-dev-mode={DEV_MODE_MARKER}>
      <h2 className="title small">Balance workbench</h2>
      <p className="warn-text" role="note">
        Developer mode. Drafts stay in this browser until you export them. Nothing here changes the game people play, and nothing is ever adjusted automatically. Shipped version: {BASE_BALANCE_VERSION_ID}. Old replays keep running under the version they were recorded with.
      </p>
      {message && (
        <p role="alert" className="warn-text">
          {message}
        </p>
      )}

      <div className="panel">
        <div className="section-title">Drafts</div>
        <div className="setting-row">
          <label htmlFor="dev-draft-name">New draft name</label>{" "}
          <input id="dev-draft-name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} />{" "}
          <button
            type="button"
            className="btn"
            disabled={newName.trim() === ""}
            onClick={() => {
              const id = draftIdFrom(newName, drafts.map((d) => d.id));
              setNewName("");
              void persist(createDraft(id, [], new Date().toISOString()));
            }}
          >
            Create draft
          </button>
        </div>
        {drafts.length === 0 ? (
          <p className="hp-text">No drafts yet. Create one to start editing.</p>
        ) : (
          <div className="setting-row">
            <label htmlFor="dev-draft-select">Editing</label>{" "}
            <select id="dev-draft-select" value={currentId ?? ""} onChange={(e) => setCurrentId(e.target.value)}>
              {drafts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} ({d.changes.length} change{d.changes.length === 1 ? "" : "s"})
                </option>
              ))}
            </select>{" "}
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (current) void deleteDraft(store, current.id).then(() => reload());
              }}
            >
              Delete draft
            </button>
          </div>
        )}
        <div className="setting-row">
          <label htmlFor="dev-import">Import a draft file</label> <input id="dev-import" type="file" accept="application/json,.json" onChange={(e) => void importFile(e.target.files?.[0])} />
        </div>
      </div>

      {current && (
        <>
          <div className="panel">
            <div className="section-title">Change notes</div>
            <label htmlFor="dev-notes" className="hp-text">
              What this version changes and why (goes into the exported file)
            </label>
            <textarea id="dev-notes" rows={3} style={{ width: "100%" }} maxLength={4000} value={current.changeNotes ?? ""} onChange={(e) => void persist({ ...current, changeNotes: e.target.value })} />
          </div>

          <div className="panel">
            <div className="section-title">
              Edit values ({visible.length} of {tunables.length})
            </div>
            <div className="setting-row">
              <label htmlFor="dev-search">Search</label> <input id="dev-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="a character, ability or status" />{" "}
              <label htmlFor="dev-category">Kind</label>{" "}
              <select id="dev-category" value={category} onChange={(e) => setCategory(e.target.value as TunableCategory | "all")}>
                <option value="all">Everything</option>
                {TUNABLE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <ul className="preset-list">
              {visible.slice(0, ROW_LIMIT).map((t) => {
                const change = current.changes.find((c) => c.path === t.path);
                return (
                  <li key={t.path}>
                    <label htmlFor={`dev-v-${t.path}`}>
                      {t.label} <span className="hp-text">was {t.value}, at least {t.min}</span>
                    </label>
                    <input
                      id={`dev-v-${t.path}`}
                      type="number"
                      aria-label={t.label}
                      value={change?.value ?? t.value}
                      onChange={(e) => setValue(t.path, e.target.value === "" ? null : Math.trunc(Number(e.target.value)))}
                      style={{ width: 90 }}
                    />
                  </li>
                );
              })}
            </ul>
            {visible.length > ROW_LIMIT && <p className="hp-text">Showing the first {ROW_LIMIT}. Search to narrow the list.</p>}
          </div>

          <div className="panel" aria-live="polite">
            <div className="section-title">Diff and validation</div>
            {applied === null ? null : applied.ok ? (
              <>
                <p>
                  <strong>Valid.</strong> {applied.diff.length} value{applied.diff.length === 1 ? " differs" : "s differ"} from the shipped version.
                </p>
                {applied.warnings.map((w) => (
                  <p key={w} className="warn-text">
                    {w}
                  </p>
                ))}
                {applied.diff.length > 0 && (
                  <table>
                    <thead>
                      <tr>
                        <th>Value</th>
                        <th>Was</th>
                        <th>Now</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applied.diff.map((d) => (
                        <tr key={d.path}>
                          <td>{d.label}</td>
                          <td>{d.before}</td>
                          <td>{d.after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <ul>
                {applied.errors.map((e) => (
                  <li key={e} className="warn-text">
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <div className="section-title">Quick simulation</div>
            <p className="hp-text">Runs the headless simulator on random teams for the shipped balance and for this draft, in a Worker. Results are recommendations only.</p>
            <div className="setting-row">
              <label htmlFor="dev-matches">Matches</label> <input id="dev-matches" type="number" min={20} max={5000} value={matches} onChange={(e) => setMatches(Math.max(20, Math.min(5000, Math.trunc(Number(e.target.value)) || 20)))} style={{ width: 90 }} />{" "}
              <label htmlFor="dev-seed">Seed</label> <input id="dev-seed" type="number" value={seed} onChange={(e) => setSeed(Math.trunc(Number(e.target.value)) || 1)} style={{ width: 90 }} />{" "}
              <label htmlFor="dev-bot">Bots</label>{" "}
              <select id="dev-bot" value={bot} onChange={(e) => setBot(e.target.value as BotLevel)}>
                {BOTS.map((b) => (
                  <option key={b} value={b}>
                    {b.charAt(0) + b.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>{" "}
              <button type="button" className="btn primary" disabled={progress !== null || !applied?.ok} onClick={() => void simulate()}>
                Run simulation
              </button>
            </div>
            {progress && (
              <p role="status">
                {progress.label}: {progress.done} of {progress.total} matches
              </p>
            )}
            {comparison && <Dashboard comparison={comparison} />}
          </div>

          <div className="panel">
            <div className="section-title">Export</div>
            <p className="hp-text">
              Download the draft, then commit it into <code>packages/content</code> (see docs/design/balance-workflow.md) to publish it as a new balance version. Test it first with <code>pnpm sim --balance file.json</code>.
            </p>
            <button
              type="button"
              className="btn primary"
              disabled={!applied?.ok}
              onClick={() => downloadText(JSON.stringify({ ...current, createdAt: new Date().toISOString() }, null, 2), `balance-${current.id}.json`)}
            >
              Download {current.id}.json
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Dashboard({ comparison }: { comparison: Comparison }) {
  const { rows, notes, baseline } = comparison;
  const r = notes.report;
  return (
    <div>
      <h3 className="section-title">Character win rates</h3>
      <table>
        <thead>
          <tr>
            <th>Character</th>
            <th>Shipped</th>
            <th>Draft</th>
            <th>Change</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.base}%</td>
              <td>{row.draft}%</td>
              <td>{row.delta > 0 ? `+${row.delta}` : row.delta}</td>
              <td>{row.flag === "high" ? "Possible dominant pick" : row.flag === "low" ? "Check it is situational" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        First player wins {r.initiative.firstPlayerWinRate}% (shipped {baseline.report.initiative.firstPlayerWinRate}%). Average match {r.length.average} turns (shipped {baseline.report.length.average}). {r.length.turnLimitHits} match{r.length.turnLimitHits === 1 ? "" : "es"} reached the turn limit.
      </p>
      <h3 className="section-title">Recommendations for the draft (nothing is changed automatically)</h3>
      {notes.findings.length === 0 ? (
        <p className="hp-text">No outliers or degenerate patterns found in this run.</p>
      ) : (
        <ul>
          {notes.findings.map((f) => (
            <li key={f.text}>
              <strong>{f.severity === "investigate" ? "Investigate" : "Watch"}:</strong> {f.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
