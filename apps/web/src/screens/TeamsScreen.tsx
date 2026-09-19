import { useState } from "react";
import { CHARACTER_LIBRARY } from "@veilbreak/content";
import { TeamPicker } from "../components/TeamPicker";
import { TEAM_SIZE } from "../game/roster";
import { useProfile } from "../profile/ProfileContext";

// spec/05 "team presets": named teams saved in the local profile and loadable
// from the team picker before a match.
export function TeamsScreen() {
  const { profile, update } = useProfile();
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const canSave = picked.length === TEAM_SIZE && name.trim().length > 0;

  function save() {
    if (!canSave) return;
    const preset = { id: `preset-${Date.now().toString(36)}`, name: name.trim().slice(0, 40), characterIds: picked };
    update((p) => ({ ...p, presets: [...p.presets, preset].slice(-24) }));
    setName("");
    setPicked([]);
  }

  return (
    <div>
      <h2 className="title small">Teams</h2>
      <p className="subtitle">Save favorite trios and load them in one click before a match.</p>

      <div className="panel">
        <div className="section-title">Saved teams</div>
        {profile.presets.length === 0 ? (
          <p className="hp-text">No saved teams yet.</p>
        ) : (
          <ul className="preset-list">
            {profile.presets.map((preset) => (
              <li key={preset.id}>
                <strong>{preset.name}</strong>: {preset.characterIds.map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id).join(", ")}
                <button
                  type="button"
                  className="btn"
                  aria-label={`Delete team ${preset.name}`}
                  onClick={() => update((p) => ({ ...p, presets: p.presets.filter((x) => x.id !== preset.id) }))}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TeamPicker label="New team" picked={picked} onChange={setPicked} showPresets={false} />
      <div className="panel">
        <label htmlFor="team-name">Team name</label>{" "}
        <input id="team-name" type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />{" "}
        <button type="button" className="btn primary" disabled={!canSave} onClick={save}>
          Save team
        </button>
      </div>
    </div>
  );
}
