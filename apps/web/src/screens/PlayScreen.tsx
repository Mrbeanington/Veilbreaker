import { GAME_TITLE } from "@veilbreak/content";
import { Icon } from "../components/Icon";

interface PlayScreenProps {
  onStart: (mode: "hotseat" | "bot" | "trials" | "replays" | "friend" | "ranked" | "tutorial") => void;
  /** A brand-new player is offered the tutorial first (ADR-039). */
  showTutorialPitch?: boolean;
  onSkipTutorial?: () => void;
}

// spec/05: PLAY offers Vs. AI, PvE/Trials, Local Hotseat, Friend Match and
// Replays, and the Ranked ladder is one tap away too.
export function PlayScreen({ onStart, showTutorialPitch = false, onSkipTutorial }: PlayScreenProps) {
  return (
    <div>
      <h1 className="title">{GAME_TITLE}</h1>
      <p className="subtitle">A 3v3 turn-based arena. No account, no download, and no network needed to play.</p>

      {showTutorialPitch && (
        <div className="banner" role="region" aria-label="New here?">
          <span>New here? Play a short guided match and learn the game in about five minutes.</span>
          <button type="button" className="btn primary" onClick={() => onStart("tutorial")}>
            Start the tutorial
          </button>
          <button type="button" className="btn" onClick={onSkipTutorial}>
            I know how to play
          </button>
        </div>
      )}

      <div className="mode-grid">
        <button type="button" className="mode-card" onClick={() => onStart("bot")}>
          <Icon name="play" size={22} />
          <strong>Vs. AI</strong>
          <span>Face a bot. Choose its skill in Settings.</span>
        </button>
        <button type="button" className="mode-card" onClick={() => onStart("tutorial")}>
          <Icon name="question" size={22} />
          <strong>How to play</strong>
          <span>A guided practice match against an easy bot.</span>
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
        <button type="button" className="mode-card" onClick={() => onStart("friend")}>
          <Icon name="teams" size={22} />
          <strong>Friend Match</strong>
          <span>Play a friend with codes, no server.</span>
        </button>
        <button type="button" className="mode-card" onClick={() => onStart("ranked")}>
          <Icon name="ranked" size={22} />
          <strong>Ranked Ladder</strong>
          <span>Climb divisions against bots.</span>
        </button>
      </div>
    </div>
  );
}
