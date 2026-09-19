import { PICKABLE_CHARACTERS, TEAM_SIZE } from "../game/roster";
import { Portrait } from "./Portrait";

interface TeamPickerProps {
  label: string;
  picked: string[];
  onChange: (picked: string[]) => void;
}

// phase-05-local-playable.md "Team picker limited to the implemented
// roster, with duplicates disallowed" — spec/03 OQ-15: no duplicates
// *within* one team; the same character on both sides (a mirror) is fine,
// so this component only prevents re-picking within its own `picked` list.
export function TeamPicker({ label, picked, onChange }: TeamPickerProps) {
  function toggle(characterId: string) {
    if (picked.includes(characterId)) {
      onChange(picked.filter((id) => id !== characterId));
    } else if (picked.length < TEAM_SIZE) {
      onChange([...picked, characterId]);
    }
  }

  return (
    <div className="panel">
      <div className="section-title">
        {label} ({picked.length}/{TEAM_SIZE})
      </div>
      <div className="roster-grid">
        {PICKABLE_CHARACTERS.map((character) => {
          const isPicked = picked.includes(character.id);
          const disabled = !isPicked && picked.length >= TEAM_SIZE;
          return (
            <button
              key={character.id}
              type="button"
              className={`roster-card${isPicked ? " picked" : ""}`}
              onClick={() => toggle(character.id)}
              disabled={disabled}
              aria-pressed={isPicked}
            >
              <Portrait characterId={character.id} displayName={character.displayName} size={56} />
              <span>{character.displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
