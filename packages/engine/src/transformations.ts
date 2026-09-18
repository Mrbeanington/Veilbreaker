import type { CharacterRuntimeState, Transformation } from "@veilbreak/content";

/**
 * spec/02 "Transformation engine": swaps the definition layer (abilities,
 * passive, HP, cooldowns) while preserving identity and statuses — this
 * function never touches `statuses`, so whatever's active carries through
 * the transformation unchanged, matching the deliverable's "preserving
 * identity and statuses per rules".
 *
 * `changes.maxHp`, if present, rescales current HP by the same ratio rather
 * than leaving the absolute number or fully healing: an "evolution" that
 * raises max HP raises current HP with it (a free partial heal, thematically
 * "growing stronger"); one that lowers it (a "weakened" stage) lowers
 * current HP too, so the character doesn't become disproportionately tankier
 * or frailer relative to its new max (docs/DECISIONS.md). Tags,
 * energyCostOverrides, and the presentation-only fields (portrait,
 * animationCue, soundCue, battleBackgroundEffect) aren't applied to runtime
 * state yet — logged as a gap, since nothing in the engine currently reads a
 * per-character tag list or per-character cost override.
 */
export function applyTransformation(
  character: CharacterRuntimeState,
  transformation: Transformation,
): CharacterRuntimeState {
  const { changes } = transformation;
  let next = character;

  if (changes.maxHp !== undefined) {
    const currentHp = Math.min(
      changes.maxHp,
      Math.max(0, Math.round((character.currentHp * changes.maxHp) / character.maxHp)),
    );
    next = { ...next, maxHp: changes.maxHp, currentHp };
  }

  if (changes.abilityIds) {
    next = { ...next, abilityIds: changes.abilityIds };
  }

  if (changes.passiveId) {
    next = { ...next, passiveId: changes.passiveId };
  }

  if (changes.cooldownOverrides) {
    next = { ...next, cooldowns: { ...next.cooldowns, ...changes.cooldownOverrides } };
  }

  return next;
}
