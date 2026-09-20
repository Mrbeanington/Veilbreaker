import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #67 JIANGSHI (World Folklore) — the hopping corpse that feeds on the breath of the living. It drains energy and hits hard; a paper charm on the brow is its old weakness. docs/design/characters/jiangshi.md

export const GRAVE_CLAW = ability({
  id: "ability.jiangshi.grave-claw",
  displayName: "Grave Claw",
  description: "Stiff, hooked fingers: 20 damage and Bleed.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.bleed", magnitude: 5, durationTurns: 2 }],
});
export const HOPPING_STRIKE = ability({
  id: "ability.jiangshi.hopping-strike",
  displayName: "Hopping Strike",
  description: "A stiff-legged pounce: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const QI_DRAIN = ability({
  id: "ability.jiangshi.qi-drain",
  displayName: "Qi Drain",
  description: "Takes the breath of the living: steals 1 energy from the enemy team for itself.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "drainEnergy", family: "any", amount: 1, grantToSelf: true }],
});
export const RIGOR = ability({
  id: "ability.jiangshi.rigor",
  displayName: "Rigor",
  description: "Goes stiff as a board: takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const JIANGSHI_ABILITIES: Ability[] = [GRAVE_CLAW, HOPPING_STRIKE, QI_DRAIN, RIGOR];

export const JIANGSHI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "jiangshi",
  version: 1,
  displayName: "Jiangshi",
  rarity: "CORE",
  tags: ["FOLKLORE", "UNDEAD", "BRUISER"],
  baseHp: 140,
  abilityIds: JIANGSHI_ABILITIES.map((a) => a.id),
  artSpecId: "jiangshi",
});

const built = buildArt({
  bible: {
    characterId: "jiangshi",
    species: "a hopping corpse of Chinese folk horror",
    ageRange: "long dead",
    face: "a pale, blank face with sunken eyes and a yellow paper charm stuck to the forehead",
    bodyType: "stiff and upright with the arms held straight out",
    clothingArmor: "a dark Qing-style official's robe and a tall stiff hat",
    weaponsProps: "long dark nails and a strip of yellow paper",
    markings: "faded red writing-free brush marks on the charm",
    silhouette: "a stiff figure with arms outstretched and a paper charm on the brow",
    signatureProps: ["a paper charm on the brow", "outstretched arms", "an official's tall hat"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "a corpse that will not lie down",
  environment: "a moonlit country road with a lantern",
  lighting: "cold blue moonlight and a single warm lantern",
  paletteConcept: "official blue, grave grey, charm yellow, shadow",
  avoid: ["any existing game's jiangshi design"],
  splashScene: "hopping down a moonlit road with arms out and a lantern swinging behind him",
  portraitScene: "a pale face under a tall hat with a charm on the forehead",
  avatarScene: "close crop on the charm and eyes",
  iconScenes: ["hooked pale fingers, for Grave Claw", "a stiff figure mid-hop, for Hopping Strike", "a wisp of breath drawn towards a mouth, for Qi Drain", "a figure standing stiff as a plank, for Rigor"],
});
export const JIANGSHI_VISUAL_BIBLE = built.bible;
export const JIANGSHI_ART = built.art;
