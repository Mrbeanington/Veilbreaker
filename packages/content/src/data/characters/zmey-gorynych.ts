import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE } from "./helpers";

// spec/03 #36 ZMEY GORYNYCH (Slavic / Russian Night) — the three-headed dragon.
// Each head has its own bite; used in order (left, middle, right) the three
// heads answer together in Roar of Three. docs/design/characters/zmey-gorynych.md

export const LEFT_HEAD = ability({
  id: "ability.zmey-gorynych.left-head",
  displayName: "Left Head",
  description: "Breathes fire: 10 damage and Burn.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 1 },
  ],
});
export const MIDDLE_HEAD = ability({
  id: "ability.zmey-gorynych.middle-head",
  displayName: "Middle Head",
  description: "A crushing bite: 30 damage.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const RIGHT_HEAD = ability({
  id: "ability.zmey-gorynych.right-head",
  displayName: "Right Head",
  description: "A venomous snap: 10 damage and poison.",
  cost: { chaos: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 2 },
  ],
});
export const ROAR_OF_THREE = ability({
  id: "ability.zmey-gorynych.roar-of-three",
  displayName: "Roar of Three",
  description: "All three heads at once: 30 damage. If he used Left, Middle, then Right Head just before it, 70 damage and the enemy is stunned.",
  cost: { might: 1, focus: 1, chaos: 1 },
  cooldown: 5,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "abilitySequenceMatches", target: "self", sequence: [LEFT_HEAD.id, MIDDLE_HEAD.id, RIGHT_HEAD.id] },
      ifTrue: [
        { kind: "damage", amount: 70 },
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
      ],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});

export const ZMEY_GORYNYCH_ABILITIES: Ability[] = [LEFT_HEAD, MIDDLE_HEAD, RIGHT_HEAD, ROAR_OF_THREE];

export const ZMEY_GORYNYCH: CharacterDefinition = characterDefinitionSchema.parse({
  id: "zmey-gorynych",
  version: 1,
  displayName: "Zmey Gorynych",
  rarity: "RARE",
  tags: ["FOLKLORE", "BEAST", "ATTACKER", "BRUISER"],
  baseHp: 130,
  abilityIds: ZMEY_GORYNYCH_ABILITIES.map((a) => a.id),
  artSpecId: "zmey-gorynych",
});

const built = buildArt({
  bible: {
    characterId: "zmey-gorynych",
    species: "a three-headed dragon of Slavic folklore",
    ageRange: "ancient",
    face: "three dragon heads: one wreathed in flame, one heavy-jawed and bare, one with venom-green eyes",
    bodyType: "a huge winged serpentine body with a long spiked tail",
    clothingArmor: "overlapping dark red scales",
    weaponsProps: "fire, fangs and a barbed tail",
    markings: "gold ornament-like patterning along the wing edges in an original folk style",
    silhouette: "a huge winged body with three long necks rising from it against a burning sky",
    signatureProps: ["three heads", "wide wings", "a barbed tail"],
  },
  region: "Slavic folklore inspiration (deep forests, folk ornament geometry, storybook atmosphere)",
  visualTheme: "three tempers on one body",
  environment: "a scorched mountain pass with a burning pine forest below",
  lighting: "fire-orange from below with cold blue sky above",
  paletteConcept: "dragon red, ember orange, venom green, charcoal",
  avoid: ["any existing game's three-headed dragon design"],
  splashScene: "rearing over a pass with one head breathing fire, one roaring, one hissing",
  portraitScene: "the three heads side by side, each with a different eye colour",
  avatarScene: "close crop on the middle head",
  iconScenes: [
    "a plume of fire from a jaw, for Left Head",
    "a heavy jaw closing, for Middle Head",
    "a fang with a drop of green venom, for Right Head",
    "three roaring mouths in a rising arc, for Roar of Three",
  ],
});
export const ZMEY_GORYNYCH_VISUAL_BIBLE = built.bible;
export const ZMEY_GORYNYCH_ART = built.art;
