import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { summonSchema, type Summon } from "../../schemas/summon";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #37 BABA YAGA. docs/design/characters/baba-yaga.md

export const HUT_SUMMON: Summon = summonSchema.parse({
  id: "summon.baba-yaga.chicken-legged-hut",
  displayName: "Chicken-Legged Hut",
  occupiesSlot: false,
  hp: 40,
  duration: { turns: 3, permanent: false },
});

// Whenever an enemy dies, she feeds — `effectTarget: "self"` (ADR-011).
export const OLD_HUNGER: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.baba-yaga.old-hunger",
  displayName: "Old Hunger",
  description: "Whenever an enemy falls, she recovers 20 HP.",
  trigger: { event: "onDeath", relation: "enemy", effectTarget: "self" },
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});

export const HUT_ON_LEGS = ability({
  id: "ability.baba-yaga.hut-on-legs",
  displayName: "Hut on Legs",
  description: "Calls her hut to stand guard, absorbing damage meant for her.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "summon", summonId: HUT_SUMMON.id }],
});
export const MORTAR_FLIGHT = ability({
  id: "ability.baba-yaga.mortar-flight",
  displayName: "Mortar Flight",
  description: "Takes to the sky, untargetable for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const BLIGHTED_BREW = ability({
  id: "ability.baba-yaga.blighted-brew",
  displayName: "Blighted Brew",
  description: "A foul draught: damage and lingering poison.",
  cost: { chaos: 1, spirit: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 15 },
    { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 },
  ],
});
export const EVIL_EYE = ability({
  id: "ability.baba-yaga.evil-eye",
  displayName: "Evil Eye",
  description: "Weakens an enemy's blows.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});

export const BABA_YAGA_ABILITIES: Ability[] = [HUT_ON_LEGS, MORTAR_FLIGHT, BLIGHTED_BREW, EVIL_EYE];

export const BABA_YAGA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "baba-yaga",
  version: 1,
  displayName: "Baba Yaga",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "SUMMONER", "CONTROLLER"],
  baseHp: 120,
  abilityIds: BABA_YAGA_ABILITIES.map((a) => a.id),
  passiveId: OLD_HUNGER.id,
  artSpecId: "baba-yaga",
});

const built = buildArt({
  bible: {
    characterId: "baba-yaga",
    species: "an ancient witch of Slavic folklore",
    ageRange: "impossibly old",
    face: "a hooked nose, sharp chin and bright suspicious eyes",
    bodyType: "bent and wiry with surprising strength",
    clothingArmor: "layered patched shawls and a knotted headscarf",
    weaponsProps: "a wooden mortar and a broom-like pestle",
    markings: "soot smudges and ash-grey hair in long braids",
    silhouette: "a hunched figure standing in a wooden mortar",
    signatureProps: ["the mortar and pestle", "the hut on chicken legs"],
  },
  region: "Slavic (deep forests, folk ornament, wood carving; cultural review required, OQ-12)",
  visualTheme: "a hospitable horror who eats guests",
  environment: "a birch forest clearing with a hut on huge bird legs",
  lighting: "dusk light through birch trunks with a hearth glow from the hut",
  paletteConcept: "soot grey, birch white, ember orange",
  avoid: ["any existing game's Baba Yaga design"],
  splashScene: "riding the mortar above a birch clearing, the hut looming on its legs behind her",
  portraitScene: "leaning in from the side with a knowing grin, hearth glow on her face",
  avatarScene: "close crop on the hooked nose and eyes",
  iconScenes: [
    "a hut with huge bird legs, for Hut on Legs",
    "a mortar trailing sparks across the moon, for Mortar Flight",
    "a bubbling cauldron with green steam, for Blighted Brew",
    "a single bright eye in the dark, for Evil Eye",
  ],
});
export const BABA_YAGA_VISUAL_BIBLE = built.bible;
export const BABA_YAGA_ART = built.art;
