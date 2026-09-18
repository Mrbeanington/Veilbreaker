import { z } from "zod";
import { idSchema } from "./common";

// spec/04 art direction + OQ-12: each culture needs specific research before
// final visual production, which Claude Code cannot substitute for. Every
// spec starts `status: "draft"` and stays there until a human (ideally from
// the represented culture) reviews it.
export const characterArtSpecSchema = z.object({
  characterId: idSchema,
  status: z.enum(["draft", "reviewed", "final"]).default("draft"),
  region: z.string().optional(),
  visualDescription: z.string().min(1),
  colorPalette: z.array(z.string()).default([]),
  poseNotes: z.string().optional(),
  culturalConsultationNeeded: z.boolean().default(true),
});
export type CharacterArtSpec = z.infer<typeof characterArtSpecSchema>;

// spec/02 "Data model": maps a character's stages/abilities to shipped
// static art assets (OQ-21 — no runtime image generation API).
export const characterVisualBibleSchema = z.object({
  characterId: idSchema,
  baseArtSpecId: idSchema,
  transformationArt: z.record(idSchema, z.string()).default({}),
  abilityIcons: z.record(idSchema, z.string()).default({}),
});
export type CharacterVisualBible = z.infer<typeof characterVisualBibleSchema>;
