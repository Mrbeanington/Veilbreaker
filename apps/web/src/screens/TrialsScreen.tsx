import { CHARACTER_LIBRARY } from "@veilbreak/content";
import { Icon } from "../components/Icon";
import { isDiscovered } from "../game/knowledge";
import { LEGEND_TRIALS, legendUnlocked, trialAvailable, type LegendTrial } from "../game/progression";
import { useProfile } from "../profile/ProfileContext";

interface TrialsScreenProps {
  onStart: (trial: LegendTrial) => void;
  onBack: () => void;
}

// spec/06 "Legend unlocks" and PvE: a Legend is an accomplishment. Beat its
// trial (your team against the Legend and two allies, played by the boss AI)
// and it is yours. The Nameless One's boss encounter stays sealed until every
// other Legend is unlocked.
export function TrialsScreen({ onStart, onBack }: TrialsScreenProps) {
  const { profile } = useProfile();
  return (
    <div>
      <h2 className="title small">Legend trials</h2>
      <p className="subtitle">Win a trial to unlock its Legend for your teams. You choose your own three fighters.</p>
      <div className="mode-grid">
        {LEGEND_TRIALS.map((trial) => {
          const legend = CHARACTER_LIBRARY[trial.legendId];
          const available = trialAvailable(profile, trial);
          const unlocked = legendUnlocked(profile, trial.legendId) || profile.trialsWon.includes(trial.id);
          const known = isDiscovered(profile, trial.legendId) || profile.settings.showAllCharacters;
          const isBoss = trial.legendId === "the-nameless-one";
          const title = !available ? "???" : known && legend ? legend.displayName : "A hidden Legend";
          return (
            <div key={trial.id} className={`mode-card${available ? "" : " unavailable"}`}>
              <Icon name={unlocked ? "legends" : available ? "sword" : "lock"} size={22} />
              <strong>{isBoss && available ? "Boss encounter" : "Trial"}: {title}</strong>
              <span>{unlocked ? "Won. This Legend is unlocked." : available ? "Three fighters against a Legend and two allies." : "Sealed until every other Legend is unlocked."}</span>
              {available && (
                <button type="button" className="btn primary" onClick={() => onStart(trial)}>
                  {unlocked ? "Play again" : "Begin trial"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="button-row" style={{ marginTop: 16 }}>
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
