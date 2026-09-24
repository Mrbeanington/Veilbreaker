import { useEffect, useRef, useState } from "react";
import { rankedGate } from "../game/gates";
import { CHARACTER_LIBRARY } from "@veilbreak/content";
import {
  DIVISIONS,
  PLACEMENT_MATCHES,
  beginRankedMatch,
  forfeitUnfinished,
  isPlaced,
  rollSeason,
  saveReplay,
  shownDivision,
  standing,
  usageRanking,
  type RankedChange,
  type RankedState,
} from "@veilbreak/persistence";
import { legendCapFor } from "@veilbreak/ai";
import { Portrait } from "../components/Portrait";
import { TeamPicker } from "../components/TeamPicker";
import { characterVisibility } from "../game/knowledge";
import { finishMatch } from "../game/finishMatch";
import { planRankedMatch, settleTeams, type RankedPlan, type RankedTeams } from "../game/ranked";
import type { ProgressReport } from "../game/progression";
import { TEAM_SIZE } from "../game/roster";
import { useProfile } from "../profile/ProfileContext";
import { MatchScreen, type MatchOutcome } from "./MatchScreen";
import { ResultScreen } from "./ResultScreen";

// phase-11 / spec/06 "Local ranked": a single-player ladder against tiered
// bots. The rating is hidden; players see their division, placement progress,
// a coarse "standing", their record, streaks, personal bests and usage.

const name = (id: string) => CHARACTER_LIBRARY[id]?.displayName ?? id;
const seasonName = (id: string) => {
  const [year, month] = id.split("-");
  if (!year || !month) return "This season";
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
};
const BOT_NAMES: Record<string, string> = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", EXPERT: "Expert" };
const STANDING_TEXT = {
  climbing: "Close to a promotion.",
  steady: "Holding steady.",
  "at-risk": "One bad streak from a demotion.",
  unplaced: "",
} as const;

type Flow =
  | { name: "home" }
  | { name: "pick"; plan: RankedPlan }
  | { name: "ban"; plan: RankedPlan; playerDraft: string[] }
  | { name: "match"; plan: RankedPlan; teams: RankedTeams }
  | { name: "result"; outcome: MatchOutcome; plan: RankedPlan; teams: RankedTeams; change: RankedChange; revealed: string[]; report: ProgressReport };

function DivisionBadge({ ranked }: { ranked: RankedState }) {
  const division = shownDivision(ranked);
  if (!division) {
    const played = Math.min(ranked.placements, PLACEMENT_MATCHES);
    return (
      <div className="panel" data-testid="division">
        <div className="section-title">Unranked</div>
        <p>
          <strong>
            Placement matches: {played} of {PLACEMENT_MATCHES}
          </strong>
        </p>
        <p className="hp-text">Finish {PLACEMENT_MATCHES - played} more to earn a division. Placements move you faster than later matches.</p>
      </div>
    );
  }
  return (
    <div className="panel" data-testid="division">
      <div className="section-title">Your division</div>
      <p style={{ fontSize: "1.6rem", margin: "4px 0" }}>
        <strong>{division.label}</strong>
      </p>
      <p className="hp-text">{STANDING_TEXT[standing(ranked)]}</p>
    </div>
  );
}

