import { useState } from "react";
import { ScreenBar } from "../components/ScreenBar";
import { TeamPicker } from "../components/TeamPicker";
import { PICKABLE_CHARACTERS, TEAM_SIZE } from "../game/roster";

interface SetupScreenProps {
  mode: "hotseat" | "bot";
  /** A fixed opposing team (a Legend trial): the player only chooses their own. */
  opponentIds?: readonly string[];
  title?: string;
  onReady: (teamAIds: string[], teamBIds: string[]) => void;
  onBack: () => void;
}

function randomTeam(exclude: string[], pool: { id: string }[]): string[] {
  const available = pool.filter((c) => !exclude.includes(c.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TEAM_SIZE).map((c) => c.id);
}

export function SetupScreen({ mode, opponentIds, title, onReady, onBack }: SetupScreenProps) {
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);

  const teamAReady = teamA.length === TEAM_SIZE;
  const teamBReady = mode === "bot" || opponentIds !== undefined || teamB.length === TEAM_SIZE;

  function handleContinue() {
    onReady(teamA, opponentIds ? [...opponentIds] : mode === "bot" ? randomTeam(teamA, PICKABLE_CHARACTERS) : teamB);
  }

  return (
    <div>
      <ScreenBar
        onBack={onBack}
        status={`${teamA.length} of ${TEAM_SIZE} picked${mode === "hotseat" ? ` · ${teamB.length} of ${TEAM_SIZE}` : ""}`}
        action={{ label: "Start match", onClick: handleContinue, disabled: !teamAReady || !teamBReady }}
      />
      <h2 className="title" style={{ fontSize: "1.6rem" }}>
        {title ?? `Choose your team${mode === "hotseat" ? "s" : ""}`}
      </h2>
      <p className="subtitle">Pick exactly {TEAM_SIZE} characters. The same character may appear on both sides.</p>

      <TeamPicker label="Player 1" picked={teamA} onChange={setTeamA} />
      {mode === "hotseat" && <TeamPicker label="Player 2" picked={teamB} onChange={setTeamB} />}

    </div>
  );
}
