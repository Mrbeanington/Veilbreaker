import type { MatchOutcome } from "./MatchScreen";

interface ResultScreenProps {
  outcome: MatchOutcome;
  /** Names of fighters the player met for the first time in this match. */
  revealed?: string[];
  onPlayAgain: () => void;
  onHome: () => void;
}

const PLAYER_LABELS: Record<string, string> = { playerA: "Player 1", playerB: "Player 2" };

export function ResultScreen({ outcome, revealed = [], onPlayAgain, onHome }: ResultScreenProps) {
  const headline =
    outcome.result === "draw"
      ? "Draw!"
      : `${outcome.winnerPlayerId ? PLAYER_LABELS[outcome.winnerPlayerId] ?? outcome.winnerPlayerId : "Someone"} wins!`;

  return (
    <div className="panel" style={{ textAlign: "center", padding: 48 }}>
      <h2 className="title">{headline}</h2>
      {revealed.length > 0 && (
        <p role="status">New in your Codex: {revealed.join(", ")}.</p>
      )}
      <div className="button-row" style={{ justifyContent: "center", marginTop: 20 }}>
        <button type="button" className="btn primary" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="btn" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}
