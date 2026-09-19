import { ACHIEVEMENTS, MISSIONS, type MissionDef } from "../game/progression";
import { useProfile } from "../profile/ProfileContext";
import { Icon } from "../components/Icon";

function MissionRow({ mission, progress, done }: { mission: MissionDef; progress: number; done: boolean }) {
  const percent = Math.min(100, Math.round((progress / mission.goal) * 100));
  return (
    <li className={`mission${done ? " done" : ""}`}>
      <div>
        <strong>{mission.title}</strong> {done && <span className="tag">Done</span>}
        <div className="hp-text">{mission.description}</div>
      </div>
      <div className="mission-meter">
        <div className="hp-bar-track" aria-hidden="true">
          <div className="hp-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="hp-text">
          {done ? "Complete" : `${progress} / ${mission.goal}`} · +{mission.xp} xp
        </span>
      </div>
    </li>
  );
}

// spec/06 "Progression": missions, faction challenge chains, and secret
// achievements. Achievements stay cryptic until earned.
export function MissionsScreen() {
  const { profile } = useProfile();
  const done = new Set(profile.missions.completed);
  const general = MISSIONS.filter((m) => !m.faction);
  const factions = [...new Set(MISSIONS.filter((m) => m.faction).map((m) => m.faction as string))];

  return (
    <div>
      <h2 className="title small">Missions</h2>
      <p className="subtitle">Goals that reward you for trying new fighters and teams. Nothing here can be bought.</p>

      <div className="panel">
        <div className="section-title">Missions</div>
        <ul className="mission-list">
          {general.map((m) => (
            <MissionRow key={m.id} mission={m} progress={profile.missions.progress[m.id] ?? 0} done={done.has(m.id)} />
          ))}
        </ul>
      </div>

      <div className="panel">
        <div className="section-title">Faction challenges</div>
        <p className="hp-text">Win with two or more fighters from one part of the world.</p>
        {factions.map((faction) => (
          <div key={faction}>
            <h3 className="sheet-section">{faction}</h3>
            <ul className="mission-list">
              {MISSIONS.filter((m) => m.faction === faction).map((m) => (
                <MissionRow key={m.id} mission={m} progress={profile.missions.progress[m.id] ?? 0} done={done.has(m.id)} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="section-title">
          Secret achievements ({profile.achievements.length} of {ACHIEVEMENTS.length})
        </div>
        <ul className="mission-list">
          {ACHIEVEMENTS.map((a) => {
            const earned = profile.achievements.includes(a.id);
            return (
              <li key={a.id} className={`mission${earned ? " done" : ""}`}>
                <div>
                  <strong>{earned ? a.title : "???"}</strong> {earned && <span className="tag">Earned</span>}
                  <div className="hp-text">
                    {!earned && <Icon name="question" size={14} />} {a.hint}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
