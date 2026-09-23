import { ABILITY_LIBRARY, RESOURCE_LIBRARY } from "./data/characters/index";
import { STATUS_LIBRARY } from "./data/statuses";
import type { Ability } from "./schemas/ability";
import type { Condition } from "./schemas/condition";
import type { Cost, TargetRef } from "./schemas/common";
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

function resourceLabel(resourceId: string): string {
  return RESOURCE_LIBRARY[resourceId]?.displayName ?? resourceId.replace(/^resource\./, "");
}

function abilityLabel(abilityId: string): string {
  return ABILITY_LIBRARY[abilityId]?.displayName ?? abilityId;
}

function tagLabel(tag: string): string {
  return tag.charAt(0) + tag.slice(1).toLowerCase();
}

// A Condition's `target` field is written from the ability's own perspective
// ("self" = whoever owns the effect), which reads naturally as "you"/"your"
// in a tooltip shown to that character's controller. The battle log instead
// names real characters both players can see, so `names` lets a caller swap
// in an actual display name per TargetRef (e.g. { self: "Hydra" }) — omitted,
// every TargetRef falls back to the second-person tooltip wording below.
export type ConditionNames = Partial<Record<TargetRef, string>>;

function targetLabel(target: TargetRef, names?: ConditionNames): string {
  const named = names?.[target];
  if (named) return named;
  switch (target) {
    case "self":
      return "you";
    case "source":
      return "the source";
    case "target":
      return "the target";
    case "ally":
      return "an ally";
    case "enemy":
      return "an enemy";
    case "any":
      return "anyone";
  }
}

function targetPossessive(target: TargetRef, names?: ConditionNames): string {
  const named = names?.[target];
  if (named) return `${named}'s`;
  switch (target) {
    case "self":
      return "your";
    case "source":
      return "the source's";
    case "target":
      return "the target's";
    case "ally":
      return "an ally's";
    case "enemy":
      return "an enemy's";
    case "any":
      return "anyone's";
  }
}

function targetVerb(target: TargetRef, names?: ConditionNames): string {
  if (names?.[target]) return "has"; // a named third party is always singular, even for "self"
  return target === "self" ? "have" : "has";
}

/**
 * A plain-English clause for a Condition, e.g. "your Heads is at least 5" or
 * "you have Damage Reduction" — used without a leading capital so it can be
 * dropped straight into "If <clause>:". This is what closed the playtest gap
 * where nested conditionals only ever said "If a condition holds" with no
 * way to tell which condition (docs/DECISIONS.md ADR-054). `names` renders it
 * in the third person instead, for the battle log's "which branch fired"
 * line (ADR-056), which both players read and where "your" would be ambiguous.
 */
export function describeCondition(condition: Condition, names?: ConditionNames): string {
  switch (condition.type) {
    case "always":
      return "always";
    case "hpBelowPercent":
      return `${targetPossessive(condition.target, names)} HP is below ${condition.percent}%`;
    case "hasStatus":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} ${statusLabel(condition.statusId)}`;
    case "hasTag":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} the ${tagLabel(condition.tag)} tag`;
    case "resourceAtLeast":
      return `${targetPossessive(condition.target, names)} ${resourceLabel(condition.resourceId)} is at least ${condition.amount}`;
    case "turnAtLeast":
      return `it's turn ${condition.turn} or later`;
    case "damageReceivedAtLeast":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} taken at least ${condition.amount} damage this match`;
    case "damageDealtAtLeast":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} dealt at least ${condition.amount} damage this match`;
    case "healingDoneAtLeast":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} healed at least ${condition.amount} HP this match`;
    case "deathCountAtLeast":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} died at least ${condition.count} time(s)`;
    case "killCountAtLeast":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} gotten at least ${condition.count} kill(s)`;
    case "teamComposition":
      return `the ${condition.side} team is exactly ${condition.characterIds.join(", ")}`;
    case "usedAbilityLastTurn":
      return `${targetLabel(condition.target, names)} ${targetVerb(condition.target, names)} used ${abilityLabel(condition.abilityId)} last turn`;
    case "abilitySequenceMatches":
      return `${targetPossessive(condition.target, names)} last moves were ${condition.sequence.map(abilityLabel).join(" then ")}`;
    case "repeatedAbility":
      return `${targetLabel(condition.target, names)} used the same ability twice in a row`;
    case "secretScript":
      return "a hidden condition is met";
    case "not":
      return `NOT (${describeCondition(condition.condition, names)})`;
    case "and":
      return `(${condition.conditions.map((c) => describeCondition(c, names)).join(" AND ")})`;
    case "or":
      return `(${condition.conditions.map((c) => describeCondition(c, names)).join(" OR ")})`;
  }
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
      return `If ${describeCondition(effect.condition)}: ${describeEffects(effect.ifTrue)}${effect.ifFalse ? ` Otherwise: ${describeEffects(effect.ifFalse)}` : ""}`;
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
