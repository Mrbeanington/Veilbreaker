import { SILENCE, STUN, type ActiveStatus, type CharacterRuntimeState, type StatusDefinition } from "@veilbreak/content";

// spec/02 "Status system" + phase-02-combat-primitives.md: generic apply/
// stack/tick/expire/dispel, applied uniformly to every status in the library
// regardless of which (if any) mechanical hook it has elsewhere in the
// engine. See docs/DECISIONS.md for the stacking model this implements:
// `stacks` counts applications (capped at maxStacks); `magnitude` is the
// most recent application's strength; effective strength for any math is
// always `magnitude * stacks`.

export function hasStatus(character: CharacterRuntimeState, statusId: string): boolean {
  return character.statuses.some((s) => s.statusId === statusId);
}

export function getActiveStatus(character: CharacterRuntimeState, statusId: string): ActiveStatus | undefined {
  return character.statuses.find((s) => s.statusId === statusId);
}

/** `magnitude * stacks`, or 0 if the status isn't active. */
export function getEffectiveMagnitude(character: CharacterRuntimeState, statusId: string): number {
  const active = getActiveStatus(character, statusId);
  return active ? active.magnitude * active.stacks : 0;
}

export interface ApplyStatusParams {
  durationTurns?: number;
  stacks?: number;
  magnitude?: number;
  param?: string;
}

export function applyStatusToCharacter(
  character: CharacterRuntimeState,
  statusDef: StatusDefinition,
  params: ApplyStatusParams,
): CharacterRuntimeState {
  const remainingTurns =
    params.durationTurns !== undefined
      ? params.durationTurns
      : statusDef.duration.permanent
        ? null
        : statusDef.duration.turns;
  const magnitude = params.magnitude ?? 0;
  const requestedStacks = params.stacks ?? 1;
  const param = params.param;

  const existingIndex = character.statuses.findIndex((s) => s.statusId === statusDef.id);
  if (existingIndex === -1) {
    const fresh: ActiveStatus = {
      statusId: statusDef.id,
      remainingTurns,
      stacks: Math.min(statusDef.maxStacks, requestedStacks),
      magnitude,
      param,
    };
    return { ...character, statuses: [...character.statuses, fresh] };
  }

  const existing = character.statuses[existingIndex];
  if (!existing) {
    throw new Error("applyStatusToCharacter: unreachable — existingIndex found but entry missing");
  }

  let updated: ActiveStatus;
  switch (statusDef.stackRule) {
    case "none":
      // A status already active blocks a reapplication entirely until it
      // expires or is dispelled.
      return character;
    case "refresh":
      updated = { ...existing, remainingTurns, magnitude, param };
      break;
    case "stack":
      updated = {
        ...existing,
        stacks: Math.min(statusDef.maxStacks, existing.stacks + requestedStacks),
        magnitude,
        param,
      };
      break;
    case "stackAndRefresh":
      updated = {
        ...existing,
        stacks: Math.min(statusDef.maxStacks, existing.stacks + requestedStacks),
        magnitude,
        param,
        remainingTurns,
      };
      break;
  }

  const statuses = [...character.statuses];
  statuses[existingIndex] = updated;
  return { ...character, statuses };
}

/** Sets a status's effective magnitude directly, e.g. after a shield absorbs damage. Removes it if the new magnitude is 0. */
export function setStatusMagnitude(
  character: CharacterRuntimeState,
  statusId: string,
  magnitude: number,
): CharacterRuntimeState {
  if (magnitude <= 0) {
    return removeStatusFromCharacter(character, statusId);
  }
  return {
    ...character,
    statuses: character.statuses.map((s) => (s.statusId === statusId ? { ...s, stacks: 1, magnitude } : s)),
  };
}

export function removeStatusFromCharacter(character: CharacterRuntimeState, statusId: string): CharacterRuntimeState {
  return { ...character, statuses: character.statuses.filter((s) => s.statusId !== statusId) };
}

/** spec/02 "dispel": removes every currently-active dispellable status. */
export function dispelCharacter(
  character: CharacterRuntimeState,
  statusLibrary: Record<string, StatusDefinition>,
): CharacterRuntimeState {
  return {
    ...character,
    statuses: character.statuses.filter((s) => {
      const def = statusLibrary[s.statusId];
      // An unrecognized status id is kept rather than silently dropped —
      // being unable to look up its definition isn't evidence it's meant to
      // be dispellable.
      return def ? !def.dispellable : true;
    }),
  };
}

/**
 * Ticks down every timed status by one turn, removing any that reach 0.
 * Permanent statuses (`remainingTurns: null`) are untouched. `exemptStatusIds`
 * skips a status applied (or refreshed) THIS same turn — otherwise a status
 * applied in an earlier tier would already lose a turn of its duration to
 * this same turn's post-turn-effects tier, the same off-by-one ADR-006 fixed
 * for cooldowns ("duration: 1" would only ever last 0 further turns).
 */
export function decrementStatusDurations(
  character: CharacterRuntimeState,
  exemptStatusIds: ReadonlySet<string> = new Set(),
): CharacterRuntimeState {
  const statuses = character.statuses
    .map((s) =>
      s.remainingTurns === null || exemptStatusIds.has(s.statusId)
        ? s
        : { ...s, remainingTurns: s.remainingTurns - 1 },
    )
    .filter((s) => s.remainingTurns === null || s.remainingTurns > 0);
  return { ...character, statuses };
}

/** Every DoT/HoT tick due on this character this turn, by status id. */
export function computeTicks(
  character: CharacterRuntimeState,
  statusLibrary: Record<string, StatusDefinition>,
  behavior: "damageOverTime" | "healOverTime",
): { statusId: string; amount: number }[] {
  const ticks: { statusId: string; amount: number }[] = [];
  for (const active of character.statuses) {
    const def = statusLibrary[active.statusId];
    if (def?.tickBehavior === behavior) {
      ticks.push({ statusId: active.statusId, amount: active.magnitude * active.stacks });
    }
  }
  return ticks;
}

/** spec/02 Stun/Silence: "Cannot take any action." Checked at both planning (actions.ts) and execution (resolver.ts) time, since a status can be applied mid-turn by an earlier tier. */
export function canAct(character: CharacterRuntimeState): boolean {
  return !hasStatus(character, STUN.id) && !hasStatus(character, SILENCE.id);
}
