import { useMemo, useState } from "react";
import { PICKABLE_CHARACTERS } from "../game/roster";
import { filterCharacters, filterOptions, NO_FILTERS, type CharacterFilters } from "../game/filters";
import { characterVisibility } from "../game/knowledge";
import { ringFor } from "../game/rewards";
import { unlockHint } from "../game/quests";
import { useProfile } from "../profile/ProfileContext";
import { CharacterFilterBar } from "./CharacterFilterBar";
import { CharacterSheet } from "./CharacterSheet";
import { Icon } from "./Icon";
import { Portrait } from "./Portrait";

// Shared by CHARACTERS (a roster to browse and favorite) and CODEX (the same
// list with the fuller, knowledge-gated entry). Secrets appear as silhouettes
// until met; a TRUE_SECRET is absent entirely (filterCharacters drops it).
export function CharacterBrowser({ mode, idPrefix }: { mode: "roster" | "codex"; idPrefix: string }) {
  const { profile, update } = useProfile();
  const [filters, setFilters] = useState<CharacterFilters>(NO_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const options = useMemo(() => filterOptions(PICKABLE_CHARACTERS, profile), [profile]);
  const visible = useMemo(() => filterCharacters(PICKABLE_CHARACTERS, filters, profile), [filters, profile]);
  const selected = visible.find((c) => c.id === selectedId) ?? visible[0];

  const seenCount = PICKABLE_CHARACTERS.filter((c) => characterVisibility(c, profile) === "full").length;

  return (
    <div>
      {mode === "codex" && (
        <p className="hp-text">
          {seenCount} of {PICKABLE_CHARACTERS.length} entries revealed. Entries open up as you meet fighters and see their abilities in your own matches.
        </p>
      )}
      <CharacterFilterBar filters={filters} options={options} onChange={setFilters} idPrefix={idPrefix} />
      <div className="browser">
        <ul className="browser-list" aria-label="Characters">
          {visible.length === 0 && <li className="hp-text">No characters match these filters.</li>}
          {visible.map((c) => {
            const locked = characterVisibility(c, profile) !== "full";
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={`browser-item${selected?.id === c.id ? " selected" : ""}`}
                  aria-current={selected?.id === c.id ? "true" : undefined}
                  onClick={() => setSelectedId(c.id)}
                >
                  {locked ? (
                    <span className="portrait silhouette" aria-hidden="true">
                      <Icon name="lock" size={16} />
                    </span>
                  ) : (
                    <Portrait characterId={c.id} displayName={c.displayName} size={36} ring={ringFor(profile, c.id)} />
                  )}
                  <span>{locked ? "Unknown fighter" : c.displayName}</span>
                  {!locked && profile.favorites.includes(c.id) && <Icon name="star" size={14} />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="browser-detail">
          {selected &&
            (characterVisibility(selected, profile) === "full" ? (
              <CharacterSheet
                character={selected}
                profile={profile}
                mode={mode}
                isFavorite={profile.favorites.includes(selected.id)}
                onToggleFavorite={() =>
                  update((p) => ({
                    ...p,
                    favorites: p.favorites.includes(selected.id) ? p.favorites.filter((id) => id !== selected.id) : [...p.favorites, selected.id],
                  }))
                }
              />
            ) : (
              <article className="sheet">
                <h3 className="sheet-name">Unknown fighter</h3>
                <p>{unlockHint(selected, profile)}</p>
                <p className="hp-text">Nothing else is known yet.</p>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
