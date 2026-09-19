import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #21 LANTERN SPIRIT (Japanese Folklore) — a small guiding flame. He
// makes energy for his team and burns himself out to make more. Fragile, and
// even his death is a gift. docs/design/characters/lantern-spirit.md

export const LAST_LIGHT: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.lantern-spirit.last-light",
  displayName: "Last Light",
  description: "When he goes out, his team gains 2 Spirit energy.",
  trigger: { event: "onDeath", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyEnergy", family: "SPIRIT", amount: 2 }],
});

export const FLICKER = ability({
  id: "ability.lantern-spirit.flicker",
  displayName: "Flicker",
  description: "A hot spark: 10 damage and Burn.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 2 },
  ],
});
export const GUIDING_FLAME = ability({
  id: "ability.lantern-spirit.guiding-flame",
  displayName: "Guiding Flame",
  description: "Lights the way: his team gains 2 Spirit energy, and an ally heals 10.",
  cost: { neutral: 1 },
  cooldown: 1,
  target: ALLY_SINGLE,
  effects: [
    { kind: "modifyEnergy", family: "SPIRIT", amount: 2 },
    { kind: "heal", healingClass: "heal", amount: 10 },
  ],
});
export const LANTERN_WARD = ability({
  id: "ability.lantern-spirit.lantern-ward",
  displayName: "Lantern Ward",
  description: "An ally takes 10 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 2 }],
});
export const BURN_BRIGHT = ability({
  id: "ability.lantern-spirit.burn-bright",
  displayName: "Burn Bright",
  description: "Burns himself for 20 health to give his team 2 Might and 1 Chaos energy.",
  cost: {},
  cooldown: 4,
  target: SELF_ONLY,
  effects: [
    { kind: "damage", amount: 20, damageType: "affliction", target: SELF_ONLY },
    { kind: "modifyEnergy", family: "MIGHT", amount: 2 },
    { kind: "modifyEnergy", family: "CHAOS", amount: 1 },
  ],
});

export const LANTERN_SPIRIT_ABILITIES: Ability[] = [FLICKER, GUIDING_FLAME, LANTERN_WARD, BURN_BRIGHT];

export const LANTERN_SPIRIT: CharacterDefinition = characterDefinitionSchema.parse({
  id: "lantern-spirit",
  version: 1,
  displayName: "Lantern Spirit",
  rarity: "RARE",
  tags: ["FOLKLORE", "SUPPORT", "MAGE"],
  baseHp: 80,
  abilityIds: LANTERN_SPIRIT_ABILITIES.map((a) => a.id),
  passiveId: LAST_LIGHT.id,
  artSpecId: "lantern-spirit",
});

const built = buildArt({
  bible: {
    characterId: "lantern-spirit",
    species: "an old paper lantern come to life, from Japanese folklore",
    ageRange: "a hundred years old",
    face: "a paper lantern body with one wide eye and a long thin tongue of flame",
    bodyType: "round and squat on two small feet",
    clothingArmor: "none — torn, patched paper and a wooden frame",
    weaponsProps: "a single flickering flame inside the body",
    markings: "a faded family crest painted on the paper in an original design",
    silhouette: "a round glowing shape on small feet, with a wisp of flame at its top",
    signatureProps: ["a paper body", "one big eye", "a glowing flame"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "the smallest light in the darkest place",
  environment: "a dark shrine path with stone lanterns",
  lighting: "warm amber glow lighting only the near ground",
  paletteConcept: "lantern amber, paper cream, night blue, ember orange",
  avoid: ["any existing game's lantern-ghost design"],
  splashScene: "hopping down a dark shrine path with the flame flaring behind him",
  portraitScene: "a single round eye lit from inside, paper glowing",
  avatarScene: "close crop on the eye and flame",
  iconScenes: [
    "a spark leaping from a lantern, for Flicker",
    "a beam of amber light along a dark path, for Guiding Flame",
    "a ring of light around a small figure, for Lantern Ward",
    "a paper lantern flaring white-hot, for Burn Bright",
  ],
});
export const LANTERN_SPIRIT_VISUAL_BIBLE = built.bible;
export const LANTERN_SPIRIT_ART = built.art;
