import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE } from "./helpers";

// spec/03 #52 THE WILD HUNTSMAN [SECRET] (Northern / Celtic) — the storm-rider
// who hunts one quarry at a time. Once he has named his quarry (a Mark), every
// attack on it is cruel; unmarked prey is barely noticed.
// docs/design/characters/the-wild-huntsman.md

export const SOUND_THE_HORN = ability({
  id: "ability.the-wild-huntsman.sound-the-horn",
  displayName: "Sound the Horn",
  description: "Names the quarry: the enemy is Marked for 3 turns and weakened for 2.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.mark", durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});
export const HOUNDS_BITE = ability({
  id: "ability.the-wild-huntsman.hounds-bite",
  displayName: "Hound's Bite",
  description: "The pack strikes: 20 damage, or 50 against the Marked quarry.",
  cost: { might: 1, chaos: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.mark" },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const RIDE_DOWN = ability({
  id: "ability.the-wild-huntsman.ride-down",
  displayName: "Ride Down",
  description: "Rides the quarry down: 30 damage, and if it is Marked it is stunned for a turn.",
  cost: { might: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 30 },
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.mark" },
      ifTrue: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
    },
  ],
});
export const STORM_RIDE = ability({
  id: "ability.the-wild-huntsman.storm-ride",
  displayName: "Storm Ride",
  description: "Vanishes into the storm: untargetable for a turn.",
  cost: { spirit: 1 },
  cooldown: 4,
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});

export const THE_WILD_HUNTSMAN_ABILITIES: Ability[] = [SOUND_THE_HORN, HOUNDS_BITE, RIDE_DOWN, STORM_RIDE];

export const THE_WILD_HUNTSMAN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-wild-huntsman",
  version: 1,
  displayName: "The Wild Huntsman",
  rarity: "SECRET",
  tags: ["MYTHOLOGY", "ATTACKER", "CONTROLLER", "SECRET"],
  baseHp: 140,
  abilityIds: THE_WILD_HUNTSMAN_ABILITIES.map((a) => a.id),
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-wild-huntsman",
});

const built = buildArt({
  bible: {
    characterId: "the-wild-huntsman",
    species: "a spectral storm-rider of northern legend",
    ageRange: "ancient",
    face: "a gaunt shadowed face under a wide hat with two points of pale light for eyes",
    bodyType: "tall and rangy on a huge black horse",
    clothingArmor: "a tattered black cloak and hunting leathers",
    weaponsProps: "a long curved hunting horn and a pack of pale hounds",
    markings: "storm-lightning scars across the hands",
    silhouette: "a horned-hatted rider on a huge horse with hounds streaming behind in a storm",
    signatureProps: ["a hunting horn", "a pack of pale hounds", "a black horse"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "a hunt that comes for one name",
  environment: "a stormy night over a dark forest and moor",
  lighting: "flashes of lightning with a cold storm glow",
  paletteConcept: "storm black, lightning white, hound pale, ember red",
  avoid: ["any existing game's wild-hunt or huntsman design"],
  splashScene: "riding across a storm sky with hounds streaming and the horn raised",
  portraitScene: "a gaunt face under a hat brim with two pale eyes",
  avatarScene: "close crop on the eyes and hat",
  iconScenes: [
    "a curved horn with sound rings, for Sound the Horn",
    "a hound's open jaws in the dark, for Hound's Bite",
    "hoofbeats in a storm-lit road, for Ride Down",
    "a rider vanishing into a lightning flash, for Storm Ride",
  ],
  secretSilhouetteScene: "a rider and streaming hounds against a storm sky, no other detail",
});
export const THE_WILD_HUNTSMAN_VISUAL_BIBLE = built.bible;
export const THE_WILD_HUNTSMAN_ART = built.art;
