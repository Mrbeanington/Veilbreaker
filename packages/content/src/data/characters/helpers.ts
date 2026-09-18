import type { TargetRule } from "../../schemas/common";
import { abilitySchema, type Ability } from "../../schemas/ability";

// phase-04-first-five.md: every character file below builds abilities out of
// the same handful of TargetRule shapes — named here once rather than
// repeated as object literals in every ability (CLAUDE.md rule 10: reusable
// beats hard-coded).
export const ENEMY_SINGLE: TargetRule = { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] };
export const ENEMY_ALL: TargetRule = { side: "enemy", scope: "all", count: 1, includeSelf: false, filterTags: [] };
export const SELF_ONLY: TargetRule = { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] };

// A TargetRule shape effects can set as their own `target` override to land
// on the caster instead of the ability's shared targetIds (packages/engine/
// src/effects.ts `resolveEffectTargets`, ADR-011) — used whenever one effect
// in an enemy- or ally-targeted ability needs to affect the caster.
export const EFFECT_TARGETS_SELF: TargetRule = SELF_ONLY;

// `cost` only needs the families actually spent — every family defaults to 0
// at parse time (costSchema), but the *output* Cost type requires all five,
// which would otherwise force every ability literal below to spell out
// `might: 0, focus: 0, ...` for families it never touches.
type PartialCost = Partial<Ability["cost"]>;

export function ability(
  overrides: Partial<Omit<Ability, "cost">> &
    Pick<Ability, "id" | "displayName" | "description" | "target" | "effects"> & { cost?: PartialCost },
): Ability {
  return abilitySchema.parse({
    cost: {},
    cooldown: 0,
    tags: [],
    knowledgeLevel: "PUBLIC",
    ...overrides,
  });
}
