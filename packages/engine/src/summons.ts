import type { Summon, SummonRuntimeState } from "@veilbreak/content";

// spec/02 "Summon system" + phase-03-advanced-systems.md. `instanceId` is
// derived deterministically from what already exists (owner + summon id +
// how many that pair already has), rather than a module-level counter or a
// fresh RNG draw — CLAUDE.md rule 4 bans hidden mutation, and a counter that
// lives outside BattleState would make two identical calls from different
// states collide or diverge unpredictably.
export function nextSummonInstanceId(
  existingSummons: Record<string, SummonRuntimeState>,
  ownerCharacterId: string,
  summonId: string,
): string {
  const count = Object.values(existingSummons).filter(
    (s) => s.ownerCharacterId === ownerCharacterId && s.summonId === summonId,
  ).length;
  return `${ownerCharacterId}:${summonId}:${count}`;
}

export function createSummonRuntimeState(
  definition: Summon,
  ownerCharacterId: string,
  instanceId: string,
): SummonRuntimeState {
  const hp = definition.hp ?? 1;
  return {
    instanceId,
    summonId: definition.id,
    ownerCharacterId,
    occupiesSlot: definition.occupiesSlot,
    currentHp: hp,
    maxHp: hp,
    alive: true,
    remainingTurns: definition.duration.permanent ? null : definition.duration.turns,
  };
}

/**
 * docs/DECISIONS.md: a non-slot ("attached") summon absorbs damage aimed at
 * its owner, like Malachar's Thralls — spec/06's "absorption counters" and
 * "attached summons" flavors of the same underlying mechanic. A slot-
 * occupying ("temporary fourth unit") summon does not; it fights as its own
 * independent unit instead (full independent targeting for that case is
 * deferred — see OPEN-QUESTIONS.md).
 */
export function findAbsorbingSummon(
  summons: Record<string, SummonRuntimeState>,
  ownerCharacterId: string,
): SummonRuntimeState | undefined {
  return Object.values(summons).find(
    (s) => s.alive && s.ownerCharacterId === ownerCharacterId && !s.occupiesSlot,
  );
}

/** Ticks every summon's duration down by one turn; expired ones become not-alive rather than being deleted, so their onExpireEffects can still be read once by the caller. */
export function decrementSummonDurations(
  summons: Record<string, SummonRuntimeState>,
): { summons: Record<string, SummonRuntimeState>; justExpired: SummonRuntimeState[] } {
  const justExpired: SummonRuntimeState[] = [];
  const next: Record<string, SummonRuntimeState> = {};
  for (const [instanceId, summon] of Object.entries(summons)) {
    if (!summon.alive || summon.remainingTurns === null) {
      next[instanceId] = summon;
      continue;
    }
    const remainingTurns = summon.remainingTurns - 1;
    if (remainingTurns <= 0) {
      const expired = { ...summon, remainingTurns: 0, alive: false };
      next[instanceId] = expired;
      justExpired.push(expired);
    } else {
      next[instanceId] = { ...summon, remainingTurns };
    }
  }
  return { summons: next, justExpired };
}
