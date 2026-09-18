import { z } from "zod";
import { archetypeTagSchema, costSchema, idSchema, knowledgeLevelSchema } from "./common";
import { conditionSchema } from "./condition";

// spec/02 "Transformation engine": a transformation moves a character from
// one stage to another. The trigger is a Condition (see condition.ts), which
// already covers every trigger kind spec/02 lists (HP thresholds, damage
// received/inflicted, turn counts, deaths, kills, healing, resources,
// statuses, team/enemy composition, and secret conditions via
// `secretScript`). `fromStageId: null` means "from the base form".
export const transformationChangesSchema = z.object({
  portrait: z.string().optional(),
  displayName: z.string().optional(),
  maxHp: z.number().int().positive().optional(),
  abilityIds: z.array(idSchema).optional(),
  passiveId: idSchema.optional(),
  tags: z.array(archetypeTagSchema).optional(),
  energyCostOverrides: z.record(idSchema, costSchema).optional(),
  cooldownOverrides: z.record(idSchema, z.number().int().min(0)).optional(),
  animationCue: z.string().optional(),
  soundCue: z.string().optional(),
  battleBackgroundEffect: z.string().optional(),
});
export type TransformationChanges = z.infer<typeof transformationChangesSchema>;

export const transformationSchema = z.object({
  id: idSchema,
  characterId: idSchema,
  fromStageId: idSchema.nullable(),
  toStageId: idSchema,
  trigger: conditionSchema,
  changes: transformationChangesSchema,
  knowledgeLevel: knowledgeLevelSchema.default("DISCOVERABLE"),
});
export type Transformation = z.infer<typeof transformationSchema>;
