import { z } from "zod";
import { energyFamilySchema, idSchema, targetRuleSchema, type TargetRule } from "./common";
import { conditionSchema, type Condition } from "./condition";

// spec/02 "Healing classes" (see also OQ-04): anti-heal and "cannot be
// healed" effects check the class, not just the numeric sign.
export const healingClassSchema = z.enum(["heal", "lifeTransfer", "setHp"]);
export type HealingClass = z.infer<typeof healingClassSchema>;

// spec/02 "Effect" plus spec/01 "Randomness (controlled)". Effect and
// RandomOutcome are mutually recursive (a random outcome branch is a list of
// effects; an effect can itself be "roll a random outcome"), so both types
// are written by hand before either schema exists — z.infer cannot describe
// a schema before the schema exists.
export type Effect =
  | { kind: "damage"; amount: number; target?: TargetRule }
  | { kind: "heal"; healingClass: HealingClass; amount: number; target?: TargetRule }
  | {
      kind: "applyStatus";
      statusId: string;
      durationTurns?: number;
      stacks?: number;
      target?: TargetRule;
    }
  | { kind: "removeStatus"; statusId: string; target?: TargetRule }
  | { kind: "modifyResource"; resourceId: string; amount: number; target?: TargetRule }
  | { kind: "modifyEnergy"; family: EnergyFamilyOrNeutral; amount: number }
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
      target: targetRuleSchema.optional(),
    }),
    z.object({
      kind: z.literal("removeStatus"),
      statusId: idSchema,
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
