import { CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, CHARACTER_LORE, TRANSFORMATION_LIBRARY, generateAbilityTooltip, type Ability, type CharacterDefinition, type Effect } from "@veilbreak/content";
import type { Profile } from "@veilbreak/persistence";
import {
  MAX_MASTERY,
  abilitiesOf,
  abilityRevealed,
  knownCounters,
  knownSynergies,
  masteryLevel,
  originOf,
  passiveOf,
  passiveRevealed,
  rolesOf,
} from "../game/knowledge";
import { unlockHint } from "../game/quests";
import { masteryRing } from "../game/rewards";
import { splashUrl } from "../art/splashes";
import { Icon, type IconName } from "./Icon";
import { Portrait } from "./Portrait";

function firstKind(effects: readonly Effect[]): Effect["kind"] | undefined {
  for (const e of effects) {
    if (e.kind === "sequence") return firstKind(e.effects) ?? e.kind;
    if (e.kind === "conditional") return firstKind(e.ifTrue) ?? e.kind;
    return e.kind;
  }
  return undefined;
}

/** A generic icon for an ability, picked from what it does (real ability art arrives in Phase 14). */
export function abilityIconName(ability: Ability): IconName {
  switch (firstKind(ability.effects)) {
    case "damage":
      return "sword";
    case "heal":
      return "heart";
    case "applyStatus": {
      const status = ability.effects.find((e) => e.kind === "applyStatus");
      const id = status && status.kind === "applyStatus" ? status.statusId : "";
      if (/shield|reduction|invulnerable|untargetable|prevention/.test(id)) return "shield";
      if (/stun|silence|lock|petrif|fear/.test(id)) return "chain";
      return "sparkle";
    }
    case "summon":
    case "transformInto":
      return "sparkle";
    case "drainEnergy":
    case "modifyEnergy":
      return "bolt";
    default:
      return "sparkle";
  }
}

interface CharacterSheetProps {
  character: CharacterDefinition;
  profile: Profile;
  /** "codex" adds counters, synergies, transformations, lore and secrets. */
  mode: "roster" | "codex";
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const nameOf = (id: string) => CHARACTER_LIBRARY[id]?.displayName ?? id;

export function CharacterSheet({ character, profile, mode, isFavorite, onToggleFavorite }: CharacterSheetProps) {
  const passive = passiveOf(character);
  const mastery = masteryLevel(profile, character.id);
  const [name, ...titleParts] = character.displayName.split(/,\s*/);
  const title = titleParts.join(", ");
  const art = CHARACTER_ART_LIBRARY[character.id];

  return (
    <article className="sheet" aria-labelledby={`sheet-${character.id}`}>
      {splashUrl(character.id) && (
        <div className="sheet-splash">
          <img src={splashUrl(character.id)} alt="" width={400} height={600} loading="lazy" decoding="async" draggable={false} />
        </div>
      )}
      <header className="sheet-head">
        <Portrait characterId={character.id} displayName={character.displayName} size={72} ring={masteryRing(mastery)} />
        <div>
          <h3 id={`sheet-${character.id}`} className="sheet-name">
            {name}
          </h3>
          {title && <div className="sheet-title">{title}</div>}
          <div className="tag-line">
            <span className="tag">{character.rarity}</span>
            {rolesOf(character).map((r) => (
              <span className="tag" key={r}>
                {r}
              </span>
            ))}
            <span className="tag">{originOf(character.id)}</span>
            <span className="tag">{character.baseHp} HP</span>
          </div>
        </div>
        {onToggleFavorite && (
          <button type="button" className={`fav-btn${isFavorite ? " on" : ""}`} aria-pressed={!!isFavorite} onClick={onToggleFavorite}>
            <Icon name="star" size={16} /> {isFavorite ? "Favorite" : "Add to favorites"}
          </button>
        )}
      </header>

      <p className="hp-text">
        Mastery {mastery}/{MAX_MASTERY} · played {profile.played[character.id] ?? 0} time(s)
      </p>

      <h4 className="sheet-section">Abilities</h4>
      <ul className="sheet-abilities">
        {abilitiesOf(character).map((ability) =>
          abilityRevealed(ability, profile) ? (
            <li key={ability.id}>
              <Icon name={abilityIconName(ability)} size={20} />
              <div>
                <strong>{ability.displayName}</strong>
                <pre className="tooltip-text">{generateAbilityTooltip(ability)}</pre>
              </div>
            </li>
          ) : (
            <li key={ability.id} className="undiscovered">
              <Icon name="question" size={20} /> Undiscovered ability. See it used in a match.
            </li>
          ),
        )}
      </ul>

      {passive && (
        <>
          <h4 className="sheet-section">Passive</h4>
          {passiveRevealed(passive, profile) ? (
            <p>
              <strong>{passive.displayName}.</strong> {passive.description}
            </p>
          ) : (
            <p className="undiscovered">
              <Icon name="question" size={16} /> A hidden trait. It shows itself in play.
            </p>
          )}
        </>
      )}

      {mode === "codex" && (
        <>
          <h4 className="sheet-section">Transformations</h4>
          {character.transformationIds.length === 0 ? (
            <p className="hp-text">None known.</p>
          ) : (
            <ul>
              {character.transformationIds.map((id) => {
                const seen = profile.discovered.transformations.includes(id) || profile.settings.showAllCharacters;
                const t = TRANSFORMATION_LIBRARY[id];
                return <li key={id}>{seen ? (t?.toStageId ?? id).replace(/^stage./, "").replace(/[.-]/g, " ") : "An unseen transformation"}</li>;
              })}
            </ul>
          )}

          <h4 className="sheet-section">Known counters</h4>
          <p>{knownCounters(profile, character.id).map(nameOf).join(", ") || "None yet. Lose to the same fighter twice and it appears here."}</p>

          <h4 className="sheet-section">Known synergies</h4>
          <p>{knownSynergies(profile, character.id).map(nameOf).join(", ") || "None yet. Win twice alongside the same teammate."}</p>

          <h4 className="sheet-section">Lore</h4>
          <p>{CHARACTER_LORE[character.id] ?? (art?.visualTheme ? capitalize(art.visualTheme) + "." : "Nothing is known.")}</p>

          <h4 className="sheet-section">How to unlock</h4>
          <p>{unlockHint(character, profile)}</p>
        </>
      )}
    </article>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
