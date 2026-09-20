import type { TargetRule } from "../../schemas/common";
import { abilitySchema, type Ability } from "../../schemas/ability";
import {
  characterArtSpecSchema,
  characterVisualBibleSchema,
  composePrompt,
  type CharacterArtSpec,
  type CharacterVisualBible,
} from "../../schemas/art";

// phase-06: compact builder for the visual bible + art spec pair every
// character needs (spec/04). Every prompt is composed from the bible
// (composePrompt), so nothing here can drift from the identity anchors.
export interface ArtInput {
  bible: Omit<CharacterVisualBible, "baseArtSpecId" | "transformationArt" | "abilityIcons">;
  region: string;
  visualTheme: string;
  environment: string;
  lighting: string;
  paletteConcept: string;
  avoid: string[];
  splashScene: string;
  portraitScene: string;
  avatarScene: string;
  iconScenes: string[];
  legendRevealScene?: string;
  secretSilhouetteScene?: string;
  /** One scene per transformed state (phase-14: every transformation needs art). */
  transformationScenes?: string[];
}

export function buildArt(input: ArtInput): { bible: CharacterVisualBible; art: CharacterArtSpec } {
  const id = input.bible.characterId;
  const bible = characterVisualBibleSchema.parse({ ...input.bible, baseArtSpecId: id });
  const art = characterArtSpecSchema.parse({
    characterId: id,
    region: input.region,
    visualTheme: input.visualTheme,
    environment: input.environment,
    lighting: input.lighting,
    paletteConcept: input.paletteConcept,
    avoid: input.avoid,
    splashPrompt: composePrompt(bible, "splash", input.splashScene),
    portraitPrompt: composePrompt(bible, "portrait", input.portraitScene),
    battleAvatarPrompt: composePrompt(bible, "battleAvatar", input.avatarScene),
    abilityIconPrompts: input.iconScenes.map((scene) => composePrompt(bible, "abilityIcon", scene)),
    legendRevealPrompt: input.legendRevealScene ? composePrompt(bible, "legendReveal", input.legendRevealScene) : undefined,
    transformationPrompts: (input.transformationScenes ?? []).map((scene) => composePrompt(bible, "transformation", scene)),
    secretSilhouettePrompt: input.secretSilhouetteScene
      ? composePrompt(bible, "secretSilhouette", input.secretSilhouetteScene)
      : undefined,
  });
  return { bible, art };
}

// phase-04-first-five.md: every character file below builds abilities out of
// the same handful of TargetRule shapes — named here once rather than
// repeated as object literals in every ability (CLAUDE.md rule 10: reusable
// beats hard-coded).
export const ENEMY_SINGLE: TargetRule = { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] };
export const ENEMY_ALL: TargetRule = { side: "enemy", scope: "all", count: 1, includeSelf: false, filterTags: [] };
export const ALLY_SINGLE: TargetRule = { side: "ally", scope: "single", count: 1, includeSelf: true, filterTags: [] };
export const SELF_ONLY: TargetRule = { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] };

// A TargetRule shape effects can set as their own `target` override to land
// on the caster instead of the ability's shared targetIds (packages/engine/
// src/effects.ts `resolveEffectTargets`, ADR-011) — used whenever one effect
// in an enemy- or ally-targeted ability needs to affect the caster.
export const EFFECT_TARGETS_SELF: TargetRule = SELF_ONLY;

// `cost` only needs the families actually spent — every family defaults to 0
// at parse time (costSchema), but the *output* Cost type requires all five,
// which would otherwise force every ability literal below to spell out
// `might: 0, focus: 0, ...` for families it never touches.
type PartialCost = Partial<Ability["cost"]>;

export function ability(
  overrides: Partial<Omit<Ability, "cost">> &
    Pick<Ability, "id" | "displayName" | "description" | "target" | "effects"> & { cost?: PartialCost },
): Ability {
  return abilitySchema.parse({
    cost: {},
    cooldown: 0,
    tags: [],
    knowledgeLevel: "PUBLIC",
    ...overrides,
  });
}
