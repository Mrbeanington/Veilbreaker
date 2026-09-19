import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #27 GASHADOKURO (Japanese Folklore) — the giant skeleton built from
// the bones of the starved dead. Its Hunger grows every turn and makes its
// devouring hit harder, but a starving giant is also weaker until it feeds.
// docs/design/characters/gashadokuro.md

export const HUNGER_RESOURCE: Resource = {
  id: "resource.gasha-hunger",
  displayName: "Hunger",
  startingValue: 0,
  min: 0,
  max: 4,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const STARVING_BONES: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.gashadokuro.starving-bones",
  displayName: "Starving Bones",
  description: "Gains a Hunger every turn. From three Hunger he is weakened by 10 until he feeds.",
  trigger: { event: "onTurnStart", relation: "self" },
  effects: [
    { kind: "modifyResource", resourceId: HUNGER_RESOURCE.id, amount: 1 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: HUNGER_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 1 }],
    },
  ],
  knowledgeLevel: "DISCOVERABLE",
});

export const BONE_FIST = ability({
  id: "ability.gashadokuro.bone-fist",
  displayName: "Bone Fist",
  description: "A skeletal fist: 30 damage.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const GRASP_OF_THE_STARVED = ability({
  id: "ability.gashadokuro.grasp-of-the-starved",
  displayName: "Grasp of the Starved",
  description: "Holds an enemy fast: stunned for a turn.",
  cost: { might: 1, spirit: 1 },
  cooldown: 5,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const DEVOUR = ability({
  id: "ability.gashadokuro.devour",
  displayName: "Devour",
  description: "20 damage and he heals 20. With three Hunger: 60 damage and he heals 30, and the Hunger is spent.",
  cost: { might: 1, chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: HUNGER_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "damage", amount: 60 },
        { kind: "heal", healingClass: "heal", amount: 30, target: SELF_ONLY },
        { kind: "modifyResource", resourceId: HUNGER_RESOURCE.id, amount: -3, target: SELF_ONLY },
      ],
      ifFalse: [
        { kind: "damage", amount: 20 },
        { kind: "heal", healingClass: "heal", amount: 20, target: SELF_ONLY },
      ],
    },
  ],
});
export const RATTLING_DREAD = ability({
  id: "ability.gashadokuro.rattling-dread",
  displayName: "Rattling Dread",
  description: "A rattle from a thousand bones: the enemy cowers and deals 10 less damage for 2 turns.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.fear", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

export const GASHADOKURO_ABILITIES: Ability[] = [BONE_FIST, GRASP_OF_THE_STARVED, DEVOUR, RATTLING_DREAD];

export const GASHADOKURO: CharacterDefinition = characterDefinitionSchema.parse({
  id: "gashadokuro",
  version: 1,
  displayName: "Gashadokuro",
  rarity: "RARE",
  tags: ["FOLKLORE", "UNDEAD", "TANK", "BRUISER"],
  baseHp: 160,
  abilityIds: GASHADOKURO_ABILITIES.map((a) => a.id),
  passiveId: STARVING_BONES.id,
  resources: [HUNGER_RESOURCE],
  artSpecId: "gashadokuro",
});
export const GASHADOKURO_INITIAL_RESOURCES = defaultResourcesFor(GASHADOKURO);

const built = buildArt({
  bible: {
    characterId: "gashadokuro",
    species: "a giant skeleton spirit of Japanese folklore",
    ageRange: "ancient",
    face: "an enormous bare skull with a hinged jaw and pinpoints of cold light for eyes",
    bodyType: "a skeleton many times human size, made of many different bones",
    clothingArmor: "none — bones bound with old rope",
    weaponsProps: "huge skeletal hands",
    markings: "hairline cracks glowing faintly pale green along the bones",
    silhouette: "a towering skeleton looming over a burnt village, jaw hanging open",
    signatureProps: ["a huge skull", "many bones bound together", "green light in the cracks"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "the hunger of everyone who was never fed",
  environment: "a ruined village under a dark moon",
  lighting: "pale green moonlight from below",
  paletteConcept: "bone white, night blue, dim green, soot",
  avoid: ["any existing game's giant skeleton design"],
  splashScene: "rising above a ruined roofline with its jaw wide and pale light in its eyes",
  portraitScene: "the great skull filling the frame with a cold green glint",
  avatarScene: "close crop on the skull and jaw",
  iconScenes: [
    "a giant bony fist coming down, for Bone Fist",
    "skeletal fingers closing around a small figure, for Grasp of the Starved",
    "a wide jaw closing on a glowing sphere, for Devour",
    "bones rattling in a swirl of pale light, for Rattling Dread",
  ],
});
export const GASHADOKURO_VISUAL_BIBLE = built.bible;
export const GASHADOKURO_ART = built.art;
