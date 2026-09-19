import { useEffect, useMemo, useState } from "react";
import { listReplays, type ReplayRecord } from "@veilbreak/persistence";
import { abilityName, abilityStats, characterName, historyStats, percent, transformationName, type Tally } from "../game/stats";
import { useProfile } from "../profile/ProfileContext";

const TOP = 5;

function TallyList({ rows, label, empty }: { rows: Tally[]; label: (id: string) => string; empty: string }) {
  if (rows.length === 0) return <p className="hp-text">{empty}</p>;
  return (
    <ul className="preset-list">
      {rows.slice(0, TOP).map((r) => (
        <li key={r.id}>
          <span>
            {label(r.id)}: {r.won} of {r.played} won ({percent(r.won, r.played)}%)
          </span>
        </li>
      ))}
    </ul>
  );
}

// spec/06 "Analytics (local only)": personal stats from the player's own
// history. The last 50 matches are kept in the profile, and the abilities and
// transformations come from the newest stored replays.
export function StatsPanel() {
  const { profile, store } = useProfile();
  const [replays, setReplays] = useState<ReplayRecord[]>([]);
  useEffect(() => {
    let live = true;
    void listReplays(store).then((r) => live && setReplays(r)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [store, profile.history.length]);

  const stats = useMemo(() => historyStats(profile.history), [profile.history]);
  const extra = useMemo(() => abilityStats(profile.history, replays), [profile.history, replays]);

  return (
    <div className="panel">
      <div className="section-title">Your stats</div>
      {stats.matches === 0 ? (
        <p className="hp-text">Play a match against a bot or a friend and your stats will appear here. They are worked out on this device from your own matches; nothing is sent anywhere.</p>
      ) : (
        <>
          <p>
            Last {stats.matches} match{stats.matches === 1 ? "" : "es"}: {stats.wins} won, {stats.losses} lost{stats.draws ? `, ${stats.draws} drawn` : ""} ({percent(stats.wins, stats.matches)}% won). Local hotseat games are not counted.
          </p>
          <h3 className="section-title">Best and most used fighters</h3>
          <TallyList rows={stats.byCharacter} label={characterName} empty="No fighters yet." />
          <h3 className="section-title">Your teams</h3>
          <TallyList rows={stats.byTeam} label={(id) => id.split("|").map(characterName).join(", ")} empty="No teams yet." />
          <h3 className="section-title">Against these fighters</h3>
          <TallyList rows={stats.byOpponent} label={characterName} empty="No opponents yet." />
          <h3 className="section-title">Favourite abilities</h3>
          {extra.abilities.length === 0 ? (
            <p className="hp-text">Shown once you have a saved replay.</p>
          ) : (
            <ul className="preset-list">
              {extra.abilities.slice(0, TOP).map((a) => (
                <li key={a.id}>
                  <span>
                    {abilityName(a.id)}: used {a.uses} time{a.uses === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h3 className="section-title">Transformations</h3>
          {extra.transformations.length === 0 ? (
            <p className="hp-text">None yet in your saved replays.</p>
          ) : (
            <ul className="preset-list">
              {extra.transformations.map((t) => (
                <li key={t.id}>
                  <span>
                    {transformationName(t.id)}: {t.count} time{t.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="hp-text">Abilities and transformations are counted from your newest {extra.replaysRead} saved replay{extra.replaysRead === 1 ? "" : "s"}.</p>
        </>
      )}
    </div>
  );
}
