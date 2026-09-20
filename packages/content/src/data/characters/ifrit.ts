import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #58 IFRIT (Egypt / Desert) — a djinn of fire. Everything he touches burns, and he hits the burning the hardest. docs/design/characters/ifrit.md

export const FLAME_LASH = ability({
  id: "ability.ifrit.flame-lash",
  displayName: "Flame Lash",
  description: "A whip of fire: 20 damage and Burn (5 a turn for 2 turns).",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.burn", magnitude: 5, durationTurns: 2 }],
});
export const IFRIT_CINDER_STORM = ability({
  id: "ability.ifrit.cinder-storm",
  displayName: "Cinder Storm",
  description: "A rain of embers: 20 damage and Burn (5 a turn) to every enemy.",
  cost: { might: 2, chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.burn", magnitude: 5, durationTurns: 2 }],
});
export const MOLTEN_FURY = ability({
  id: "ability.ifrit.molten-fury",
  displayName: "Molten Fury",
  description: "A fist of lava: 20 damage, or 40 against a burning enemy.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.burn" },
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const ASHEN_VEIL = ability({
  id: "ability.ifrit.ashen-veil",
  displayName: "Ashen Veil",
  description: "Wraps himself in ash and smoke: takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const IFRIT_ABILITIES: Ability[] = [FLAME_LASH, IFRIT_CINDER_STORM, MOLTEN_FURY, ASHEN_VEIL];

export const IFRIT: CharacterDefinition = characterDefinitionSchema.parse({
  id: "ifrit",
  version: 1,
  displayName: "Ifrit",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "MAGE", "ATTACKER"],
  baseHp: 100,
  abilityIds: IFRIT_ABILITIES.map((a) => a.id),
  artSpecId: "ifrit",
});

const built = buildArt({
  bible: {
    characterId: "ifrit",
    species: "a great fire-djinn of the deep desert",
    ageRange: "ageless",
    face: "a fierce, horned face of glowing orange with slit black eyes",
    bodyType: "broad, towering and half made of drifting embers",
    clothingArmor: "a bronze breastplate over molten skin and a smoking sash",
    weaponsProps: "a whip of living flame and a curved fire-blade",
    markings: "cracks of white-hot light across the chest and arms",
    silhouette: "a huge horned figure wreathed in flames with a fire whip",
    signatureProps: ["a fire whip", "curved horns", "drifting embers"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "the fire beneath the sand",
  environment: "a dune valley split by a lava fissure",
  lighting: "orange firelight against a black night sky",
  paletteConcept: "ember orange, coal black, bronze, white-hot",
  avoid: ["any existing game's ifrit design"],
  splashScene: "rising out of a lava fissure with the whip cracking above the dunes",
  portraitScene: "a horned face with glowing eyes and heat shimmer",
  avatarScene: "close crop on the horns and eyes",
  iconScenes: ["a whip of fire curling across dark sand, for Flame Lash", "embers falling like rain over a dune, for Cinder Storm", "a molten fist glowing white-hot, for Molten Fury", "a grey cloud of ash wrapping a burning shape, for Ashen Veil"],
});
export const IFRIT_VISUAL_BIBLE = built.bible;
export const IFRIT_ART = built.art;
