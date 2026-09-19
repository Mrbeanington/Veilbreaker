import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #16 RED ONI (Japanese Folklore) — the hot-blooded brother. A club and
// a charge that hurts him too, unless his brother Blue Oni fights beside him.
// docs/design/characters/red-oni.md

export const IRON_CLUB = ability({
  id: "ability.red-oni.iron-club",
  displayName: "Iron Club",
  description: "A swing of the studded club: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const BELLOWING_CHARGE = ability({
  id: "ability.red-oni.bellowing-charge",
  displayName: "Bellowing Charge",
  description: "50 damage. Unless Blue Oni fights beside him, the charge costs him 20 health.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 50 },
    {
      kind: "conditional",
      condition: { type: "not", condition: { type: "teamComposition", side: "ally", characterIds: ["blue-oni"] } },
      ifTrue: [{ kind: "damage", amount: 20, damageType: "affliction", target: SELF_ONLY }],
    },
  ],
});
export const OGRE_HIDE = ability({
  id: "ability.red-oni.thick-hide",
  displayName: "Thick Hide",
  description: "Takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const KANABO_SWEEP = ability({
  id: "ability.red-oni.kanabo-sweep",
  displayName: "Kanabo Sweep",
  description: "A wide sweep of the club: 20 damage to every enemy.",
  cost: { might: 2, focus: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }],
});

export const RED_ONI_ABILITIES: Ability[] = [IRON_CLUB, BELLOWING_CHARGE, OGRE_HIDE, KANABO_SWEEP];

export const RED_ONI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "red-oni",
  version: 1,
  displayName: "Red Oni",
  rarity: "CORE",
  tags: ["FOLKLORE", "BRUISER", "WARRIOR"],
  baseHp: 160,
  abilityIds: RED_ONI_ABILITIES.map((a) => a.id),
  artSpecId: "red-oni",
});

const built = buildArt({
  bible: {
    characterId: "red-oni",
    species: "a horned ogre-demon of Japanese folklore",
    ageRange: "ageless",
    face: "a broad flushed face with two short horns, a wide grin of tusks and bright gold eyes",
    bodyType: "enormous and barrel-chested with thick arms",
    clothingArmor: "a tiger-patterned loincloth and iron wrist bands",
    weaponsProps: "a huge iron-studded club",
    markings: "deep red skin with pale scars",
    silhouette: "a hulking horned figure resting a studded club on one shoulder",
    signatureProps: ["a studded iron club", "two short horns", "red skin"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "loud strength that trusts its brother to cover the cost",
  environment: "a rocky mountain gate under storm clouds",
  lighting: "hard side light with ember-red rim",
  paletteConcept: "vermilion red, iron black, tiger gold, storm grey",
  avoid: ["any existing anime or game oni design"],
  splashScene: "leaping forward with the club raised and his mouth open in a roar",
  portraitScene: "a grinning tusked face with steam breathing out of the nostrils",
  avatarScene: "close crop on the horns and grin",
  iconScenes: [
    "a spiked club swinging in an arc, for Iron Club",
    "a horned head charging with dust trailing, for Bellowing Charge",
    "overlapping thick hide plates, for Thick Hide",
    "a wide arc of club strikes, for Kanabo Sweep",
  ],
});
export const RED_ONI_VISUAL_BIBLE = built.bible;
export const RED_ONI_ART = built.art;
