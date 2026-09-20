import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #31 LESHY (Slavic / Russian Night) — the forest's warden. The wood
// grows around him a little every turn (Growth); a full thicket roots an enemy
// in place. docs/design/characters/leshy.md

export const GROWTH_RESOURCE: Resource = {
  id: "resource.growth",
  displayName: "Growth",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const THE_WOOD_GROWS: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.leshy.the-wood-grows",
  displayName: "The Wood Grows",
  description: "Gains a Growth at the start of every turn.",
  trigger: { event: "onTurnStart", relation: "self" },
  effects: [{ kind: "modifyResource", resourceId: GROWTH_RESOURCE.id, amount: 1 }],
});

export const THORN_VOLLEY = ability({
  id: "ability.leshy.thorn-volley",
  displayName: "Thorn Volley",
  description: "10 damage and poison.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 },
  ],
});
export const BARK_SKIN = ability({
  id: "ability.leshy.bark-skin",
  displayName: "Bark Skin",
  description: "Takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const ROOT_SNARE = ability({
  id: "ability.leshy.root-snare",
  displayName: "Root Snare",
  description: "With three Growth, roots an enemy fast: stunned for a turn (spends the Growth). Otherwise it only weakens the enemy.",
  cost: { might: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: GROWTH_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
        { kind: "modifyResource", resourceId: GROWTH_RESOURCE.id, amount: -3, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
    },
  ],
});
export const WILD_GROWTH = ability({
  id: "ability.leshy.wild-growth",
  displayName: "Wild Growth",
  description: "The forest mends him: heals 20 and adds a Growth.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    { kind: "heal", healingClass: "heal", amount: 20 },
    { kind: "modifyResource", resourceId: GROWTH_RESOURCE.id, amount: 1 },
  ],
});

export const LESHY_ABILITIES: Ability[] = [THORN_VOLLEY, BARK_SKIN, ROOT_SNARE, WILD_GROWTH];

export const LESHY: CharacterDefinition = characterDefinitionSchema.parse({
  id: "leshy",
  version: 1,
  displayName: "Leshy",
  rarity: "CORE",
  tags: ["FOLKLORE", "CONTROLLER", "BEAST"],
  baseHp: 150,
  abilityIds: LESHY_ABILITIES.map((a) => a.id),
  passiveId: THE_WOOD_GROWS.id,
  resources: [GROWTH_RESOURCE],
  artSpecId: "leshy",
});
export const LESHY_INITIAL_RESOURCES = defaultResourcesFor(LESHY);

const built = buildArt({
  bible: {
    characterId: "leshy",
    species: "a forest spirit of Slavic folklore",
    ageRange: "ancient",
    face: "a long, bark-textured face with moss for a beard and two deep-green eyes",
    bodyType: "tall, gaunt and knotted like a tree",
    clothingArmor: "a cloak of leaves and lichen, worn back to front",
    weaponsProps: "a crooked staff of living wood",
    markings: "pale mushroom clusters growing along his shoulders",
    silhouette: "a tall thin figure whose antlered head merges with the branches behind him",
    signatureProps: ["a living wood staff", "moss beard", "mushrooms on the shoulders"],
  },
  region: "Slavic folklore inspiration (deep forest, folk ornament geometry, wood carving)",
  visualTheme: "a forest that has decided to keep you",
  environment: "a birch-and-pine forest in deep winter dusk",
  lighting: "blue twilight with green glow under the branches",
  paletteConcept: "moss green, bark brown, snow white, ember eyes",
  avoid: ["any existing game's tree-spirit or ent design"],
  splashScene: "stepping out of a wall of trunks with roots reaching across the snow behind him",
  portraitScene: "a moss-bearded face half hidden in branches, green eyes",
  avatarScene: "close crop on the face and antler-like branches",
  iconScenes: [
    "a spray of thorns in flight, for Thorn Volley",
    "bark plates closing over a figure, for Bark Skin",
    "roots coiling around a boot, for Root Snare",
    "a shoot sprouting through snow, for Wild Growth",
  ],
});
export const LESHY_VISUAL_BIBLE = built.bible;
export const LESHY_ART = built.art;
