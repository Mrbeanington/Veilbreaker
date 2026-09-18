import { z } from "zod";
import { archetypeTagSchema, idSchema, knowledgeLevelSchema, resourceSchema } from "./common";

// spec/03 "Categories": rarity is not power — Core characters can counter
// Secret and Legendary characters.
export const characterRaritySchema = z.enum(["CORE", "RARE", "SECRET", "LEGENDARY"]);
export type CharacterRarity = z.infer<typeof characterRaritySchema>;

// spec/02 "Core models": CharacterDefinition (versioned). `version` bumps
// whenever the definition's shape or values change under a new
// BalanceVersion (see config.ts); old replays keep resolving against the
// version they recorded (spec/02 "Balance versioning").
export const characterDefinitionSchema = z
  .object({
    id: idSchema,
    version: z.number().int().min(1),
    displayName: z.string().min(1),
    rarity: characterRaritySchema,
    tags: z.array(archetypeTagSchema).min(1),
    baseHp: z.number().int().positive(),
    abilityIds: z.array(idSchema).min(1).max(8),
    passiveId: idSchema.optional(),
    resources: z.array(resourceSchema).default([]),
    transformationIds: z.array(idSchema).default([]),
    // CLAUDE.md non-negotiable #8: "Powerful is acceptable. Uncounterable is
    // not." A Cheater breaks exactly one standard combat rule (spec/01
    // "Cheaters") and must document which one, and its counterplay.
    isCheater: z.boolean().default(false),
    cheaterRuleBreak: z.string().optional(),
    counterplay: z.string().optional(),
    knowledgeLevel: knowledgeLevelSchema.default("PUBLIC"),
    artSpecId: idSchema.optional(),
  })
  .refine((c) => !c.isCheater || (!!c.cheaterRuleBreak && !!c.counterplay), {
    message:
      "A Cheater character must document cheaterRuleBreak and counterplay (CLAUDE.md non-negotiables #8 and spec/01 'Cheaters').",
    path: ["cheaterRuleBreak"],
  });
export type CharacterDefinition = z.infer<typeof characterDefinitionSchema>;

// phase-04-first-five.md: the first real characters with resources (Malachar's
// Souls, Moonshot's Bases/Strikes, Whiskers' Nine Lives, Patient Zero's
// Outbreak Progress) are also the first thing that needs to turn a
// CharacterDefinition's resource list into the starting values a real match
// begins with — engine's `createBattle` takes those as a plain
// `Record<string, number>` (CreateBattleCharacterInput.resources) rather than
// reading CharacterDefinition itself, so whatever assembles a real roster
// into a battle (a future UI, a scenario test, packages/ai's bots) needs this
// exact conversion. One small, shared place for it now avoids every call site
// re-deriving "start every resource at its own startingValue" by hand.
export function defaultResourcesFor(character: CharacterDefinition): Record<string, number> {
  return Object.fromEntries(character.resources.map((resource) => [resource.id, resource.startingValue]));
}
