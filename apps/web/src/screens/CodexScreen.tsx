import { useMemo, useState } from "react";
import { ROLE_GLOSSARY, STATUS_LIBRARY, defaultEnergyRules, type StatusDefinition } from "@veilbreak/content";
import { CharacterBrowser } from "../components/CharacterBrowser";

// ADR-036: the Codex is a reference, not a second copy of the Characters page.
// It has three parts: Fighters (the knowledge-gated entries, with lore),
// Rules (how a match works, from the live rules config) and Statuses.

type Part = "fighters" | "rules" | "statuses";
const PARTS: { id: Part; label: string }[] = [
  { id: "fighters", label: "Fighters" },
  { id: "rules", label: "Rules" },
  { id: "statuses", label: "Statuses" },
];

const STACK_TEXT: Record<StatusDefinition["stackRule"], string> = {
  none: "Does not stack",
  stack: "Stacks",
  refresh: "Refreshes its duration",
  stackAndRefresh: "Stacks and refreshes",
};

const DAMAGE_LANGUAGE: [string, string][] = [
  ["10", "A chip. It adds up when stacked with other effects."],
  ["20", "A light attack."],
  ["30", "A normal attack."],
  ["40", "A heavy attack."],
  ["50", "Very heavy."],
  ["60+", "Exceptional. Always comes with a real cost, setup or drawback."],
];

const TURN_ORDER = [
  "Start-of-turn effects",
  "Transformations trigger",
  "Instant defensive reactions",
  "Priority abilities",
  "Control effects (stuns and locks)",
  "Standard attacks and support",
  "Delayed effects",
  "Damage over time",
  "Healing over time",
  "Defeats are checked",
  "Effects that trigger on defeat",
  "End-of-turn effects",
  "Cooldowns tick down",
  "Resources are generated",
];

export function RulesPage() {
  const { generation, poolCap } = defaultEnergyRules;
  return (
    <div className="codex-part">
      <section className="panel">
        <h3>A match</h3>
        <p>
          Each player brings three fighters. Every turn, both players secretly choose an action for each living fighter, spending energy from one shared team pool. When both have locked in, the turn plays out in a fixed order. A team loses when all
          three of its fighters are defeated.
        </p>
      </section>
      <section className="panel">
        <h3>Energy</h3>
        <p>
          Energy comes in four families: <strong>Might, Focus, Spirit and Chaos</strong>. A <strong>Neutral</strong> cost can be paid with any of them. At the end of each turn your team gains <strong>{generation.perLivingCharacter} energy for every living
          fighter</strong>, but never fewer than <strong>{generation.minPerTeam}</strong>, drawn at random from the families. The pool holds at most <strong>{poolCap}</strong>, and unspent energy carries over.
        </p>
        <p className="hp-text">Energy is meant to be scarce. You will usually want to do more than you can afford, so choosing what not to do matters.</p>
      </section>
      <section className="panel">
        <h3>Damage language</h3>
        <dl className="codex-list">
          {DAMAGE_LANGUAGE.map(([n, text]) => (
            <div key={n}>
              <dt>{n}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <p className="hp-text">Healing and defense use the same scale. Piercing damage ignores shields and damage reduction.</p>
      </section>
      <section className="panel">
        <h3>How a turn resolves</h3>
        <ol className="codex-steps">
          {TURN_ORDER.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="hp-text">A stun lands before standard attacks, so a stunned fighter's move usually never happens.</p>
      </section>
      <section className="panel">
        <h3>Rarity and unlocking</h3>
        <dl className="codex-list">
          <div>
            <dt>Core</dt>
            <dd>Every Core fighter, plus the Moon Rabbit, is yours from the start.</dd>
          </div>
          <div>
            <dt>Rare</dt>
            <dd>Unlocked by a short quest of one to three steps, such as winning with a particular fighter or role. Simpler fighters open first.</dd>
          </div>
          <div>
            <dt>Secret</dt>
            <dd>Meeting one in a match reveals it and shows its quest. Finish the quest to unlock it.</dd>
          </div>
          <div>
            <dt>Legend</dt>
            <dd>Reach its level and finish its quest, then win its trial in the Legend trials.</dd>
          </div>
        </dl>
        <p className="hp-text">Quests are listed under Missions. Rarity is not power: a Core fighter can counter a Legend, and every Legend and rule-breaker has counterplay.</p>
      </section>
      <section className="panel">
        <h3>Roles</h3>
        <dl className="codex-list">
          {Object.entries(ROLE_GLOSSARY).map(([role, text]) => (
            <div key={role}>
              <dt>{role.charAt(0) + role.slice(1).toLowerCase()}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export function StatusesPage() {
  const [query, setQuery] = useState("");
  const statuses = useMemo(
    () => Object.values(STATUS_LIBRARY).filter((s) => !s.hidden && s.knowledgeLevel === "PUBLIC").sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [],
  );
  const shown = statuses.filter((s) => `${s.displayName} ${s.tooltip}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="codex-part">
      <p className="hp-text">
        Conditions that sit on a fighter for a few turns. Stacking says what happens when the same status is applied again. Cleansable statuses can be removed by effects that dispel.
      </p>
      <label className="codex-search">
        <span className="sr-only">Filter statuses</span>
        <input type="search" placeholder="Filter statuses" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul className="codex-statuses" aria-label="Statuses">
        {shown.length === 0 && <li className="hp-text">No status matches.</li>}
        {shown.map((s) => (
          <li key={s.id}>
            <strong>{s.displayName}</strong>
            <span>
              {s.tooltip}
              {s.tickBehavior === "damageOverTime" ? " Ticks damage." : s.tickBehavior === "healOverTime" ? " Ticks healing." : ""}
            </span>
            <small className="hp-text">
              {STACK_TEXT[s.stackRule]}
              {s.maxStacks > 1 ? ` (up to ${s.maxStacks})` : ""} · {s.dispellable ? "Cleansable" : "Cannot be cleansed"}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CodexScreen() {
  const [part, setPart] = useState<Part>("fighters");
  return (
    <div>
      <h2 className="title small">Codex</h2>
      <div className="button-row codex-tabs" role="tablist" aria-label="Codex sections">
        {PARTS.map((p) => (
          <button key={p.id} type="button" role="tab" id={`codex-tab-${p.id}`} aria-selected={part === p.id} aria-controls={`codex-panel-${p.id}`} className={`btn${part === p.id ? " selected" : ""}`} onClick={() => setPart(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`codex-panel-${part}`} aria-labelledby={`codex-tab-${part}`}>
        {part === "fighters" && <CharacterBrowser mode="codex" idPrefix="codex" />}
        {part === "rules" && <RulesPage />}
        {part === "statuses" && <StatusesPage />}
      </div>
    </div>
  );
}

