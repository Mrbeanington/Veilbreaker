import { RESOURCE_LIBRARY, STATUS_LIBRARY } from "@veilbreak/content";
import type { CharacterRuntimeState } from "@veilbreak/engine";
import { Icon, statusIconName } from "./Icon";
import { Portrait } from "./Portrait";

interface CharacterCardProps {
  character: CharacterRuntimeState;
  displayName: string;
  /** True while this card is a legal click target for the ability currently being aimed. */
  targetable?: boolean;
  /** True for whichever character the current player is choosing an action for. */
  acting?: boolean;
  onClick?: () => void;
}

// spec/05 "clarity first": HP, status icons (+ text — never color alone, for
// colorblind accessibility), and custom resource indicators must all be
// visible at a glance. "Moonshot's bases must be visually obvious" is why
// every trackMode resource gets its own bright chip, not a buried tooltip.
export function CharacterCard({ character, displayName, targetable, acting, onClick }: CharacterCardProps) {
  const hpPercent = character.maxHp > 0 ? Math.max(0, Math.round((character.currentHp / character.maxHp) * 100)) : 0;
  const classes = ["character-card"];
  if (!character.alive) classes.push("dead");
  if (targetable) classes.push("targetable");
  if (acting) classes.push("acting");

  const body = (
    <div className="character-body">
      <div className="character-name-row">
        <span>{displayName}</span>
        {!character.alive && <span aria-hidden="true">💀</span>}
      </div>
      <div className="hp-bar-track">
        <div className={`hp-bar-fill${hpPercent <= 25 ? " low" : ""}`} style={{ width: `${hpPercent}%` }} />
      </div>
      <div className="hp-text">
        {character.currentHp} / {character.maxHp} HP
      </div>
      {/* Always rendered, even empty (spec/05 "clarity first" polish): a status or a mid-match
          resource appearing/disappearing must not change the card's height turn to turn, or two
          teams' cards drift out of alignment with each other. */}
      <div className="status-row">
        {character.statuses.map((active) => {
          const def = STATUS_LIBRARY[active.statusId];
          const label = def?.displayName ?? active.statusId;
          const magnitudeLabel = active.magnitude > 0 ? ` ${active.magnitude * active.stacks}` : "";
          return (
            <span key={active.statusId} className="status-chip" title={def?.tooltip}>
              <Icon name={statusIconName(active.statusId)} size={12} /> {label}
              {magnitudeLabel}
              {active.remainingTurns !== null ? ` (${active.remainingTurns})` : ""}
            </span>
          );
        })}
      </div>
      <div className="resource-row">
        {Object.entries(character.resources).map(([id, value]) => {
          const def = RESOURCE_LIBRARY[id];
          if (!def?.trackMode) return null;
          return (
            <span key={id} className="resource-chip">
              {def.displayName}: {value}
            </span>
          );
        })}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" className={classes.join(" ")} onClick={onClick} disabled={!targetable}>
        <Portrait characterId={character.characterId} displayName={displayName} size={60} />
        {body}
      </button>
    );
  }

  return (
    <div className={classes.join(" ")}>
      <Portrait characterId={character.characterId} displayName={displayName} size={60} />
      {body}
    </div>
  );
}
