import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { transformationSchema, type Transformation } from "../../schemas/transformation";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #110 CHEF RAMBLE (Music / Entertainment / Chaos) — a furious fictional chef. Chop, then sear, then flambé, then plate: a full sequence turns him into THE FIVE-STAR FIEND (renamed from the provisional Michelin Monster, OQ-10). docs/design/characters/chef-ramble.md

export const CHOP = ability({
  id: "ability.chef-ramble.chop",
  displayName: "Chop",
  description: "A furious chop: 20 damage. Step one of the recipe.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const SEAR = ability({
  id: "ability.chef-ramble.sear",
  displayName: "Sear",
  description: "Slaps it on the hot pan: 10 damage and Burn. Step two.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "applyStatus", statusId: "status.burn", magnitude: 5, durationTurns: 2 }],
});
export const FLAMBE = ability({
  id: "ability.chef-ramble.flambe",
  displayName: "Flambé",
  description: "Sets it alight: 20 damage and Burn. Step three.",
  cost: { might: 1, chaos: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.burn", magnitude: 5, durationTurns: 2 }],
});
export const PLATE_IT = ability({
  id: "ability.chef-ramble.plate-it",
  displayName: "Plate It",
  description: "20 damage. Right after Chop, Sear and Flambé in that order, the chef becomes The Five-Star Fiend.",
  cost: { spirit: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "abilitySequenceMatches", target: "self", sequence: ["ability.chef-ramble.chop", "ability.chef-ramble.sear", "ability.chef-ramble.flambe"] },
      ifTrue: [{ kind: "damage", amount: 20 }, { kind: "transformInto", transformationId: "transformation.chef-ramble.to-the-five-star-fiend" }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const CLEAVER_STORM = ability({
  id: "ability.chef-ramble.cleaver-storm",
  displayName: "Cleaver Storm",
  description: "A storm of cleavers: 20 damage to every enemy.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }],
});
export const BOIL_OVER = ability({
  id: "ability.chef-ramble.boil-over",
  displayName: "Boil Over",
  description: "The whole kitchen boils over: every enemy burns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 3 }],
});
export const CHEF_DEVOUR = ability({
  id: "ability.chef-ramble.devour",
  displayName: "Devour",
  description: "Eats what it caught: 40 damage, and it heals 20.",
  cost: { might: 2, chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 40 }, { kind: "heal", healingClass: "lifeTransfer", amount: 20, target: SELF_ONLY }],
});
export const KITCHEN_NIGHTMARE = ability({
  id: "ability.chef-ramble.kitchen-nightmare",
  displayName: "Kitchen Nightmare",
  description: "Nobody leaves: 40 damage to every enemy and a stun for a turn.",
  cost: { might: 3, chaos: 2 },
  cooldown: 5,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 40 }, { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});

export const TO_THE_FIVE_STAR_FIEND: Transformation = transformationSchema.parse({
  id: "transformation.chef-ramble.to-the-five-star-fiend",
  characterId: "chef-ramble",
  fromStageId: null,
  toStageId: "the-five-star-fiend",
  trigger: { type: "abilitySequenceMatches", target: "self", sequence: ["ability.chef-ramble.chop", "ability.chef-ramble.sear", "ability.chef-ramble.flambe"] },
  changes: {
    displayName: "The Five-Star Fiend",
    maxHp: 150,
    abilityIds: [CLEAVER_STORM.id, BOIL_OVER.id, CHEF_DEVOUR.id, KITCHEN_NIGHTMARE.id],
  },
});

export const CHEF_RAMBLE_ABILITIES: Ability[] = [CHOP, SEAR, FLAMBE, PLATE_IT, CLEAVER_STORM, BOIL_OVER, CHEF_DEVOUR, KITCHEN_NIGHTMARE];

export const CHEF_RAMBLE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "chef-ramble",
  version: 1,
  displayName: "Chef Ramble",
  rarity: "RARE",
  tags: ["MUSIC", "ATTACKER", "EVOLUTION"],
  baseHp: 110,
  abilityIds: CHEF_RAMBLE_ABILITIES.slice(0, 4).map((a) => a.id),
  transformationIds: [TO_THE_FIVE_STAR_FIEND.id],
  artSpecId: "chef-ramble",
});

const built = buildArt({
  bible: {
    characterId: "chef-ramble",
    species: "a furious restaurant chef of kitchen-nightmare legend",
    ageRange: "a man in his forties",
    face: "a red-faced, scowling face with a huge moustache and wild grey eyebrows under a crumpled chef's hat",
    bodyType: "stocky, barrel-chested and sweating",
    clothingArmor: "a stained white chef's jacket with rolled sleeves, a checked apron, and burnt oven mitts",
    weaponsProps: "a huge cleaver and a smoking cast-iron pan",
    markings: "burn scars and old knife-nicks along both forearms",
    silhouette: "a stocky red-faced figure in a tall crumpled chef's hat with a cleaver raised in one hand and a smoking pan in the other",
    signatureProps: ["a tall crumpled chef's hat", "a huge cleaver", "a smoking cast-iron pan"],
  },
  region: "Stage, studio and street-theatre inspiration (spotlights, patched amps, greasepaint, checkered kitchens, neon and cardboard sets)",
  visualTheme: "the recipe is a temper",
  environment: "a chaotic restaurant kitchen at the height of service",
  lighting: "fierce orange flame under steel hoods and steam",
  paletteConcept: "apron white, flame orange, steel silver, sauce red",
  avoid: ["any existing game's chef ramble design"],
  splashScene: "hurling the cleaver overhead with flames roaring behind and pots boiling over on the range",
  portraitScene: "a red-faced scowl under a crumpled chef's hat",
  avatarScene: "close crop on the hat and moustache",
  transformationScenes: ["transformed into The Five-Star Fiend: a towering, cleaver-armed monster of steam, flame and black iron pans, the crumpled chef's hat now a crown of blades, the whole kitchen boiling over behind"],
  iconScenes: ["a cleaver mid-chop through a carrot, for Chop", "a pan sizzling with a searing steak, for Sear", "a whoosh of flame over a pan, for Flambé", "a covered silver dish being lifted, for Plate It"],
});
export const CHEF_RAMBLE_VISUAL_BIBLE = built.bible;
export const CHEF_RAMBLE_ART = built.art;
