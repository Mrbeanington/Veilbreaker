import { z } from "zod";
import { energyFamilySchema, idSchema, targetRuleSchema, type TargetRule } from "./common";
import { conditionSchema, type Condition } from "./condition";

// spec/02 "Healing classes" (see also OQ-04): anti-heal and "cannot be
// healed" effects check the class, not just the numeric sign.
export const healingClassSchema = z.enum(["heal", "lifeTransfer", "setHp"]);
export type HealingClass = z.infer<typeof healingClassSchema>;

// spec/01 "Damage language" + phase-02-combat-primitives.md. Every stage of
// the pipeline (invulnerable → reflect/counter → amplification/weakness →
// damage reduction → shield → HP) runs for "normal" damage. "piercing"
// bypasses only flat defense (damage reduction and shield). "affliction" is
// unavoidable "true damage": it bypasses invulnerable, reflect/counter,
// damage reduction, and shield, but amplification/weakness still applies —
// those represent innate vulnerability, not defense. See docs/DECISIONS.md.
export const damageTypeSchema = z.enum(["normal", "piercing", "affliction"]);
export type DamageType = z.infer<typeof damageTypeSchema>;

// spec/02 "Effect" plus spec/01 "Randomness (controlled)". Effect and
// RandomOutcome are mutually recursive (a random outcome branch is a list of
// effects; an effect can itself be "roll a random outcome"), so both types
// are written by hand before either schema exists — z.infer cannot describe
// a schema before the schema exists.
export type Effect =
  | { kind: "damage"; amount: number; damageType?: DamageType; target?: TargetRule }
  | { kind: "heal"; healingClass: HealingClass; amount: number; target?: TargetRule }
  | {
      kind: "applyStatus";
      statusId: string;
      durationTurns?: number;
      stacks?: number;
      // The per-application strength of a status that carries a number (Shield's
      // absorption pool, Damage Reduction's flat reduction, a DoT/HoT's per-tick
      // amount, ...). Meaningless — and ignored — for a presence-only status like
      // Stun. See docs/DECISIONS.md for the stacking model this feeds into.
      magnitude?: number;
      target?: TargetRule;
    }
  | {
      kind: "removeStatus";
      // spec/02 "dispel": either a specific statusId, or dispelAll: true to
      // remove every currently-active dispellable status.
      statusId?: string;
      dispelAll?: boolean;
      target?: TargetRule;
    }
  | { kind: "modifyResource"; resourceId: string; amount: number; target?: TargetRule }
  | { kind: "modifyEnergy"; family: EnergyFamilyOrNeutral; amount: number }
  | {
      kind: "modifyCooldown";
      abilityId: string;
      mode: "set" | "delta";
      amount: number;
      target?: TargetRule;
    }
  | {
      kind: "drainEnergy";
      family: z.infer<typeof energyFamilySchema> | "any";
      amount: number;
      grantToSelf: boolean;
      target?: TargetRule;
    }
  | { kind: "summon"; summonId: string }
  | { kind: "transformInto"; transformationId: string }
  | { kind: "randomOutcome"; outcome: RandomOutcome }
  | { kind: "conditional"; condition: Condition; ifTrue: Effect[]; ifFalse?: Effect[] }
  | { kind: "sequence"; effects: Effect[] };

type EnergyFamilyOrNeutral = z.infer<typeof energyFamilySchema> | "neutral";

export type RandomOutcomeBranch = { weight: number; effects: Effect[] };
export type RandomOutcome = { branches: RandomOutcomeBranch[]; rerollable: boolean };

// The recursive schemas below are annotated with an explicit `unknown` input
// type. `z.ZodType<T>` with a single type argument forces Input = Output = T,
// but several nested schemas (e.g. targetRuleSchema, whose count/includeSelf/
// filterTags fields use `.default()`) have an input shape looser than their
// output shape. Loosening Input to `unknown` here just means "TS won't
// pre-validate the shape of whatever you pass to `.parse()`" — which is true
// of `.parse(value: unknown)` regardless, since real callers always parse
// unknown JSON, never a value already typed as `Effect`.
export const effectSchema: z.ZodType<Effect, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("damage"),
      amount: z.number().int().positive(),
      damageType: damageTypeSchema.default("normal"),
      target: targetRuleSchema.optional(),
    }),
    z.object({
      kind: z.literal("heal"),
      healingClass: healingClassSchema,
      amount: z.number().int().positive(),
      target: targetRuleSchema.optional(),
    }),
    z.object({
      kind: z.literal("applyStatus"),
      statusId: idSchema,
      durationTurns: z.number().int().min(0).optional(),
      stacks: z.number().int().min(1).optional(),
      magnitude: z.number().int().optional(),
      target: targetRuleSchema.optional(),
    }),
    z.object({
      kind: z.literal("removeStatus"),
      statusId: idSchema.optional(),
      dispelAll: z.boolean().optional(),
      target: targetRuleSchema.optional(),
    }),
    z.object({
      kind: z.literal("modifyResource"),
      resourceId: idSchema,
      amount: z.number().int(),
      target: targetRuleSchema.optional(),
    }),
    z.object({
      kind: z.literal("modifyEnergy"),
      family: z.union([energyFamilySchema, z.literal("neutral")]),
      amount: z.number().int(),
    }),
    z.object({
      kind: z.literal("modifyCooldown"),
      abilityId: idSchema,
      mode: z.enum(["set", "delta"]),
      amount: z.number().int(),
      target: targetRuleSchema.optional(),
    }),
    z.object({
      kind: z.literal("drainEnergy"),
      family: z.union([energyFamilySchema, z.literal("any")]),
      amount: z.number().int().positive(),
      grantToSelf: z.boolean(),
      target: targetRuleSchema.optional(),
    }),
    z.object({ kind: z.literal("summon"), summonId: idSchema }),
    z.object({ kind: z.literal("transformInto"), transformationId: idSchema }),
    z.object({ kind: z.literal("randomOutcome"), outcome: randomOutcomeSchema }),
    z.object({
      kind: z.literal("conditional"),
      condition: conditionSchema,
      ifTrue: z.array(effectSchema).min(1),
      ifFalse: z.array(effectSchema).optional(),
    }),
    z.object({ kind: z.literal("sequence"), effects: z.array(effectSchema).min(1) }),
  ]),
);

export const randomOutcomeBranchSchema: z.ZodType<RandomOutcomeBranch, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.object({
    weight: z.number().int().min(1),
    effects: z.array(effectSchema).min(1),
  }),
);

export const randomOutcomeSchema: z.ZodType<RandomOutcome, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.object({
    branches: z.array(randomOutcomeBranchSchema).min(2),
    rerollable: z.boolean().default(false),
  }),
);
