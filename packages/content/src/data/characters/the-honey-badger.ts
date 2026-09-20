import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #93 THE HONEY BADGER (Animals / Weird) — it simply does not care. Every serious wound hardens it, and it shrugs off poison and curses. docs/design/characters/the-honey-badger.md

export const DOES_NOT_CARE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-honey-badger.does-not-care",
  displayName: "Doesn't Care",
  description: "Below half health, every wound leaves it taking 10 less damage for a turn.",
  trigger: { event: "onDamaged", relation: "self", effectTarget: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 50 },
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 1 }],
});

export const RIP_AND_TEAR = ability({
  id: "ability.the-honey-badger.rip-and-tear",
  displayName: "Rip and Tear",
  description: "Savage claws: 20 damage and Bleed.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.bleed", magnitude: 5, durationTurns: 2 }],
});
export const FRENZIED_BITE = ability({
  id: "ability.the-honey-badger.frenzied-bite",
  displayName: "Frenzied Bite",
  description: "A bite that will not let go: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const SHRUG_IT_OFF = ability({
  id: "ability.the-honey-badger.shrug-it-off",
  displayName: "Shrug It Off",
  description: "Ignores it completely: lifts every harmful effect from itself and heals 10.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "removeStatus", dispelAll: true, target: SELF_ONLY }, { kind: "heal", healingClass: "heal", amount: 10 }],
});
export const DIG_IN_AND_GLARE = ability({
  id: "ability.the-honey-badger.dig-in-and-glare",
  displayName: "Dig In and Glare",
  description: "Plants itself and stares the enemy down: takes 20 less damage for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const THE_HONEY_BADGER_ABILITIES: Ability[] = [RIP_AND_TEAR, FRENZIED_BITE, SHRUG_IT_OFF, DIG_IN_AND_GLARE];

export const THE_HONEY_BADGER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-honey-badger",
  version: 1,
  displayName: "The Honey Badger",
  rarity: "CORE",
  tags: ["FOLKLORE", "BEAST", "BRUISER"],
  baseHp: 120,
  abilityIds: THE_HONEY_BADGER_ABILITIES.map((a) => a.id),
  passiveId: DOES_NOT_CARE.id,
  artSpecId: "the-honey-badger",
});

const built = buildArt({
  bible: {
    characterId: "the-honey-badger",
    species: "a fearless badger of savannah tall tales",
    ageRange: "a grizzled adult",
    face: "a broad, flat-headed badger face with small dark eyes and a white cap of fur",
    bodyType: "low, wide and solid",
    clothingArmor: "none: a thick black coat with a white saddle from head to tail",
    weaponsProps: "long dark claws and a scrap of honeycomb stuck to one paw",
    markings: "a jagged old scar across the muzzle",
    silhouette: "a low, wide, white-capped badger in a defiant crouch with claws out",
    signatureProps: ["a white-capped back", "long claws", "a scrap of honeycomb"],
  },
  region: "Storybook-animal and tall-tale inspiration (worn fur, patched uniforms, bright props, painterly wilderness)",
  visualTheme: "the smallest thing in the room and the one to fear",
  environment: "a dry savannah at dusk with a toppled hive",
  lighting: "warm low sun and drifting dust",
  paletteConcept: "black, cream white, savannah gold, honey amber",
  avoid: ["any existing game's the honey badger design"],
  splashScene: "standing on a toppled hive with claws out and bees swirling in the dust behind",
  portraitScene: "a flat-headed badger face with small dark eyes",
  avatarScene: "close crop on the white cap and eyes",
  iconScenes: ["three long claw marks in red, for Rip and Tear", "a badger's jaw clamped shut, for Frenzied Bite", "a hand-shaped brush-off of dust, for Shrug It Off", "four claws dug into dirt, for Dig In and Glare"],
});
export const THE_HONEY_BADGER_VISUAL_BIBLE = built.bible;
export const THE_HONEY_BADGER_ART = built.art;
