import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #25 THE MIRROR SAMURAI (Japanese Folklore) — armour polished until it
// shows you yourself. He answers a blow with the same blow: a Ready Stance
// counters, Polished Guard reflects, and Perfect Reflection after that guard is
// the killing answer. docs/design/characters/the-mirror-samurai.md

export const READY_STANCE = ability({
  id: "ability.the-mirror-samurai.ready-stance",
  displayName: "Ready Stance",
  description: "Whoever strikes him next takes 20 damage back, for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 2 }],
});
export const POLISHED_GUARD = ability({
  id: "ability.the-mirror-samurai.polished-guard",
  displayName: "Polished Guard",
  description: "For a turn, damage aimed at him is redirected to whoever dealt it.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.reflect", durationTurns: 1 }],
});
export const PERFECT_REFLECTION = ability({
  id: "ability.the-mirror-samurai.perfect-reflection",
  displayName: "Perfect Reflection",
  description: "A cut that mirrors the enemy's own: 20 damage, or 50 right after Polished Guard.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: POLISHED_GUARD.id },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const STUDY_THE_FOE = ability({
  id: "ability.the-mirror-samurai.study-the-foe",
  displayName: "Study the Foe",
  description: "Watches and learns: his abilities recover a turn faster for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.cooldown-reduction", magnitude: 1, durationTurns: 2 }],
});

export const THE_MIRROR_SAMURAI_ABILITIES: Ability[] = [READY_STANCE, POLISHED_GUARD, PERFECT_REFLECTION, STUDY_THE_FOE];

export const THE_MIRROR_SAMURAI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-mirror-samurai",
  version: 1,
  displayName: "The Mirror Samurai",
  rarity: "RARE",
  tags: ["FOLKLORE", "WARRIOR", "DEFENDER"],
  baseHp: 130,
  abilityIds: THE_MIRROR_SAMURAI_ABILITIES.map((a) => a.id),
  artSpecId: "the-mirror-samurai",
});

const built = buildArt({
  bible: {
    characterId: "the-mirror-samurai",
    species: "an armoured swordsman-spirit of Japanese folklore",
    ageRange: "impossible to tell",
    face: "a face hidden by a plain polished steel mask that shows only reflections",
    bodyType: "tall, straight and completely still",
    clothingArmor: "lacquered plate armour polished to a mirror finish over a dark under-robe",
    weaponsProps: "a long sword with a blade like a bar of light",
    markings: "no crest — the armour reflects whatever stands before it",
    silhouette: "an upright armoured figure holding a sword point-down before him",
    signatureProps: ["mirror-polished armour", "a plain steel mask", "a long bright blade"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "an opponent that is a little too much like you",
  environment: "an empty tatami hall with paper screens and a wide polished floor",
  lighting: "cool window light bouncing off the armour",
  paletteConcept: "polished silver, ink black, paper white, one thread of vermilion",
  avoid: ["any existing game's samurai design"],
  splashScene: "standing before a screen with the enemy's shape reflected in his armour",
  portraitScene: "the steel mask reflecting a blurred figure, a faint gleam of light",
  avatarScene: "close crop on the mask and shoulder plate",
  iconScenes: [
    "a blade held upright in a calm stance, for Ready Stance",
    "an armoured plate reflecting a blast of light, for Polished Guard",
    "two identical blade cuts meeting in the air, for Perfect Reflection",
    "a masked face turned slightly toward an opponent, for Study the Foe",
  ],
});
export const THE_MIRROR_SAMURAI_VISUAL_BIBLE = built.bible;
export const THE_MIRROR_SAMURAI_ART = built.art;