function RankedHome({ ranked, notice, onPlay }: { ranked: RankedState; notice?: string; onPlay: () => void }) {
  const record = `${ranked.wins} won · ${ranked.losses} lost${ranked.draws ? ` · ${ranked.draws} drawn` : ""}`;
  const usage = usageRanking(ranked, 5);
  const seasons = [
    ...(ranked.wins + ranked.losses + ranked.draws > 0 || ranked.pastSeasons.length === 0
      ? [{ season: ranked.season, division: ranked.peakDivision, peakRating: ranked.peakRating, wins: ranked.wins, losses: ranked.losses, draws: ranked.draws, placed: isPlaced(ranked), current: true }]
      : []),
    ...ranked.pastSeasons.map((s) => ({ ...s, division: s.peakDivision, current: false })),
  ]
    .filter((s) => s.wins + s.losses + s.draws > 0)
    .sort((a, b) => b.peakRating - a.peakRating || b.wins - a.wins)
    .slice(0, 5);
  const bests = ranked.bests;
  const streakText = ranked.streak > 0 ? `${ranked.streak} win${ranked.streak === 1 ? "" : "s"} in a row` : ranked.streak < 0 ? `${-ranked.streak} loss${ranked.streak === -1 ? "" : "es"} in a row` : "none";

  return (
    <div>
      <h2 className="title small">Ranked</h2>
      <p className="subtitle">A ladder against bots of rising skill. It lives on this device and is saved with your profile.</p>
      {notice && (
        <p role="status" className="warn-text">
          {notice}
        </p>
      )}
      <DivisionBadge ranked={ranked} />

      <div className="panel">
        <div className="section-title">{ranked.season ? seasonName(ranked.season) : "This season"}</div>
        <p>
          {record} · streak: {streakText}
        </p>
        <p className="hp-text">
          Seasons last a calendar month. When one ends you keep half of what you climbed and play {PLACEMENT_MATCHES} placement matches again. Bots below Platinum bring at most {legendCapFor(0)} Legend; from Platinum, {legendCapFor(9)}. You may use any Legend you have unlocked. From Diamond, both sides bring four fighters and each bans one of the other's. Leaving a ranked match unfinished counts as a loss.
        </p>
        <div className="button-row">
          <button type="button" className="btn primary" onClick={onPlay}>
            Play a ranked match
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="section-title">Personal bests</div>
        {bests.matches === 0 ? (
          <p className="hp-text">Play a ranked match to start your records.</p>
        ) : (
          <ul className="preset-list">
            <li>Highest division: {isPlaced(ranked) || bests.division > 0 ? DIVISIONS[bests.division]?.label : "not placed yet"}</li>
            <li>Longest win streak: {bests.winStreak}</li>
            <li>Fastest win: {bests.fastestWinTurns ? `${bests.fastestWinTurns} turns` : "none yet"}</li>
            <li>Most wins in a season: {bests.seasonWins}</li>
            <li>Ranked matches played: {bests.matches}</li>
          </ul>
        )}
      </div>

      <div className="panel">
        <div className="section-title">Most played in ranked</div>
        {usage.length === 0 ? (
          <p className="hp-text">Your most used fighters will appear here.</p>
        ) : (
          <ul className="preset-list">
            {usage.map((u) => (
              <li key={u.id}>
                <span>
                  {name(u.id)}: {u.played} played, {u.won} won ({Math.round((u.won / u.played) * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <div className="section-title">Your best seasons</div>
        {seasons.length === 0 ? (
          <p className="hp-text">Finished seasons are ranked here by how high you climbed.</p>
        ) : (
          <ol className="preset-list">
            {seasons.map((s) => (
              <li key={s.season}>
                <span>
                  {seasonName(s.season)}
                  {s.current ? " (now)" : ""}: {s.placed ? (DIVISIONS[s.division]?.label ?? "") : "unplaced"} · {s.wins}-{s.losses}
                  {s.draws ? `-${s.draws}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="panel">
        <div className="section-title">Recent ranked matches</div>
        {ranked.recent.length === 0 ? (
          <p className="hp-text">Nothing yet.</p>
        ) : (
          <ul className="preset-list">
            {ranked.recent.slice(0, 10).map((m) => (
              <li key={m.id}>
                <span>
                  {new Date(m.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                  <strong>{m.result === "win" ? "Win" : m.result === "loss" ? (m.forfeit ? "Loss (left early)" : "Loss") : "Draw"}</strong> vs. {BOT_NAMES[m.botLevel] ?? m.botLevel} bot ({m.team.map(name).join(", ")} vs. {m.foe.map(name).join(", ")})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChangeCard({ change, plan }: { change: RankedChange; plan: RankedPlan }) {
  const { divisionBefore: before, divisionAfter: after } = change;
  return (
    <div role="status" className="result-report" data-testid="rank-change">
      {change.seasonRolledOver && <p>A new season began before this match.</p>}
      {after === null ? (
        <p>
          <strong>Placement match {PLACEMENT_MATCHES - change.placementsLeft} of {PLACEMENT_MATCHES}</strong>. {change.placementsLeft} to go before you get a division.
        </p>
      ) : change.placed ? (
        <p>
          <strong>Placements complete: you are {after.label}.</strong>
        </p>
      ) : change.promoted ? (
        <p>
          <strong>Promoted to {after.label}!</strong>
        </p>
      ) : change.demoted ? (
        <p>
          <strong>Demoted to {after.label}.</strong> {before ? `Win back ${before.label}.` : ""}
        </p>
      ) : (
        <p>Still {after.label}.</p>
      )}
      <p className="hp-text">Opponent: {BOT_NAMES[plan.botLevel] ?? plan.botLevel} bot.</p>
      {change.newBests.length > 0 && <p>New personal best: {change.newBests.join(", ")}.</p>}
    </div>
  );
}

function BanScreen({ plan, playerDraft, onBan }: { plan: RankedPlan; playerDraft: string[]; onBan: (id: string) => void }) {
  const { profile } = useProfile();
  const [chosen, setChosen] = useState<string | null>(null);
  const shown = (id: string) => {
    const character = CHARACTER_LIBRARY[id];
    return character && characterVisibility(character, { ...profile, settings: { ...profile.settings, showAllCharacters: false } }) === "full" ? character.displayName : "Unknown fighter";
  };
  return (
    <div>
      <h2 className="title small">Pick and ban</h2>
      <p className="subtitle">Both sides brought four. Ban one of the bot's fighters; the bot bans one of yours. The rest play.</p>
      <div className="panel">
        <div className="section-title">Your four</div>
        <p>{playerDraft.map(name).join(", ")}</p>
      </div>
      <div className="panel">
        <div className="section-title">The bot&rsquo;s four: choose one to ban</div>
        <div className="roster-grid" role="list">
          {plan.botDraft.map((id) => (
            <button key={id} type="button" role="listitem" className={`roster-card${chosen === id ? " picked" : ""}`} aria-pressed={chosen === id} onClick={() => setChosen(id)}>
              <Portrait characterId={id} displayName={shown(id)} size={56} />
              <span>Ban {shown(id)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="button-row">
        <button type="button" className="btn primary" disabled={!chosen} onClick={() => chosen && onBan(chosen)}>
          Confirm ban and start
        </button>
      </div>
    </div>
  );
}

/** Ranked: home, pick (and ban), match, result. */
/** Ranked opens at an account level (ADR-044); before that this explains how to get there. */
export function RankedScreen() {
  const { profile } = useProfile();
  const gate = rankedGate(profile);
  if (gate.locked) {
    return (
      <div>
        <h2 className="title small">Ranked</h2>
        <div className="panel" role="status">
          <div className="section-title">Ranked opens at level {gate.needLevel}</div>
          <p>
            You are level {gate.level}. Play {gate.xpToGo} more XP worth of matches, roughly {Math.max(1, Math.ceil(gate.xpToGo / 30))} win{Math.ceil(gate.xpToGo / 30) === 1 ? "" : "s"}, and the ladder unlocks. Missions and quests give extra XP.
          </p>
          <p className="hp-text">Ranked is the same game against a tougher opponent with a rating on the line. Use the wait to learn your team in normal matches.</p>
        </div>
      </div>
    );
  }
  return <RankedLadder />;
}

function RankedLadder() {
  const { profile, update, store, ready } = useProfile();
  const [flow, setFlow] = useState<Flow>({ name: "home" });
  const [notice, setNotice] = useState<string | undefined>();
  const [draft, setDraft] = useState<string[]>([]);
  const ranked = profile.ranked;
  const settled = useRef(false);

  // Picking a team, banning, and the match itself are all one scroll container — without
  // this, opening the ban screen (say) from partway down a long roster left it opening
  // already scrolled down too.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [flow.name]);

  // On opening: enter the current season, and settle a match that was left unfinished as a loss.
  useEffect(() => {
    if (!ready || flow.name !== "home") return;
    const now = Date.now();
    const pending = forfeitUnfinished(ranked, now);
    if (pending) {
      update((p) => {
        const result = forfeitUnfinished(p.ranked, now);
        return result ? { ...p, ranked: result.ranked } : p;
      });
      if (!settled.current) setNotice("A ranked match was left unfinished, so it counted as a loss.");
      settled.current = true;
      return;
    }
    const rolled = rollSeason(ranked, now);
    if (rolled.ranked !== ranked) {
      update((p) => ({ ...p, ranked: rollSeason(p.ranked, now).ranked }));
      if (rolled.rolledOver) setNotice("A new season has begun. Your rating carried over halfway, and you play placement matches again.");
    }
  }, [ready, flow.name, ranked, update]);

  if (flow.name === "home") {
    return <RankedHome ranked={ranked} notice={notice} onPlay={() => {
          setDraft([]);
          setNotice(undefined);
          setFlow({ name: "pick", plan: planRankedMatch(ranked, Date.now()) });
        }}
      />;
  }

  if (flow.name === "pick") {
    const { plan } = flow;
    const size = plan.pickBan ? 4 : TEAM_SIZE;
    return (
      <div>
        <h2 className="title small">Choose your {plan.pickBan ? "four" : "team"}</h2>
        <p className="subtitle">
          {plan.pickBan ? "Pick four: you will ban one of the bot's, and it will ban one of yours. " : ""}
          Your opponent is a {BOT_NAMES[plan.botLevel] ?? plan.botLevel} bot. Only fighters you have unlocked are available.
        </p>
        <TeamPicker label="Your team" picked={draft} onChange={setDraft} size={size} realUnlocksOnly />
        <div className="button-row">
          <button type="button" className="btn" onClick={() => setFlow({ name: "home" })}>
            Back
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={draft.length !== size}
            onClick={() => {
              if (plan.pickBan) setFlow({ name: "ban", plan, playerDraft: draft });
              else begin(plan, settleTeams(plan, draft));
            }}
          >
            {plan.pickBan ? "Lock in" : "Start ranked match"}
          </button>
        </div>
      </div>
    );
  }

  function begin(plan: RankedPlan, teams: RankedTeams) {
    // Saved before the first move: leaving or closing now counts as a loss.
    update((p) => ({
      ...p,
      ranked: beginRankedMatch(p.ranked, { id: `p-${plan.seed.toString(36)}`, at: Date.now(), opponentRating: plan.opponentRating, botLevel: plan.botLevel, team: teams.teamAIds, foe: teams.teamBIds }, Date.now()),
    }), { milestone: true });
    setFlow({ name: "match", plan, teams });
  }

  if (flow.name === "ban") {
    const { plan, playerDraft } = flow;
    return <BanScreen plan={plan} playerDraft={playerDraft} onBan={(id) => begin(plan, settleTeams(plan, playerDraft, id))} />;
  }

  if (flow.name === "match") {
    const { plan, teams } = flow;
    return (
      <div>
        {teams.banned !== undefined && (
          <p className="hp-text" role="status">
            Bans: you removed {name(teams.playerBanned ?? "")}; the bot removed {name(teams.banned)}.
          </p>
        )}
        <MatchScreen
          mode="bot"
          botLevel={plan.botLevel}
          teamAIds={teams.teamAIds}
          teamBIds={teams.teamBIds}
          seed={plan.seed}
          onMatchOver={(outcome) => {
            const done = finishMatch(
              profile,
              { mode: "ranked", ranked: { opponentRating: plan.opponentRating, botLevel: plan.botLevel }, teamAIds: teams.teamAIds, teamBIds: teams.teamBIds, seed: plan.seed },
              outcome,
              Date.now(),
            );
            update(() => done.profile, { milestone: true });
            if (done.replay) void saveReplay(store, done.replay).catch(() => undefined);
            if (!done.rankedChange) return;
            setFlow({
              name: "result",
              outcome,
              plan,
              teams,
              change: done.rankedChange,
              revealed: done.report.revealed.map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id),
              report: done.report,
            });
          }}
        />
      </div>
    );
  }

  return (
    <ResultScreen
      outcome={flow.outcome}
      revealed={flow.revealed}
      report={flow.report}
      extra={<ChangeCard change={flow.change} plan={flow.plan} />}
      playAgainLabel="Play another ranked match"
      onPlayAgain={() => {
        setDraft([]);
        setFlow({ name: "pick", plan: planRankedMatch(profile.ranked, Date.now()) });
      }}
      onHome={() => setFlow({ name: "home" })}
    />
  );
}
