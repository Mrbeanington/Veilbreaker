import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #43 DRAUGR (Northern / Celtic) — the barrow-dead. Grave-cold, hard to
// stop, and it feeds on the living: every kill mends it. docs/design/characters/draugr.md

export const BARROW_HUNGER: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.draugr.barrow-hunger",
  displayName: "Barrow Hunger",
  description: "Whenever an enemy falls, it heals 20.",
  trigger: { event: "onDeath", relation: "enemy", effectTarget: "self" },
  effects: [{ kind: "heal", healingClass: "heal", amount: 10 }],
});

export const RUSTED_AXE = ability({
  id: "ability.draugr.rusted-axe",
  displayName: "Rusted Axe",
  description: "A notched, rusted blow: 20 damage and Bleed.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "applyStatus", statusId: "status.bleed", magnitude: 5, durationTurns: 2 },
  ],
});
export const GRAVE_CHILL = ability({
  id: "ability.draugr.grave-chill",
  displayName: "Grave Chill",
  description: "A cold from under the earth: the enemy heals 20 less for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.healing-reduction", magnitude: 20, durationTurns: 3 }],
});
export const BARROW_MOUND = ability({
  id: "ability.draugr.barrow-mound",
  displayName: "Barrow Mound",
  description: "Draws earth over itself: takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const WIGHTS_GRIP = ability({
  id: "ability.draugr.wights-grip",
  displayName: "Wight's Grip",
  description: "A dead hand closes: 30 damage, and the enemy is stunned for a turn.",
  cost: { might: 2, chaos: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 30 },
    { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
  ],
});

export const DRAUGR_ABILITIES: Ability[] = [RUSTED_AXE, GRAVE_CHILL, BARROW_MOUND, WIGHTS_GRIP];

export const DRAUGR: CharacterDefinition = characterDefinitionSchema.parse({
  id: "draugr",
  version: 1,
  displayName: "Draugr",
  rarity: "CORE",
  tags: ["MYTHOLOGY", "UNDEAD", "BRUISER"],
  baseHp: 130,
  abilityIds: DRAUGR_ABILITIES.map((a) => a.id),
  passiveId: BARROW_HUNGER.id,
  artSpecId: "draugr",
});

const built = buildArt({
  bible: {
    characterId: "draugr",
    species: "a barrow-dwelling undead warrior of Norse myth",
    ageRange: "long dead",
    face: "a grey, desiccated face with sunken pale-blue eyes and a wispy beard",
    bodyType: "tall and broad, stiff with the cold of the grave",
    clothingArmor: "a rusted mail shirt and a cracked, dented helm",
    weaponsProps: "a notched rusted axe and a chipped round shield",
    markings: "frost and grave-moss on the armour",
    silhouette: "a tall helmed figure with an axe, rising from a mound in a cold mist",
    signatureProps: ["a rusted axe", "a dented helm", "grave-mist"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "a warrior who was never allowed to rest",
  environment: "a burial mound on a windswept moor at night",
  lighting: "cold moonlight through drifting mist",
  paletteConcept: "grave grey, rust orange, frost blue, black earth",
  avoid: ["any existing game's draugr or skeleton-warrior design"],
  splashScene: "breaking out of the top of a barrow with axe raised and mist pouring off the shoulders",
  portraitScene: "a grey face under a dented helm with two pale blue eyes",
  avatarScene: "close crop on the helm and eyes",
  iconScenes: [
    "a rusted axe head with a notch, for Rusted Axe",
    "frost creeping across a stone, for Grave Chill",
    "a mound of earth closing over a figure, for Barrow Mound",
    "a grey hand closing around a wrist, for Wight's Grip",
  ],
});
export const DRAUGR_VISUAL_BIBLE = built.bible;
export const DRAUGR_ART = built.art;
