import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #17 BLUE ONI (Japanese Folklore) — the cool-headed brother. He guards
// where Red Oni charges, and everything he does is better with his brother at
// his side. docs/design/characters/blue-oni.md

export const BROTHERS_BOND: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.blue-oni.brothers-bond",
  displayName: "Brothers' Bond",
  description: "With Red Oni fighting beside him, he mends 10 health at the start of each turn.",
  trigger: { event: "onTurnStart", relation: "self" },
  condition: { type: "teamComposition", side: "ally", characterIds: ["red-oni"] },
  effects: [{ kind: "heal", healingClass: "heal", amount: 10 }],
});

export const COLD_IRON_BAR = ability({
  id: "ability.blue-oni.cold-iron-bar",
  displayName: "Cold Iron Bar",
  description: "A measured blow: 20 damage.",
  cost: { might: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const COOL_HEAD = ability({
  id: "ability.blue-oni.cool-head",
  displayName: "Cool Head",
  description: "Shields an ally for 20 (40 if Red Oni is on his team) for 3 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "teamComposition", side: "ally", characterIds: ["red-oni"] },
      ifTrue: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 40, durationTurns: 3 }],
      ifFalse: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 20, durationTurns: 3 }],
    },
  ],
});
export const DRAW_THE_FIRE = ability({
  id: "ability.blue-oni.draw-the-fire",
  displayName: "Draw the Fire",
  description: "Draws single-target attacks for a turn and shields himself for 20.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.shield", magnitude: 20, durationTurns: 2 },
  ],
});
export const ICY_GRIP = ability({
  id: "ability.blue-oni.icy-grip",
  displayName: "Icy Grip",
  description: "10 damage, and the enemy's cooldowns recover slower for 2 turns.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 },
  ],
});

export const BLUE_ONI_ABILITIES: Ability[] = [COLD_IRON_BAR, COOL_HEAD, DRAW_THE_FIRE, ICY_GRIP];

export const BLUE_ONI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "blue-oni",
  version: 1,
  displayName: "Blue Oni",
  rarity: "CORE",
  tags: ["FOLKLORE", "DEFENDER", "CONTROLLER"],
  baseHp: 150,
  abilityIds: BLUE_ONI_ABILITIES.map((a) => a.id),
  passiveId: BROTHERS_BOND.id,
  artSpecId: "blue-oni",
});

const built = buildArt({
  bible: {
    characterId: "blue-oni",
    species: "a horned ogre-demon of Japanese folklore",
    ageRange: "ageless",
    face: "a calm cold-eyed face with a single curved horn and a faint smile",
    bodyType: "tall and broad, held very still",
    clothingArmor: "a folded indigo sash and a plain dark tunic",
    weaponsProps: "a long plain iron bar",
    markings: "pale blue skin with darker blue veins",
    silhouette: "a tall horned figure standing quietly with an iron bar upright beside him",
    signatureProps: ["a plain iron bar", "one curved horn", "an indigo sash"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "the quiet half of a pair, who keeps them both alive",
  environment: "a snow-dusted temple gate at dusk",
  lighting: "cold blue twilight with a warm lantern glow behind",
  paletteConcept: "indigo blue, slate, pale ice, lantern amber",
  avoid: ["any existing anime or game oni design"],
  splashScene: "planted before a gate with the iron bar held across his body like a bar across a door",
  portraitScene: "a still face with half-lidded eyes and a faint frost on the horn",
  avatarScene: "close crop on the single horn and eyes",
  iconScenes: [
    "an iron bar striking downward, for Cold Iron Bar",
    "a cool hand held over another, for Cool Head",
    "a broad figure stepping in front of an arrow, for Draw the Fire",
    "a frost-rimed hand closing, for Icy Grip",
  ],
});
export const BLUE_ONI_VISUAL_BIBLE = built.bible;
export const BLUE_ONI_ART = built.art;
