import { CHARACTER_LIBRARY } from "@veilbreak/content";
import { levelForXp, type Profile } from "@veilbreak/persistence";
import { ACHIEVEMENTS, MISSIONS, type MissionDef } from "../game/progression";
import { QUESTS, questStatus } from "../game/quests";
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

/** ADR-038: what to do to unlock each fighter beyond the starters. */
function QuestsPanel({ profile }: { profile: Profile }) {
  if (profile.unlocks.model < 2) return null;
  const done = new Set(profile.missions.completed);
  const level = levelForXp(profile.xp);
  const all = Object.values(QUESTS)
    .map((quest) => ({ quest, status: questStatus(profile, quest.characterId)! }))
    .sort((a, b) => a.quest.level - b.quest.level || (CHARACTER_LIBRARY[a.quest.characterId]?.displayName ?? "").localeCompare(CHARACTER_LIBRARY[b.quest.characterId]?.displayName ?? ""));
  const owned = (id: string) => profile.unlocks.fighters.includes(id) || profile.unlocks.legends.includes(id);
  const active = all.filter(({ quest, status }) => status.open && !owned(quest.characterId));
  const waiting = all.filter(({ quest, status }) => !status.levelOk && !owned(quest.characterId) && !(quest.kind === "secret" && !profile.discovered.characters.includes(quest.characterId)));
  const unmetSecrets = all.filter(({ quest }) => quest.kind === "secret" && !profile.discovered.characters.includes(quest.characterId) && !owned(quest.characterId)).length;
  const nextLevel = waiting.length > 0 ? Math.min(...waiting.map((w) => w.quest.level)) : null;
  const unlocked = all.filter(({ quest }) => owned(quest.characterId)).length;

  return (
    <div className="panel">
      <div className="section-title">Unlock quests</div>
      <p className="hp-text">
        New fighters are earned. Finish a fighter&rsquo;s quest to unlock it. Legends also need their trial. You are level {level}; {unlocked} of {all.length} fighters unlocked so far.
      </p>
      {active.length === 0 && <p className="hp-text">No quests are open right now.{nextLevel ? ` More open at level ${nextLevel}.` : ""}</p>}
      {active.map(({ quest, status }) => {
        const fighter = CHARACTER_LIBRARY[quest.characterId];
        return (
          <details key={quest.characterId} className="quest">
            <summary>
              <strong>{fighter?.displayName ?? quest.characterId}</strong>{" "}
              <span className="hp-text">
                {quest.kind === "legend" ? "Legend · " : quest.kind === "secret" ? "Secret · " : ""}
                {status.stepsDone} of {quest.steps.length} steps{quest.kind === "legend" && status.complete ? " · win its trial" : ""}
              </span>
            </summary>
            <ul className="mission-list">
              {quest.steps.map((step) => (
                <MissionRow key={step.id} mission={step} progress={profile.missions.progress[step.id] ?? 0} done={done.has(step.id)} />
              ))}
            </ul>
          </details>
        );
      })}
      {nextLevel && <p className="hp-text">{waiting.length} more fighter{waiting.length === 1 ? "" : "s"} start their quests from level {nextLevel}.</p>}
      {unmetSecrets > 0 && <p className="hp-text">{unmetSecrets} secret fighter{unmetSecrets === 1 ? "" : "s"} will show a quest here once you meet them in a match.</p>}
    </div>
  );
}

// spec/06 "Progression": missions, faction challenge chains, and secret
// achievements. Achievements stay cryptic until earned.
export function MissionsScreen() {
  const { profile } = useProfile();
  const done = new Set(profile.missions.completed);
  const general = MISSIONS.filter((m) => !m.faction && !m.unlocks);
  const factions = [...new Set(MISSIONS.filter((m) => m.faction).map((m) => m.faction as string))];

  return (
    <div>
      <h2 className="title small">Missions</h2>
      <p className="subtitle">Goals that reward you for trying new fighters and teams. Nothing here can be bought.</p>

      <QuestsPanel profile={profile} />

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
