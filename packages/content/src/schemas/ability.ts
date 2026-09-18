import { z } from "zod";
import { archetypeTagSchema, costSchema, idSchema, knowledgeLevelSchema, targetRuleSchema } from "./common";
import { effectSchema } from "./effect";

// spec/01 "Design commandment": an ability should be understandable in
// about 5 seconds, so this schema deliberately stays flat — depth comes from
// how effects/statuses/conditions interact, not from a deep ability shape.
export const abilitySchema = z.object({
  id: idSchema,
  displayName: z.string().min(1),
  description: z.string().min(1),
  cost: costSchema,
  cooldown: z.number().int().min(0).default(0),
  target: targetRuleSchema,
  effects: z.array(effectSchema).min(1),
  tags: z.array(archetypeTagSchema).default([]),
  knowledgeLevel: knowledgeLevelSchema.default("PUBLIC"),
});
export type Ability = z.infer<typeof abilitySchema>;
