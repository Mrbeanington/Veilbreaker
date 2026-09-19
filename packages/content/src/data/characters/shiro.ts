import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #2 Legend SHIRO, THE LAST BRUSH: eventually erases weakened
// characters, bypassing death triggers. See docs/design/characters/shiro.md.

export const INK_SLASH = ability({
  id: "ability.shiro.ink-slash",
  displayName: "Ink Slash",
  description: "A fast brush-stroke cut.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const WASH_AWAY = ability({
  id: "ability.shiro.wash-away",
  displayName: "Wash Away",
  description: "Bleeds the strength from an enemy's strokes.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const INK_VEIL = ability({
  id: "ability.shiro.ink-veil",
  displayName: "Ink Veil",
  description: "Dissolves into ink, briefly untargetable.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
// The Legend's payoff: below 30% HP the target is erased outright (no death
// triggers fire); otherwise it is only a modest cut.
export const FINAL_STROKE = ability({
  id: "ability.shiro.final-stroke",
  displayName: "Final Stroke",
  description: "Erases a badly wounded enemy from the battle entirely.",
  cost: { focus: 3, spirit: 2 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hpBelowPercent", target: "target", percent: 30 },
      ifTrue: [{ kind: "erase" }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});

export const SHIRO_ABILITIES: Ability[] = [INK_SLASH, WASH_AWAY, INK_VEIL, FINAL_STROKE];

export const SHIRO: CharacterDefinition = characterDefinitionSchema.parse({
  id: "shiro",
  version: 1,
  displayName: "Shiro, the Last Brush",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "ASSASSIN", "MYTHOLOGY"],
  baseHp: 100,
  abilityIds: SHIRO_ABILITIES.map((a) => a.id),
  artSpecId: "shiro",
});

const built = buildArt({
  bible: {
    characterId: "shiro",
    species: "a living ink-wash warrior",
    ageRange: "ageless",
    face: "a calm monochrome face with brush-stroke features",
    bodyType: "lean and upright",
    clothingArmor: "loose robes rendered in layered black wash",
    weaponsProps: "a blade shaped like a long brush",
    markings: "restrained red seal-like accents in wholly original symbols",
    silhouette: "an upright figure whose edges dissolve into brush strokes",
    signatureProps: ["the brush-blade", "dissolving ink edges"],
  },
  region: "Japanese-inspired sumi-e tradition (cultural review required, OQ-12)",
  visualTheme: "a painting that decided to fight",
  environment: "blank paper-white space with faint ink mountains",
  lighting: "flat even light so ink contrast carries the image",
  paletteConcept: "ink black, paper white, a single seal red",
  avoid: ["any existing manga character or franchise iconography", "real kanji or sacred text"],
  splashScene: "mid-stroke, half his body dissolving into wet black brush strokes across white space",
  portraitScene: "the face half-rendered, one eye a single brush dot",
  avatarScene: "close crop on the face and one red seal accent",
  iconScenes: [
    "a single fast brush stroke slicing a shape, for Ink Slash",
    "ink draining down a running line, for Wash Away",
    "a figure dissolving into a black splash, for Ink Veil",
    "a brush lifting from a blank space where a figure was, for Final Stroke",
  ],
  legendRevealScene: "stepping out of a giant unfurling scroll as the arena around him turns to ink wash",
});
export const SHIRO_VISUAL_BIBLE = built.bible;
export const SHIRO_ART = built.art;
