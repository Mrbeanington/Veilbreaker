import { generateAbilityTooltip, type Ability } from "@veilbreak/content";
import { canAfford, getEffectiveCost, type CharacterRuntimeState, type EnergyPool } from "@veilbreak/engine";

interface AbilityListProps {
  abilities: Ability[];
  actor: CharacterRuntimeState;
  pool: EnergyPool;
  selectedAbilityId: string | null;
  onSelect: (ability: Ability) => void;
}

// spec/05 "Ability tooltip format ... generated from ability data wherever
// possible, so balance edits update it automatically" — generateAbilityTooltip
// (packages/content) is the single source for the mechanical half of every
// tooltip here.
export function AbilityList({ abilities, actor, pool, selectedAbilityId, onSelect }: AbilityListProps) {
  return (
    <div className="ability-list">
      {abilities.map((ability) => {
        const cooldownRemaining = actor.cooldowns[ability.id] ?? 0;
        const affordable = canAfford(pool, getEffectiveCost(ability, actor));
        const disabled = cooldownRemaining > 0 || !affordable;
        let reason = "";
        if (cooldownRemaining > 0) reason = ` — on cooldown (${cooldownRemaining} turn(s) left)`;
        else if (!affordable) reason = " — not enough energy";
        return (
          <button
            key={ability.id}
            type="button"
            className={`ability-btn${selectedAbilityId === ability.id ? " selected" : ""}`}
            disabled={disabled}
            onClick={() => onSelect(ability)}
          >
            <span className="ability-name">{ability.displayName}</span>
            <span className="ability-tooltip">
              {generateAbilityTooltip(ability)}
              {reason}
            </span>
          </button>
        );
      })}
    </div>
  );
}
