import { ABILITY_LIBRARY, CHARACTER_LIBRARY, STATUS_LIBRARY } from "@veilbreak/content";
import type { BattleEvent } from "@veilbreak/engine";

// CLAUDE.md rule 9 "Discoverability": the battle log is a first-class
// output, and every state-changing event the engine emits (packages/engine/
// src/types.ts's AppliedEvent, recorded verbatim as a BattleEvent) must be
// representable here — even a hidden or obscure one falls through to a
// readable generic line rather than being silently dropped.

function nameOf(id: string | undefined): string {
  if (!id) return "something";
  return CHARACTER_LIBRARY[id]?.displayName ?? id;
}

function statusName(statusId: unknown): string {
  if (typeof statusId !== "string") return "a status";
  return STATUS_LIBRARY[statusId]?.displayName ?? statusId;
}

function abilityName(abilityId: unknown): string {
  if (typeof abilityId !== "string") return "an ability";
  return ABILITY_LIBRARY[abilityId]?.displayName ?? abilityId;
}

export function describeBattleEvent(event: BattleEvent): string | null {
  const source = nameOf(event.sourceId);
  const target = nameOf(event.targetId);
  const payload = event.payload ?? {};

  switch (event.type) {
    case "damageDealt":
      // A DoT/HoT tick resolves as self-inflicted damage (sourceId ===
      // targetId) — "X deals N damage to X" reads oddly for that case.
      return event.sourceId === event.targetId
        ? `${target} takes ${payload.amount} damage.`
        : `${source} deals ${payload.amount} damage to ${target}.`;
    case "healed":
      return `${source} restores ${payload.amount} HP to ${target}.`;
    case "healBlocked":
      return `${target}'s healing is blocked.`;
    case "damageBlocked":
      return `${target} is invulnerable and takes no damage.`;
    case "damageReflected":
      return `${source} reflects the attack back onto ${target}.`;
    case "counterDamage":
      return `${source} counters, dealing ${payload.amount} damage to ${target}.`;
    case "damageAvoided":
      return `${target} avoids the attack from ${source}.`;
    case "damageAbsorbedByShield":
      return `${target}'s shield absorbs ${payload.absorbed} damage.`;
    case "damageAbsorbedBySummon":
      return `${target}'s summon absorbs ${payload.absorbed} damage.`;
    case "summonDestroyed":
      return `${target}'s summon is destroyed.`;
    case "deathPrevented":
      return `${target} is saved from a lethal blow!`;
    case "statusApplied":
      return `${target} gains ${statusName(payload.statusId)}.`;
    case "statusRemoved":
      return `${statusName(payload.statusId)} is removed from ${target}.`;
    case "statusesDispelled":
      return `${target}'s statuses are dispelled.`;
    case "resourceChanged":
      return typeof payload.delta === "number" && payload.delta < 0
        ? `${target} loses ${Math.abs(payload.delta)} ${String(payload.resourceId).replace(/^resource\./, "")}.`
        : `${target} gains ${payload.delta ?? 0} ${String(payload.resourceId).replace(/^resource\./, "")}.`;
    case "energyModified":
      return `${source}'s team energy changes.`;
    case "energyDrained":
      return `${source} drains ${payload.amount} ${payload.family} energy from ${target}.`;
    case "cooldownModified":
      return `${target}'s cooldown changes.`;
    case "summonCreated":
      return `${source} summons something new.`;
    case "transformed":
      return `${source} transforms!`;
    case "erased":
      return `${target} is erased from the battle.`;
    case "resurrected":
      return `${target} is resurrected.`;
    case "resurrectionBlocked":
      return `${target} cannot be resurrected.`;
    case "rngModifierQueued":
      return `${target} tips the odds in their favor.`;
    case "queuedActionRetargeted":
      return `${source} redirects a queued action.`;
    case "death":
      return `${target} has fallen${event.sourceId ? `, defeated by ${source}` : ""}.`;
    case "recursionGuardTripped":
      return null; // internal safety valve, not meaningful to a player
    case "actionSkippedActorNotAlive":
    case "actionSkippedCannotAct":
      return `${nameOf(event.sourceId ?? undefined)} cannot act this turn.`;
    case "actionSkippedNoLegalTarget":
      return `${nameOf(event.sourceId ?? undefined)} has no legal target.`;
    case "matchEndedInDraw":
      return "The match ends in a draw.";
    case "matchEndedByTeamWipe":
      return "The match is decided — one team has fallen.";
    case "matchEndedByTurnLimit":
      return "The match reaches its turn limit.";
    case "onAbilityUsed":
      return `${source} uses ${abilityName(payload.abilityId)}.`;
    default:
      return `${source} → ${target}: ${event.type}`;
  }
}
