import { z } from "zod";
import { idSchema, knowledgeLevelSchema } from "./common";
import { conditionSchema, triggerSchema } from "./condition";
import { effectSchema } from "./effect";

// phase-03-advanced-systems.md "Triggers and Conditions": a passive is a
// standalone, reusable trigger→condition→effects bundle (CLAUDE.md rule 3 —
// characters compose reusable components, not bespoke reactive code).
// Referenced by `CharacterDefinition.passiveId` and by
// `CharacterRuntimeState.passiveId` (which can change via a Transformation's
// `changes.passiveId`, per spec/02's transformation engine).
export const passiveDefinitionSchema = z.object({
  id: idSchema,
  displayName: z.string().min(1),
  description: z.string().min(1),
  trigger: triggerSchema,
  // An additional condition beyond the trigger's own — kept separate so a
  // single trigger definition can be reused with different gating logic
  // without duplicating the event/relation pairing.
  condition: conditionSchema.optional(),
  effects: z.array(effectSchema).min(1),
  knowledgeLevel: knowledgeLevelSchema.default("PUBLIC"),
});
export type PassiveDefinition = z.infer<typeof passiveDefinitionSchema>;
