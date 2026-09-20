import { GLOBAL_ART_LANGUAGE, type CharacterArtSpec, type CharacterVisualBible } from "./schemas/art";
import type { CharacterDefinition } from "./schemas/character";

// phase-14: one machine-readable file for an image-generation pipeline (or an
// artist). It is derived entirely from the character data, deterministic (no
// dates), and checked for freshness by a test, so it can never drift from the
// game.

export const ART_EXPORT_FORMAT = "veilbreak-art-specs";
export const ART_EXPORT_VERSION = 1;

/** What every asset should avoid. Paste it into a generator's negative-prompt field. */
export const GLOBAL_NEGATIVE_PROMPT =
  "text, letters, words, numbers, logo, watermark, signature, caption, frame with lettering, existing franchise character, existing game character, photorealistic, 3D render, blurry, low resolution, extra fingers, deformed hands, duplicated limbs, cropped head";

export type AssetKind = "splash" | "portrait" | "battleAvatar" | "abilityIcon" | "transformation" | "secretSilhouette" | "legendReveal";

/** Suggested canvas per asset so a whole roster comes out at the same sizes and crops. */
export const ASSET_SIZES: Record<AssetKind, { width: number; height: number; note: string }> = {
  splash: { width: 1024, height: 1536, note: "full body, portrait orientation" },
  portrait: { width: 1024, height: 1024, note: "square, shoulders up" },
  battleAvatar: { width: 512, height: 512, note: "keep the face inside the central circle" },
  abilityIcon: { width: 512, height: 512, note: "one bold shape, readable at 64 pixels" },
  transformation: { width: 1024, height: 1536, note: "same framing as the splash" },
  secretSilhouette: { width: 1024, height: 1536, note: "flat dark shape, one highlight" },
  legendReveal: { width: 1024, height: 1536, note: "same framing as the splash, more ornate light" },
};

export type ReviewPriority = "high" | "medium" | "low";

export interface CulturalGroup {
  id: string;
  label: string;
  /** How urgently a reviewer from or expert in this tradition should look (OQ-12). */
  priority: ReviewPriority;
  reason: string;
}

const GROUPS: { match: RegExp; group: CulturalGroup }[] = [
  { match: /japan|sumi|ink realm|east asian/i, group: { id: "japanese", label: "Japanese folklore and ink tradition", priority: "high", reason: "living tradition; yokai, oni and samurai imagery are easy to caricature" } },
  { match: /slavic|russian/i, group: { id: "slavic", label: "Slavic folklore", priority: "high", reason: "living folk tradition; ornament and costume should be checked against real sources" } },
  { match: /norse|celtic/i, group: { id: "norse-celtic", label: "Norse and Celtic myth", priority: "medium", reason: "often flattened into stereotypes; knotwork and war-paint patterns are original but should be checked" } },
  { match: /egypt|desert/i, group: { id: "egyptian-desert", label: "Egyptian and desert traditions", priority: "high", reason: "sacred imagery; the specs use invented geometry, never copied sacred text" } },
  { match: /folk-?tale|world folk/i, group: { id: "world-folklore", label: "World folklore (several cultures)", priority: "high", reason: "one region string covers West African, Korean, Chinese, Arabian and other traditions; each needs its own reviewer" } },
  { match: /mediterranean|greek/i, group: { id: "mediterranean", label: "Ancient Mediterranean", priority: "low", reason: "long-public-domain material; standard care" } },
  { match: /gothic|folk-horror|horror/i, group: { id: "gothic-horror", label: "Gothic and folk horror", priority: "low", reason: "mostly invented; check for real-world medical or religious imagery" } },
  { match: /stadium|ring|sport|stage|studio|theatre|concert/i, group: { id: "entertainment", label: "Sport and stage", priority: "low", reason: "invented archetypes; check no real team, league or person is suggested" } },
  { match: /storybook-animal|tall-tale/i, group: { id: "animal-tales", label: "Animal tall tales", priority: "low", reason: "invented; standard care" } },
];

export function culturalGroupOf(region: string | undefined): CulturalGroup {
  const found = GROUPS.find((g) => g.match.test(region ?? ""));
  return found?.group ?? { id: "original", label: "Original, no single culture", priority: "low", reason: "invented; standard care" };
}

export interface ExportedAsset {
  id: string;
  kind: AssetKind;
  /** Which ability the icon is for, when it is one. */
  index?: number;
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
}

export interface ExportedCharacter {
  id: string;
  displayName: string;
  rarity: string;
  playable: boolean;
  region: string;
  culturalGroup: string;
  reviewPriority: ReviewPriority;
  status: string;
  culturalConsultationNeeded: boolean;
  bible: CharacterVisualBible;
  visualTheme: string;
  environment: string;
  lighting: string;
  paletteConcept: string;
  colorPalette: string[];
  avoid: string[];
  assets: ExportedAsset[];
}

export interface ArtExport {
  format: typeof ART_EXPORT_FORMAT;
  version: typeof ART_EXPORT_VERSION;
  globalArtLanguage: string;
  globalNegativePrompt: string;
  assetSizes: typeof ASSET_SIZES;
  pipelineGuidance: string[];
  culturalGroups: (CulturalGroup & { characters: string[] })[];
  counts: { characters: number; playable: number; assets: number; byKind: Record<string, number> };
  characters: ExportedCharacter[];
}

