import type { ReactNode } from "react";
import type { MatchOutcome } from "./MatchScreen";
import { CHARACTER_LIBRARY } from "@veilbreak/content";
import { achievementById, missionById, type ProgressReport } from "../game/progression";

interface ResultScreenProps {
  outcome: MatchOutcome;
  /** Names of fighters the player met for the first time in this match. */
  revealed?: string[];
  report?: ProgressReport;
  /** Extra result panels (the ranked ladder's rating change). */
  extra?: ReactNode;
  playAgainLabel?: string;
  onPlayAgain: () => void;
  onHome: () => void;
}

const PLAYER_LABELS: Record<string, string> = { playerA: "Player 1", playerB: "Player 2" };

export function ResultScreen({ outcome, revealed = [], report, extra, playAgainLabel = "Play again", onPlayAgain, onHome }: ResultScreenProps) {
  const headline =
    outcome.result === "draw"
      ? "Draw!"
      : `${outcome.winnerPlayerId ? PLAYER_LABELS[outcome.winnerPlayerId] ?? outcome.winnerPlayerId : "Someone"} wins!`;

  return (
    <div className="panel" style={{ textAlign: "center", padding: 48 }}>
      <h2 className="title">{headline}</h2>
      {report && (
        <div role="status" className="result-report">
          <p>
            +{report.xpGained} xp
            {report.levelAfter > report.levelBefore ? ` · Level up! You are now level ${report.levelAfter}.` : ` · Level ${report.levelAfter}`}
          </p>
          {report.legendUnlocked && <p><strong>Legend unlocked: {CHARACTER_LIBRARY[report.legendUnlocked]?.displayName ?? report.legendUnlocked}!</strong></p>}
          {report.fightersUnlocked.length > 0 && <p><strong>Fighter unlocked: {report.fightersUnlocked.map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id).join(", ")}!</strong></p>}
          {report.missionsCompleted.length > 0 && <p>Missions complete: {report.missionsCompleted.map((id) => missionById(id)?.title ?? id).join(", ")}.</p>}
          {report.achievements.length > 0 && <p>Secret achievement{report.achievements.length === 1 ? "" : "s"}: {report.achievements.map((id) => achievementById(id)?.title ?? id).join(", ")}.</p>}
        </div>
      )}
      {extra}
      {revealed.length > 0 && (
        <p role="status">New in your Codex: {revealed.join(", ")}.</p>
      )}
      <div className="button-row" style={{ justifyContent: "center", marginTop: 20 }}>
        <button type="button" className="btn primary" onClick={onPlayAgain}>
          {playAgainLabel}
        </button>
        <button type="button" className="btn" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}
