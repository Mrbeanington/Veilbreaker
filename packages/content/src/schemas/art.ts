import { z } from "zod";
import { idSchema } from "./common";

// spec/04 "Global art language" — prefixed onto every composed prompt
// (composePrompt, below) so no individual character spec has to repeat it.
export const GLOBAL_ART_LANGUAGE =
  "high-detail original 2D fantasy combat illustration, strong readable silhouette, dramatic graphic lighting, hand-painted texture, stylized anatomy, expressive faces, mythic atmosphere, clean ability-icon readability, dark neutral battlefield presentation, rich regional artistic inspiration where appropriate, modern competitive-game readability, no copyrighted logos, no modern franchise iconography, no text baked into character art";

// spec/04 "CharacterVisualBible (consistency)": a reusable per-character
// record of face, body type, clothing, weapons, markings, species, age
// range, silhouette, and signature props. Every prompt is composed from this
// (composePrompt) rather than regenerated from scratch, so the same
// character reads as the same character across splash art, icons, and a
// future transformation. `transformationArt`/`abilityIcons` are OQ-21's
// eventual shipped-asset paths (still placeholders — no real art exists
// yet), kept separate from the identity-anchor fields above them.
export const characterVisualBibleSchema = z.object({
  characterId: idSchema,
  species: z.string().min(1),
  ageRange: z.string().min(1),
  face: z.string().min(1),
  bodyType: z.string().min(1),
  clothingArmor: z.string().min(1),
  weaponsProps: z.string().min(1),
  markings: z.string().min(1),
  silhouette: z.string().min(1),
  signatureProps: z.array(z.string()).min(1),
  baseArtSpecId: idSchema,
  transformationArt: z.record(idSchema, z.string()).default({}),
  abilityIcons: z.record(idSchema, z.string()).default({}),
});
export type CharacterVisualBible = z.infer<typeof characterVisualBibleSchema>;

// spec/04 "Required art per character" + "CharacterArtSpec schema": every
// character needs a splash, portrait, battle avatar, four ability icons, and
// (when applicable) transformation/secret-silhouette/legend-reveal prompts.
// OQ-12: every spec starts (and stays, until Phase 14) `status: "draft"`,
// since a human — ideally from the represented culture — has to review final
// production art.
export const characterArtSpecSchema = z.object({
  characterId: idSchema,
  status: z.enum(["draft", "reviewed", "final"]).default("draft"),
  region: z.string().optional(),
  culturalConsultationNeeded: z.boolean().default(true),
  visualTheme: z.string().min(1),
  environment: z.string().min(1),
  lighting: z.string().min(1),
  specialEffects: z.string().optional(),
  paletteConcept: z.string().min(1),
  colorPalette: z.array(z.string()).default([]),
  poseNotes: z.string().optional(),
  // spec/04 "Forbidden references": never a franchise, a living artist, or a
  // copyrighted property. Authors note what to keep OUT of a generated image
  // here (a specific existing character/logo/style this design must not
  // drift toward) rather than relying on the generator to guess.
  avoid: z.array(z.string()).default([]),
  splashPrompt: z.string().min(1),
  portraitPrompt: z.string().min(1),
  battleAvatarPrompt: z.string().min(1),
  abilityIconPrompts: z.array(z.string()).min(1),
  transformationPrompts: z.array(z.string()).default([]),
  secretSilhouettePrompt: z.string().optional(),
  legendRevealPrompt: z.string().optional(),
});
export type CharacterArtSpec = z.infer<typeof characterArtSpecSchema>;

export type PromptShotType = "splash" | "portrait" | "battleAvatar" | "abilityIcon" | "transformation" | "secretSilhouette" | "legendReveal";

const SHOT_FRAMING: Record<PromptShotType, string> = {
  splash: "full-body splash illustration",
  portrait: "square roster-portrait crop, shoulders-up",
  battleAvatar: "small circular battle-avatar crop, face and shoulders only, reads clearly at tiny size",
  abilityIcon: "square ability-icon illustration, simplified for readability at small size",
  transformation: "full-body transformation reveal illustration",
  secretSilhouette: "featureless dark silhouette only — no readable detail beyond outline and one distinguishing highlight",
  legendReveal: "dramatic full-body legendary reveal illustration, more ornate lighting than a standard splash",
};

/**
 * spec/04 "Build a prompt-composer function that takes bible + shot type +
 * global language and returns the prompt, then validate that authored
 * prompts include the bible's identity anchors." One function, reused for
 * every shot type and every character, so a splash prompt and an ability
 * icon prompt for the same character can never silently drift apart on
 * species/face/silhouette the way two hand-written prompts could.
 */
export function composePrompt(bible: CharacterVisualBible, shotType: PromptShotType, sceneDetail: string): string {
  const identityAnchors = [
    bible.species,
    bible.ageRange,
    bible.face,
    bible.bodyType,
    bible.clothingArmor,
    bible.weaponsProps,
    bible.markings,
    bible.silhouette,
    ...bible.signatureProps,
  ].join(", ");
  return [SHOT_FRAMING[shotType], identityAnchors, sceneDetail, GLOBAL_ART_LANGUAGE, "no text, no logo"].join(", ");
}

/**
 * spec/04's own validation step: every composed prompt must actually contain
 * the bible's identity anchors, not just have been built from a function
 * that was supposed to include them (a hand-edited prompt could still drop
 * one). Returns the anchors missing from `prompt`, empty when it's clean.
 */
export function missingIdentityAnchors(bible: CharacterVisualBible, prompt: string): string[] {
  const anchors = [bible.species, bible.face, bible.bodyType, bible.silhouette];
  return anchors.filter((anchor) => !prompt.includes(anchor));
}
