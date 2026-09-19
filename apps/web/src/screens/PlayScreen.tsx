import { GAME_TITLE } from "@veilbreak/content";
import { Icon } from "../components/Icon";

interface PlayScreenProps {
  onStart: (mode: "hotseat" | "bot" | "trials" | "replays") => void;
}

// spec/05: PLAY offers Vs. AI, PvE/Trials, Local Hotseat, Friend Match and
// Replays. Hotseat and Vs. AI work today; the others are visible so players
// know they are coming, but are honestly marked as not available yet.
export function PlayScreen({ onStart }: PlayScreenProps) {
  return (
    <div>
      <h1 className="title">{GAME_TITLE}</h1>
      <p className="subtitle">A 3v3 turn-based arena. No account, no download, and no network needed to play.</p>

      <div className="mode-grid">
        <button type="button" className="mode-card" onClick={() => onStart("bot")}>
          <Icon name="play" size={22} />
          <strong>Vs. AI</strong>
          <span>Face a bot. Choose its skill in Settings.</span>
        </button>
        <button type="button" className="mode-card" onClick={() => onStart("hotseat")}>
          <Icon name="teams" size={22} />
          <strong>Local Hotseat</strong>
          <span>Two players, one device.</span>
        </button>
        <button type="button" className="mode-card" onClick={() => onStart("trials")}>
          <Icon name="legends" size={22} />
          <strong>Legend Trials</strong>
          <span>Beat a Legend to unlock it for your teams.</span>
        </button>
        <button type="button" className="mode-card" onClick={() => onStart("replays")}>
          <Icon name="clock" size={22} />
          <strong>Replays</strong>
          <span>Watch a finished match again.</span>
        </button>
        {[
          ["Friend Match", "Play a friend with a shared code."],
          ["Ranked ladder", "Climb divisions against bots."],
        ].map(([title, text]) => (
          <div key={title} className="mode-card unavailable" aria-disabled="true">
            <Icon name="lock" size={22} />
            <strong>{title}</strong>
            <span>{text} Coming later.</span>
          </div>
        ))}
      </div>
    </div>
  );
}
