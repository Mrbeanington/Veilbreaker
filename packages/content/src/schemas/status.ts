import { z } from "zod";
import { idSchema, knowledgeLevelSchema, targetRuleSchema } from "./common";
import { effectSchema } from "./effect";
import { triggerSchema } from "./condition";

// spec/02 "Status system": every status definition needs unique ID, display
// name, icon, source, target, duration, stack rules, max stacks, dispellable
// flag, hidden flag, trigger timing, visual treatment, and tooltip.
export const statusStackRuleSchema = z.enum(["none", "stack", "refresh", "stackAndRefresh"]);
export type StatusStackRule = z.infer<typeof statusStackRuleSchema>;

export const statusDurationSchema = z
  .object({
    turns: z.number().int().min(0).nullable(),
    permanent: z.boolean().default(false),
  })
  .refine((d) => d.permanent || d.turns !== null, {
    message: "duration.turns must be set unless duration.permanent is true",
  });
export type StatusDuration = z.infer<typeof statusDurationSchema>;

export const statusDefinitionSchema = z.object({
  id: idSchema,
  displayName: z.string().min(1),
  icon: z.string().min(1),
  source: z.enum(["ability", "passive", "transformation", "environment"]),
  defaultTarget: targetRuleSchema,
  duration: statusDurationSchema,
  stackRule: statusStackRuleSchema,
  maxStacks: z.number().int().min(1).default(1),
  dispellable: z.boolean().default(true),
  hidden: z.boolean().default(false),
  triggerTiming: z.array(triggerSchema).default([]),
  visualTreatment: z.string().min(1),
  tooltip: z.string().min(1),
  knowledgeLevel: knowledgeLevelSchema.default("PUBLIC"),
  effects: z.array(effectSchema).default([]),
});
export type StatusDefinition = z.infer<typeof statusDefinitionSchema>;
