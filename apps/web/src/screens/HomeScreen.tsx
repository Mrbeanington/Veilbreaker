import { GAME_TITLE } from "@veilbreak/content";
import { useSettings, type AnimationSpeed } from "../settings/SettingsContext";

interface HomeScreenProps {
  onStart: (mode: "hotseat" | "bot") => void;
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const { animationSpeed, setAnimationSpeed, turnTimerEnabled, setTurnTimerEnabled } = useSettings();

  return (
    <div>
      <h1 className="title">{GAME_TITLE}</h1>
      <p className="subtitle">A client-only 3v3 turn-based arena. No account, no download, no network required to play.</p>

      <div className="panel">
        <div className="section-title">Play</div>
        <div className="button-row">
          <button type="button" className="btn primary" onClick={() => onStart("hotseat")}>
            Local Hotseat (2 players)
          </button>
          <button type="button" className="btn primary" onClick={() => onStart("bot")}>
            Vs. Bot
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="section-title">Settings</div>
        <label htmlFor="animation-speed">Animation speed</label>{" "}
        <select
          id="animation-speed"
          value={animationSpeed}
          onChange={(event) => setAnimationSpeed(event.target.value as AnimationSpeed)}
        >
          <option value="instant">Instant</option>
          <option value="normal">Normal</option>
          <option value="slow">Slow</option>
        </select>
        <p className="hp-text">Reduced motion is honored automatically from your system settings.</p>
        <label>
          <input type="checkbox" checked={turnTimerEnabled} onChange={(event) => setTurnTimerEnabled(event.target.checked)} /> Turn
          timer
        </label>
      </div>
    </div>
  );
}
