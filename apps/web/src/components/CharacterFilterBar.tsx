import type { CharacterFilters } from "../game/filters";
import { NO_FILTERS } from "../game/filters";

interface Options {
  roles: string[];
  origins: string[];
  rarities: string[];
}

interface CharacterFilterBarProps {
  filters: CharacterFilters;
  options: Options;
  onChange: (filters: CharacterFilters) => void;
  idPrefix: string;
}

// spec/05 "Character selection": search, role, origin, rarity, favorites,
// mastery, recently played, locked/unlocked. Every control is a native form
// control with a visible label, so it works with a keyboard and a screen reader.
export function CharacterFilterBar({ filters, options, onChange, idPrefix }: CharacterFilterBarProps) {
  const set = <K extends keyof CharacterFilters>(key: K, value: CharacterFilters[K]) => onChange({ ...filters, [key]: value });
  const id = (name: string) => `${idPrefix}-${name}`;
  const dirty = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  return (
    <form className="filter-bar" role="search" aria-label="Filter characters" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={id("search")}>
        Search
        <input id={id("search")} type="search" value={filters.search} onChange={(e) => set("search", e.target.value)} />
      </label>
      <label htmlFor={id("role")}>
        Role
        <select id={id("role")} value={filters.role} onChange={(e) => set("role", e.target.value)}>
          <option value="">Any</option>
          {options.roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={id("origin")}>
        Origin
        <select id={id("origin")} value={filters.origin} onChange={(e) => set("origin", e.target.value)}>
          <option value="">Any</option>
          {options.origins.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={id("rarity")}>
        Rarity
        <select id={id("rarity")} value={filters.rarity} onChange={(e) => set("rarity", e.target.value)}>
          <option value="">Any</option>
          {["CORE", "RARE", "SECRET", "LEGENDARY"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={id("mastery")}>
        Mastery
        <select id={id("mastery")} value={filters.minMastery} onChange={(e) => set("minMastery", Number(e.target.value))}>
          <option value={0}>Any</option>
          <option value={1}>Level 1+</option>
          <option value={3}>Level 3+</option>
          <option value={5}>Maxed</option>
        </select>
      </label>
      <label htmlFor={id("lock")}>
        Availability
        <select id={id("lock")} value={filters.lock} onChange={(e) => set("lock", e.target.value as CharacterFilters["lock"])}>
          <option value="all">All</option>
          <option value="unlocked">Unlocked</option>
          <option value="locked">Locked</option>
        </select>
      </label>
      <label className="check">
        <input type="checkbox" checked={filters.favoritesOnly} onChange={(e) => set("favoritesOnly", e.target.checked)} /> Favorites
      </label>
      <label className="check">
        <input type="checkbox" checked={filters.recentOnly} onChange={(e) => set("recentOnly", e.target.checked)} /> Recently played
      </label>
      <button type="button" className="btn" disabled={!dirty} onClick={() => onChange(NO_FILTERS)}>
        Clear filters
      </button>
    </form>
  );
}
