import { STATUS_LIBRARY } from "./data/statuses";
import type { Ability } from "./schemas/ability";
import type { Cost } from "./schemas/common";
import type { Effect } from "./schemas/effect";

// phase-04-first-five.md "Tooltip text generated from data": the mechanical
// half of a tooltip (cost, cooldown, what the effects actually do) is
// composed from the Ability's own structured data rather than hand-authored
// prose that could silently drift from what the ability really does when its
// numbers change. `Ability.description` stays separate, hand-written flavor
// text — this covers the part that must stay numerically honest.

const ENERGY_FAMILY_LABELS: Record<keyof Omit<Cost, "neutral">, string> = {
  might: "Might",
  focus: "Focus",
  spirit: "Spirit",
  chaos: "Chaos",
};

function formatCost(cost: Cost): string {
  const parts: string[] = [];
  for (const family of ["might", "focus", "spirit", "chaos"] as const) {
    if (cost[family] > 0) parts.push(`${cost[family]} ${ENERGY_FAMILY_LABELS[family]}`);
  }
  if (cost.neutral > 0) parts.push(`${cost.neutral} Neutral`);
  return parts.length > 0 ? parts.join(", ") : "Free";
}

function statusLabel(statusId: string): string {
  return STATUS_LIBRARY[statusId]?.displayName ?? statusId;
}

function describeEffect(effect: Effect): string {
  switch (effect.kind) {
    case "damage":
      return `Deal ${effect.amount} ${effect.damageType ?? "normal"} damage.`;
    case "heal":
      return `Restore ${effect.amount} HP (${effect.healingClass}).`;
    case "applyStatus": {
      const magnitude = effect.magnitude ? ` (${effect.magnitude})` : "";
      const duration = effect.durationTurns !== undefined ? ` for ${effect.durationTurns} turn(s)` : "";
      return `Apply ${statusLabel(effect.statusId)}${magnitude}${duration}.`;
    }
    case "removeStatus":
      return effect.dispelAll ? "Dispel all removable statuses." : `Remove ${statusLabel(effect.statusId ?? "")}.`;
    case "modifyResource":
      return `${effect.amount >= 0 ? "Gain" : "Lose"} ${Math.abs(effect.amount)} ${effect.resourceId.replace(/^resource\./, "")}.`;
    case "modifyEnergy":
      return `${effect.amount >= 0 ? "Gain" : "Lose"} ${Math.abs(effect.amount)} ${effect.family} energy.`;
    case "modifyCooldown":
      return `${effect.mode === "set" ? "Set" : "Adjust"} a cooldown by ${effect.amount}.`;
    case "drainEnergy":
      return `Drain ${effect.amount} ${effect.family} energy${effect.grantToSelf ? " and claim it" : ""}.`;
    case "summon":
      return `Summon ${effect.summonId.replace(/^summon\./, "").replace(/[.-]/g, " ")}.`;
    case "transformInto":
      return "Transform.";
    case "erase":
      return "Erase the target, bypassing death effects.";
    case "rewindTurn":
      return "Rewind the turn: everyone returns to how they started it.";
    case "resurrect":
      return `Resurrect at ${effect.healthPercent ?? 50}% HP.`;
    case "modifyRandomOutcome":
      return `Manipulate the next random roll (${effect.mode}).`;
    case "retargetQueuedAction":
      return "Redirect a queued action's target.";
    case "randomOutcome":
      return "Roll a random outcome.";
    case "conditional":
      return `If a condition holds: ${describeEffects(effect.ifTrue)}${effect.ifFalse ? ` Otherwise: ${describeEffects(effect.ifFalse)}` : ""}`;
    case "sequence":
      return describeEffects(effect.effects);
  }
}

function describeEffects(effects: readonly Effect[]): string {
  return effects.map(describeEffect).join(" ");
}

/** A fully data-derived tooltip: cost, cooldown, and a plain-English rendering of every effect. */
export function generateAbilityTooltip(ability: Ability): string {
  const parts = [`Cost: ${formatCost(ability.cost)}.`, `Cooldown: ${ability.cooldown} turn(s).`, describeEffects(ability.effects)];
  return parts.join(" ");
}
