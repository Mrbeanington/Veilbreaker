import { useState } from "react";
import { TeamPicker } from "../components/TeamPicker";
import { PICKABLE_CHARACTERS, TEAM_SIZE } from "../game/roster";

interface SetupScreenProps {
  mode: "hotseat" | "bot";
  onReady: (teamAIds: string[], teamBIds: string[]) => void;
  onBack: () => void;
}

function randomTeam(exclude: string[], pool: { id: string }[]): string[] {
  const available = pool.filter((c) => !exclude.includes(c.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TEAM_SIZE).map((c) => c.id);
}

export function SetupScreen({ mode, onReady, onBack }: SetupScreenProps) {
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);

  const teamAReady = teamA.length === TEAM_SIZE;
  const teamBReady = mode === "bot" || teamB.length === TEAM_SIZE;

  function handleContinue() {
    onReady(teamA, mode === "bot" ? randomTeam(teamA, PICKABLE_CHARACTERS) : teamB);
  }

  return (
    <div>
      <h2 className="title" style={{ fontSize: "1.6rem" }}>
        Choose your team{mode === "hotseat" ? "s" : ""}
      </h2>
      <p className="subtitle">Pick exactly {TEAM_SIZE} characters. The same character may appear on both sides.</p>

      <TeamPicker label="Player 1" picked={teamA} onChange={setTeamA} />
      {mode === "hotseat" && <TeamPicker label="Player 2" picked={teamB} onChange={setTeamB} />}

      <div className="button-row">
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn primary" disabled={!teamAReady || !teamBReady} onClick={handleContinue}>
          Start match
        </button>
      </div>
    </div>
  );
}
