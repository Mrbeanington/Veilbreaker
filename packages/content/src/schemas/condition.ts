import { z } from "zod";
import { archetypeTagSchema, idSchema, targetRefSchema } from "./common";

// spec/02 "Condition": a boolean predicate over battle state, evaluated by
// the engine resolver. Also reused as the trigger predicate for
// transformations (spec/02 "Transformation engine"), since a transformation
// trigger is itself a condition checked against accumulated match state
// (HP thresholds, turn counts, deaths, kills, resources, team composition,
// and so on).
//
// Defined recursively (and/or/not), so the type is written by hand first —
// z.infer cannot describe a schema before the schema exists.
export type Condition =
  | { type: "always" }
  | { type: "hpBelowPercent"; target: z.infer<typeof targetRefSchema>; percent: number }
  | { type: "hasStatus"; target: z.infer<typeof targetRefSchema>; statusId: string }
  | { type: "hasTag"; target: z.infer<typeof targetRefSchema>; tag: z.infer<typeof archetypeTagSchema> }
  | {
      type: "resourceAtLeast";
      target: z.infer<typeof targetRefSchema>;
      resourceId: string;
      amount: number;
    }
  | { type: "turnAtLeast"; turn: number }
  | { type: "damageReceivedAtLeast"; target: z.infer<typeof targetRefSchema>; amount: number }
  | { type: "damageDealtAtLeast"; target: z.infer<typeof targetRefSchema>; amount: number }
  | { type: "healingDoneAtLeast"; target: z.infer<typeof targetRefSchema>; amount: number }
  | { type: "deathCountAtLeast"; target: z.infer<typeof targetRefSchema>; count: number }
  | { type: "killCountAtLeast"; target: z.infer<typeof targetRefSchema>; count: number }
  | { type: "teamComposition"; side: "ally" | "enemy"; characterIds: string[] }
  // An escape hatch for a mechanic components genuinely cannot express
  // (CLAUDE.md rule 3). `scriptId` must be registered in DECISIONS.md under
  // "Custom script registry" before it is used by any character.
  | { type: "secretScript"; scriptId: string }
  | { type: "not"; condition: Condition }
  | { type: "and"; conditions: Condition[] }
  | { type: "or"; conditions: Condition[] };

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("always") }),
    z.object({
      type: z.literal("hpBelowPercent"),
      target: targetRefSchema,
      percent: z.number().min(0).max(100),
    }),
    z.object({
      type: z.literal("hasStatus"),
      target: targetRefSchema,
      statusId: idSchema,
    }),
    z.object({
      type: z.literal("hasTag"),
      target: targetRefSchema,
      tag: archetypeTagSchema,
    }),
    z.object({
      type: z.literal("resourceAtLeast"),
      target: targetRefSchema,
      resourceId: idSchema,
      amount: z.number().int(),
    }),
    z.object({
      type: z.literal("turnAtLeast"),
      turn: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("damageReceivedAtLeast"),
      target: targetRefSchema,
      amount: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("damageDealtAtLeast"),
      target: targetRefSchema,
      amount: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("healingDoneAtLeast"),
      target: targetRefSchema,
      amount: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("deathCountAtLeast"),
      target: targetRefSchema,
      count: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("killCountAtLeast"),
      target: targetRefSchema,
      count: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("teamComposition"),
      side: z.enum(["ally", "enemy"]),
      characterIds: z.array(idSchema).min(1),
    }),
    z.object({
      type: z.literal("secretScript"),
      scriptId: idSchema,
    }),
    z.object({ type: z.literal("not"), condition: conditionSchema }),
    z.object({ type: z.literal("and"), conditions: z.array(conditionSchema).min(1) }),
    z.object({ type: z.literal("or"), conditions: z.array(conditionSchema).min(1) }),
  ]),
);

// spec/02 "Trigger": when an effect/status/transformation is evaluated,
// paired with an optional extra condition it must also satisfy.
export const triggerEventSchema = z.enum([
  "onMatchStart",
  "onTurnStart",
  "onTurnEnd",
  "onAbilityUsed",
  "onDamaged",
  "onDamageDealt",
  "onHealed",
  "onStatusApplied",
  "onStatusExpired",
  "onResourceChanged",
  "onDeath",
  "onKill",
  "onResurrection",
]);
export type TriggerEvent = z.infer<typeof triggerEventSchema>;

export const triggerSchema = z.object({
  event: triggerEventSchema,
  condition: conditionSchema.optional(),
});
export type Trigger = z.infer<typeof triggerSchema>;
