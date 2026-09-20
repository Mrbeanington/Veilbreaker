import { GLOBAL_ART_LANGUAGE, missingIdentityAnchors, type CharacterArtSpec, type CharacterVisualBible } from "./schemas/art";
import type { CharacterDefinition } from "./schemas/character";
import type { Transformation } from "./schemas/transformation";

// phase-14 "Art spec completion and audit": one function that checks every
// character's art spec and visual bible against spec/04, so a bad prompt fails
// the build instead of reaching an image generator. Errors fail the audit;
// warnings are advice for the humans doing cultural review and production.

export type AuditLevel = "error" | "warning";
export interface AuditFinding {
  level: AuditLevel;
  characterId: string;
  field: string;
  message: string;
}

export interface ArtAuditInput {
  characters: readonly CharacterDefinition[];
  art: Readonly<Record<string, CharacterArtSpec>>;
  bibles: Readonly<Record<string, CharacterVisualBible>>;
  transformations: Readonly<Record<string, Transformation>>;
}

/** Phrases that ask an image generator to imitate a style, a franchise or a living artist (spec/04 "Forbidden references"). */
const STYLE_IMITATION = /\b(?:in the style of|in the manner of|in a style similar|drawn like|painted like|inspired by the work of|reminiscent of|a la)\b/i;
const FRANCHISES =
  /\b(?:naruto|bleach|one piece|dragon ball|pok[eé]mon|digimon|disney|pixar|marvel|dc comics|ghibli|zelda|final fantasy|dark souls|elden ring|warcraft|league of legends|dota|hearthstone|magic the gathering|yu-?gi-?oh|street fighter|mortal kombat|the witcher|lord of the rings|harry potter|star wars|star trek|game of thrones|god of war|assassin'?s creed|overwatch|fortnite|minecraft|super mario|sonic the hedgehog|persona 5|genshin|hollow knight|slay the spire)\b/i;
/** A small list of living working artists whose names image prompts are known to lean on. */
const LIVING_ARTISTS = /\b(?:greg rutkowski|rutkowski|artgerm|hayao miyazaki|miyazaki|yoshitaka amano|takehiko inoue|wlop|loish|sakimichan|kim jung gi|james jean|ilya kuvshinov)\b/i;
/** "by Firstname Lastname" reads as an artist credit. */
const ARTIST_CREDIT = /\bby [A-Z][a-z]+ [A-Z][a-z]+\b/;
/** Anything that asks for lettering to appear in the art. The allowed negatives are removed before this runs. */
const TEXT_REQUEST = /\b(?:text|texts|logo|logos|lettering|letters|caption|subtitle|watermark|signature|typography|slogan|words|inscription|wordmark|title card|small print|fine print)\b/i;
const ALLOWED_NEGATIVES = ["no text baked into character art", "no text, no logo", "no copyrighted logos"];

/** Identity anchors of a bible are present in a prompt (the four spec/04 requires, plus the signature props). */
function stripAllowed(prompt: string): string {
  let out = prompt;
  for (const phrase of ALLOWED_NEGATIVES) out = out.split(phrase).join("");
  return out;
}

/** The free-text fields of a spec that a generator reads, with the name of each. `avoid` is excluded: it names what to keep OUT. */
function textFields(art: CharacterArtSpec, bible: CharacterVisualBible): [string, string][] {
  const list: [string, string][] = [
    ["splashPrompt", art.splashPrompt],
    ["portraitPrompt", art.portraitPrompt],
    ["battleAvatarPrompt", art.battleAvatarPrompt],
    ...art.abilityIconPrompts.map((p, i): [string, string] => [`abilityIconPrompts[${i}]`, p]),
    ...art.transformationPrompts.map((p, i): [string, string] => [`transformationPrompts[${i}]`, p]),
  ];
  if (art.secretSilhouettePrompt) list.push(["secretSilhouettePrompt", art.secretSilhouettePrompt]);
  if (art.legendRevealPrompt) list.push(["legendRevealPrompt", art.legendRevealPrompt]);
  list.push(["visualTheme", art.visualTheme], ["environment", art.environment], ["lighting", art.lighting], ["paletteConcept", art.paletteConcept]);
  list.push(["bible.face", bible.face], ["bible.clothingArmor", bible.clothingArmor], ["bible.weaponsProps", bible.weaponsProps], ["bible.markings", bible.markings]);
  return list;
}

export function auditArt(input: ArtAuditInput): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const add = (level: AuditLevel, characterId: string, field: string, message: string) => findings.push({ level, characterId, field, message });
  const seenPrompts = new Map<string, string>();
  const seenPalettes = new Map<string, string>();

  for (const character of input.characters) {
    const id = character.id;
    const art = input.art[id];
    const bible = input.bibles[id];
    if (!art) add("error", id, "art", "has no CharacterArtSpec");
    if (!bible) add("error", id, "bible", "has no CharacterVisualBible");
    if (!art || !bible) continue;

    // 1. Nothing empty.
    const required: [string, string][] = [
      ["visualTheme", art.visualTheme],
      ["environment", art.environment],
      ["lighting", art.lighting],
      ["paletteConcept", art.paletteConcept],
      ["region", art.region ?? ""],
      ["splashPrompt", art.splashPrompt],
      ["portraitPrompt", art.portraitPrompt],
      ["battleAvatarPrompt", art.battleAvatarPrompt],
      ["bible.species", bible.species],
      ["bible.ageRange", bible.ageRange],
      ["bible.face", bible.face],
      ["bible.bodyType", bible.bodyType],
      ["bible.clothingArmor", bible.clothingArmor],
      ["bible.weaponsProps", bible.weaponsProps],
      ["bible.markings", bible.markings],
      ["bible.silhouette", bible.silhouette],
    ];
    for (const [field, value] of required) if (value.trim().length === 0) add("error", id, field, "is empty");
    if (bible.signatureProps.length === 0 || bible.signatureProps.some((p) => p.trim().length === 0)) add("error", id, "bible.signatureProps", "is empty");
    if (art.colorPalette.length === 0 || art.colorPalette.some((p) => p.trim().length === 0)) add("error", id, "colorPalette", "is empty");
    if (art.abilityIconPrompts.length < 4) add("error", id, "abilityIconPrompts", `has ${art.abilityIconPrompts.length} prompts; every character needs at least four`);
    art.abilityIconPrompts.forEach((p, i) => p.trim().length === 0 && add("error", id, `abilityIconPrompts[${i}]`, "is empty"));
    if (art.characterId !== id || bible.characterId !== id || bible.baseArtSpecId !== id) add("error", id, "characterId", "art spec and bible do not point at this character");

    // 2. Every prompt carries the identity anchors.
    for (const [field, prompt] of textFields(art, bible).filter(([f]) => f.endsWith("Prompt") || f.includes("Prompts"))) {
      const missing = missingIdentityAnchors(bible, prompt);
      if (missing.length > 0) add("error", id, field, `is missing identity anchors: ${missing.join(" | ")}`);
      if (!prompt.includes(GLOBAL_ART_LANGUAGE)) add("warning", id, field, "does not contain the global art language line");
      const seen = seenPrompts.get(prompt);
      if (seen && seen !== id) add("warning", id, field, `is identical to a prompt of ${seen}`);
      seenPrompts.set(prompt, id);
      if (prompt.length > 2400) add("warning", id, field, `is ${prompt.length} characters; some generators truncate long prompts`);
    }

    // 3. Forbidden references and requests for text.
    for (const [field, raw] of textFields(art, bible)) {
      const text = stripAllowed(raw);
      if (STYLE_IMITATION.test(text)) add("error", id, field, "asks for a style imitation");
      if (FRANCHISES.test(text)) add("error", id, field, `names a franchise (${text.match(FRANCHISES)?.[0]})`);
      if (LIVING_ARTISTS.test(text)) add("error", id, field, `names a living artist (${text.match(LIVING_ARTISTS)?.[0]})`);
      if (ARTIST_CREDIT.test(text)) add("error", id, field, `reads like an artist credit (${text.match(ARTIST_CREDIT)?.[0]})`);
      if (TEXT_REQUEST.test(text)) add("error", id, field, `may ask for lettering in the art (${text.match(TEXT_REQUEST)?.[0]})`);
    }

    // 4. Secrets have silhouettes, Legends have reveals, transformed states have art.
    if (character.rarity === "SECRET" && !art.secretSilhouettePrompt) add("error", id, "secretSilhouettePrompt", "is required for a Secret");
    if (character.rarity === "LEGENDARY" && !art.legendRevealPrompt) add("error", id, "legendRevealPrompt", "is required for a Legend");
    if (art.secretSilhouettePrompt && !/featureless dark silhouette/.test(art.secretSilhouettePrompt)) add("warning", id, "secretSilhouettePrompt", "does not use the featureless-silhouette framing");
    const stages = character.transformationIds.map((t) => input.transformations[t]).filter((t): t is Transformation => t !== undefined);
    if (art.transformationPrompts.length < character.transformationIds.length) {
      add("error", id, "transformationPrompts", `has ${art.transformationPrompts.length} prompts for ${character.transformationIds.length} transformed state(s): ${stages.map((t) => t.toStageId).join(", ")}`);
    }

    // 5. Status stays draft until a human reviews it (OQ-12).
    if (art.status !== "draft") add("error", id, "status", `is "${art.status}"; every spec stays draft until cultural review (OQ-12)`);
    if (!art.culturalConsultationNeeded) add("warning", id, "culturalConsultationNeeded", "is false; only a reviewer should clear this");

    // 6. Two characters should not share a palette word for word.
    const paletteKey = art.paletteConcept.trim().toLowerCase();
    const paletteOwner = seenPalettes.get(paletteKey);
    if (paletteOwner) add("warning", id, "paletteConcept", `is identical to the palette of ${paletteOwner}`);
    seenPalettes.set(paletteKey, id);
  }
  return findings;
}

export function summarizeAudit(findings: readonly AuditFinding[]): string {
  const errors = findings.filter((f) => f.level === "error");
  const warnings = findings.filter((f) => f.level === "warning");
  const lines = [`art audit: ${errors.length} error(s), ${warnings.length} warning(s)`];
  for (const f of findings) lines.push(`  ${f.level.toUpperCase()} ${f.characterId} ${f.field}: ${f.message}`);
  return lines.join("\n");
}