/** How to run the export so the roster looks like one game. Kept in the file so it travels with the prompts. */
export const PIPELINE_GUIDANCE: string[] = [
  "Every prompt already begins with the same framing and ends with the same global art language. Do not add a style, an artist or a franchise to any prompt.",
  "Make a reference set first: four characters from four different regions (for example one Core, one Secret, one Legend and one from the highest-priority cultural group). Tune model, seed strategy, sampler, guidance and image size on these until they look like one game, then freeze those settings.",
  "Use the frozen settings and the same negative prompt for every asset. Change only the prompt text between characters.",
  "Generate one character at a time in this order: portrait, splash, battle avatar, four ability icons, then any transformation, silhouette or reveal. The portrait becomes the reference image for the rest of that character.",
  "Where the generator supports a reference image or a character-consistency feature, feed it that character's portrait and the shared reference set's style image, never another character's art.",
  "Keep the canvas sizes in `assetSizes`. Ability icons must stay readable at 64 pixels: one bold shape, no fine detail.",
  "Text in the art is never allowed. Reject any image with lettering, a logo, a watermark or a signature and regenerate it.",
  "Every spec is `draft` and `culturalConsultationNeeded` until a human reviews it. Start review with the `high` priority groups in `culturalGroups`. Do not promote a status to `reviewed` or `final` without that review.",
];

function assetsOf(id: string, art: CharacterArtSpec): ExportedAsset[] {
  const out: ExportedAsset[] = [];
  const add = (kind: AssetKind, prompt: string, index?: number) => {
    const size = ASSET_SIZES[kind];
    out.push({ id: index === undefined ? `${id}.${kind}` : `${id}.${kind}.${index + 1}`, kind, ...(index === undefined ? {} : { index }), prompt, negativePrompt: GLOBAL_NEGATIVE_PROMPT, width: size.width, height: size.height });
  };
  add("portrait", art.portraitPrompt);
  add("splash", art.splashPrompt);
  add("battleAvatar", art.battleAvatarPrompt);
  art.abilityIconPrompts.forEach((p, i) => add("abilityIcon", p, i));
  art.transformationPrompts.forEach((p, i) => add("transformation", p, i));
  if (art.secretSilhouettePrompt) add("secretSilhouette", art.secretSilhouettePrompt);
  if (art.legendRevealPrompt) add("legendReveal", art.legendRevealPrompt);
  return out;
}

export interface ArtExportInput {
  characters: readonly CharacterDefinition[];
  art: Readonly<Record<string, CharacterArtSpec>>;
  bibles: Readonly<Record<string, CharacterVisualBible>>;
  /** Ids that are not separate picks (a stage of another character) and are exported but marked not playable. */
  nonPlayableIds: ReadonlySet<string>;
}

export function buildArtExport(input: ArtExportInput): ArtExport {
  const characters: ExportedCharacter[] = [];
  for (const c of input.characters) {
    const art = input.art[c.id];
    const bible = input.bibles[c.id];
    if (!art || !bible) continue;
    const group = culturalGroupOf(art.region);
    characters.push({
      id: c.id,
      displayName: c.displayName,
      rarity: c.rarity,
      playable: !input.nonPlayableIds.has(c.id),
      region: art.region ?? "",
      culturalGroup: group.id,
      reviewPriority: group.priority,
      status: art.status,
      culturalConsultationNeeded: art.culturalConsultationNeeded,
      bible,
      visualTheme: art.visualTheme,
      environment: art.environment,
      lighting: art.lighting,
      paletteConcept: art.paletteConcept,
      colorPalette: art.colorPalette,
      avoid: art.avoid,
      assets: assetsOf(c.id, art),
    });
  }
  const byKind: Record<string, number> = {};
  for (const ch of characters) for (const a of ch.assets) byKind[a.kind] = (byKind[a.kind] ?? 0) + 1;
  const groups = new Map<string, CulturalGroup & { characters: string[] }>();
  for (const ch of characters) {
    const g = culturalGroupOf(input.art[ch.id]?.region);
    const entry = groups.get(g.id) ?? { ...g, characters: [] };
    entry.characters.push(ch.id);
    groups.set(g.id, entry);
  }
  const order: Record<ReviewPriority, number> = { high: 0, medium: 1, low: 2 };
  return {
    format: ART_EXPORT_FORMAT,
    version: ART_EXPORT_VERSION,
    globalArtLanguage: GLOBAL_ART_LANGUAGE,
    globalNegativePrompt: GLOBAL_NEGATIVE_PROMPT,
    assetSizes: ASSET_SIZES,
    pipelineGuidance: PIPELINE_GUIDANCE,
    culturalGroups: [...groups.values()].sort((a, b) => order[a.priority] - order[b.priority] || a.id.localeCompare(b.id)),
    counts: { characters: characters.length, playable: characters.filter((c) => c.playable).length, assets: characters.reduce((n, c) => n + c.assets.length, 0), byKind },
    characters,
  };
}
