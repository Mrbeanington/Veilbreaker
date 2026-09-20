import { useMemo, useState } from "react";
import { PICKABLE_CHARACTERS, TEAM_SIZE } from "../game/roster";
import { filterCharacters, filterOptions, NO_FILTERS, type CharacterFilters } from "../game/filters";
import { characterVisibility, isUnlocked } from "../game/knowledge";
import { lockedHint } from "../game/quests";
import { useProfile } from "../profile/ProfileContext";
import { CharacterFilterBar } from "./CharacterFilterBar";
import { Icon } from "./Icon";
import { Portrait } from "./Portrait";

interface TeamPickerProps {
  label: string;
  picked: string[];
  onChange: (picked: string[]) => void;
  /** Saved presets can fill the team in one click. */
  showPresets?: boolean;
  /** Friend matches with the "everything unlocked" rule: every fighter can be picked. */
  everythingUnlocked?: boolean;
  /** How many to pick (a ranked draft at high divisions is four: a team of three plus a spare for the ban). */
  size?: number;
  /** Ranked: the Reveal-every-character spoiler switch must not unlock Legends or bypass mystery. */
  realUnlocksOnly?: boolean;
}

// phase-05 "Team picker limited to the implemented roster, with duplicates
// disallowed" — spec/03 OQ-15: no duplicates *within* one team; a mirror across
// teams is fine. Phase 08 adds the full filter bar, favorites, presets and
// hidden/locked characters (spec/05 "Secret characters should create mystery").
export function TeamPicker({ label, picked, onChange, showPresets = true, everythingUnlocked = false, size = TEAM_SIZE, realUnlocksOnly = false }: TeamPickerProps) {
  const { profile: saved, update } = useProfile();
  const profile = useMemo(() => {
    if (everythingUnlocked) return { ...saved, settings: { ...saved.settings, showAllCharacters: true } };
    if (realUnlocksOnly) return { ...saved, settings: { ...saved.settings, showAllCharacters: false } };
    return saved;
  }, [saved, everythingUnlocked, realUnlocksOnly]);
  const [filters, setFilters] = useState<CharacterFilters>(NO_FILTERS);
  const idPrefix = useMemo(() => `picker-${label.replace(/\W+/g, "-").toLowerCase()}`, [label]);
  const options = useMemo(() => filterOptions(PICKABLE_CHARACTERS, profile), [profile]);
  const visible = useMemo(() => filterCharacters(PICKABLE_CHARACTERS, filters, profile), [filters, profile]);

  function toggle(characterId: string) {
    if (picked.includes(characterId)) onChange(picked.filter((id) => id !== characterId));
    else if (picked.length < size) onChange([...picked, characterId]);
  }

  function toggleFavorite(characterId: string) {
    update((p) => ({
      ...p,
      favorites: p.favorites.includes(characterId) ? p.favorites.filter((id) => id !== characterId) : [...p.favorites, characterId],
    }));
  }

  return (
    <div className="panel">
      <div className="section-title">
        {label} ({picked.length}/{size})
      </div>
      {showPresets && profile.presets.length > 0 && (
        <div className="preset-row">
          <label htmlFor={`${idPrefix}-preset`}>Team preset</label>{" "}
          <select
            id={`${idPrefix}-preset`}
            value=""
            onChange={(e) => {
              const preset = profile.presets.find((p) => p.id === e.target.value);
              if (preset) onChange(preset.characterIds.filter((id) => PICKABLE_CHARACTERS.some((c) => c.id === id)).slice(0, size));
            }}
          >
            <option value="">Load a preset…</option>
            {profile.presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <CharacterFilterBar filters={filters} options={options} onChange={setFilters} idPrefix={idPrefix} />
      <div className="roster-grid" role="list">
        {visible.length === 0 && <p className="hp-text">No characters match these filters.</p>}
        {visible.map((character) => {
          const locked = characterVisibility(character, profile) !== "full";
          const legendLocked = !isUnlocked(character, profile);
          const isPicked = picked.includes(character.id);
          const isFavorite = profile.favorites.includes(character.id);
          if (locked) {
            return (
              <div key={character.id} role="listitem" className="roster-card locked">
                <span className="portrait silhouette" aria-hidden="true">
                  <Icon name="lock" size={22} />
                </span>
                <span>Unknown fighter</span>
                <span className="hp-text">Meet them in a match to learn more</span>
              </div>
            );
          }
          if (legendLocked) {
            return (
              <div key={character.id} role="listitem" className="roster-card locked">
                <Portrait characterId={character.id} displayName={character.displayName} size={56} />
                <span>{character.displayName}</span>
                <span className="hp-text">{lockedHint(character, profile)}</span>
              </div>
            );
          }
          return (
            <div key={character.id} role="listitem" className="roster-item">
              <button
                type="button"
                className={`roster-card${isPicked ? " picked" : ""}`}
                onClick={() => toggle(character.id)}
                disabled={!isPicked && picked.length >= size}
                aria-pressed={isPicked}
              >
                <Portrait characterId={character.id} displayName={character.displayName} size={56} />
                <span>{character.displayName}</span>
              </button>
              <button
                type="button"
                className={`fav-btn${isFavorite ? " on" : ""}`}
                aria-pressed={isFavorite}
                aria-label={`${isFavorite ? "Remove" : "Add"} ${character.displayName} ${isFavorite ? "from" : "to"} favorites`}
                onClick={() => toggleFavorite(character.id)}
              >
                <Icon name="star" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
