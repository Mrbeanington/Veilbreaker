import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #9 Legend ORPHEON, THE FINAL SONG — a performance in three parts. Verse, then Chorus, then the Finale; if anything interrupts the song (a stun or a silence) the performance starts over. docs/design/characters/orpheon.md

export const PERFORMANCE_RESOURCE: Resource = {
  id: "resource.performance",
  displayName: "Performance",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// The Legend's defining vulnerability (spec/03): interruption resets the
// performance. A stun or a silence breaks the song at once.
export const INTERRUPTED_SONG: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.orpheon.interrupted-song",
  displayName: "Interrupted Song",
  description: "If he is stunned or silenced, the performance starts over from the Verse.",
  trigger: { event: "onStatusApplied", relation: "self", effectTarget: "self" },
  condition: {
    type: "or",
    conditions: [
      { type: "hasStatus", target: "self", statusId: "status.stun" },
      { type: "hasStatus", target: "self", statusId: "status.silence" },
    ],
  },
  effects: [{ kind: "modifyResource", resourceId: PERFORMANCE_RESOURCE.id, amount: -3 }],
});

export const VERSE = ability({
  id: "ability.orpheon.verse",
  displayName: "Verse",
  description: "The first movement: 20 damage, and the performance begins (stage 1).",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    {
      kind: "conditional",
      condition: { type: "not", condition: { type: "resourceAtLeast", target: "self", resourceId: PERFORMANCE_RESOURCE.id, amount: 1 } },
      ifTrue: [{ kind: "modifyResource", resourceId: PERFORMANCE_RESOURCE.id, amount: 1, target: SELF_ONLY }],
    },
  ],
});
export const CHORUS = ability({
  id: "ability.orpheon.chorus",
  displayName: "Chorus",
  description: "The second movement: 40 damage and the performance rises (stage 2), but only from the Verse. Without it, only 10.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: PERFORMANCE_RESOURCE.id, amount: 1 },
      ifTrue: [
        { kind: "damage", amount: 40 },
        {
          kind: "conditional",
          condition: { type: "not", condition: { type: "resourceAtLeast", target: "self", resourceId: PERFORMANCE_RESOURCE.id, amount: 2 } },
          ifTrue: [{ kind: "modifyResource", resourceId: PERFORMANCE_RESOURCE.id, amount: 1, target: SELF_ONLY }],
        },
      ],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
export const FINALE = ability({
  id: "ability.orpheon.finale",
  displayName: "Finale",
  description: "The last movement: 70 damage to every enemy, but only after the Chorus (stage 2), and the performance ends. Without it, only 10. Extremely expensive.",
  cost: { spirit: 3, focus: 2 },
  cooldown: 5,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: PERFORMANCE_RESOURCE.id, amount: 2 },
      ifTrue: [{ kind: "damage", amount: 70 }, { kind: "modifyResource", resourceId: PERFORMANCE_RESOURCE.id, amount: -3, target: SELF_ONLY }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
export const REST_NOTE = ability({
  id: "ability.orpheon.rest-note",
  displayName: "Rest Note",
  description: "A held rest: a shield of 30 for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});

export const ORPHEON_ABILITIES: Ability[] = [VERSE, CHORUS, FINALE, REST_NOTE];

export const ORPHEON: CharacterDefinition = characterDefinitionSchema.parse({
  id: "orpheon",
  version: 1,
  displayName: "Orpheon, the Final Song",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "MUSIC", "MAGE", "CONTROLLER"],
  baseHp: 130,
  abilityIds: ORPHEON_ABILITIES.map((a) => a.id),
  passiveId: INTERRUPTED_SONG.id,
  resources: [PERFORMANCE_RESOURCE],
  artSpecId: "orpheon",
});

const built = buildArt({
  bible: {
    characterId: "orpheon",
    species: "a supernatural composer-warrior of legend",
    ageRange: "ageless",
    face: "a calm, luminous face with closed eyes and a faint listening smile",
    bodyType: "tall, poised and armoured in flowing layers",
    clothingArmor: "a long coat of layered midnight-blue cloth over pale ceremonial armour, threaded with glowing staff lines",
    weaponsProps: "an impossible instrument of floating strings and glowing sound-rings, with a baton-like blade",
    markings: "glowing staff lines of light running down both arms, entirely original notation",
    silhouette: "a tall poised figure with an impossible floating instrument and rings of light around it",
    signatureProps: ["an impossible floating instrument", "glowing staff lines", "a midnight-blue coat"],
  },
  region: "Stage, studio and street-theatre inspiration (spotlights, patched amps, greasepaint, checkered kitchens, neon and cardboard sets)",
  visualTheme: "the song that ends everything",
  environment: "an empty concert hall of dark wood with a single spotlight",
  lighting: "a single warm spotlight and drifting golden sound-motes",
  paletteConcept: "midnight blue, glowing gold, pale armour, deep wood brown",
  avoid: ["any existing game's orpheon, the final song design"],
  splashScene: "standing in a spotlight with the floating instrument playing itself and rings of gold light expanding across the hall",
  portraitScene: "a calm face with closed eyes lit gold from below",
  avatarScene: "close crop on the closed eyes and glowing lines",
  iconScenes: ["a single glowing note rising, for Verse", "two interwoven sound-rings, for Chorus", "a vast bloom of golden sound over a crowd, for Finale", "a single held rest symbol in a soft shield of light, for Rest Note"],
  legendRevealScene: "raising a baton-blade as the empty hall fills with a vast expanding bloom of golden sound and floating staff lines",
});
export const ORPHEON_VISUAL_BIBLE = built.bible;
export const ORPHEON_ART = built.art;
