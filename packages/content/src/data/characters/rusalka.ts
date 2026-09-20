import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #33 RUSALKA (Slavic / Russian Night) — a drowned maiden. She curses,
// then drinks the cursed: her Drowning Embrace feeds on a curse and heals her.
// docs/design/characters/rusalka.md

export const COLD_WHISPER = ability({
  id: "ability.rusalka.cold-whisper",
  displayName: "Cold Whisper",
  description: "10 damage, and the enemy is cursed for 3 turns.",
  cost: { chaos: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
  ],
});
export const DROWNING_EMBRACE = ability({
  id: "ability.rusalka.drowning-embrace",
  displayName: "Drowning Embrace",
  description: "20 damage. On a cursed enemy: 50 damage, and she takes 20 of its health for herself.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.curse" },
      ifTrue: [
        { kind: "damage", amount: 40 },
        { kind: "heal", healingClass: "lifeTransfer", amount: 20, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const WILLOW_VEIL = ability({
  id: "ability.rusalka.willow-veil",
  displayName: "Willow Veil",
  description: "Draped in river-willow: takes 20 less damage for 2 turns and heals 10.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 },
    { kind: "heal", healingClass: "heal", amount: 10 },
  ],
});
export const SONG_OF_THE_RIVER = ability({
  id: "ability.rusalka.song-of-the-river",
  displayName: "Song of the River",
  description: "A drowning-sweet song: every enemy takes 10 damage and is weakened for 2 turns.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

export const RUSALKA_ABILITIES: Ability[] = [COLD_WHISPER, DROWNING_EMBRACE, WILLOW_VEIL, SONG_OF_THE_RIVER];

export const RUSALKA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "rusalka",
  version: 1,
  displayName: "Rusalka",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "CURSE", "CONTROLLER"],
  baseHp: 100,
  abilityIds: RUSALKA_ABILITIES.map((a) => a.id),
  artSpecId: "rusalka",
});

const built = buildArt({
  bible: {
    characterId: "rusalka",
    species: "a drowned maiden spirit of Slavic folklore",
    ageRange: "a young woman, long dead",
    face: "a pale, beautiful face with sea-green eyes and a sad smile",
    bodyType: "slender, dripping, half in the water",
    clothingArmor: "a wet white shift and a wreath of river reeds",
    weaponsProps: "long green hair that moves like weed and a wreath of water lilies",
    markings: "faint blue-veined skin",
    silhouette: "a slim figure rising from a dark river with long hair trailing into the water",
    signatureProps: ["a reed wreath", "long weed-green hair", "river water"],
  },
  region: "Slavic folklore inspiration (deep forests, folk ornament geometry, storybook atmosphere)",
  visualTheme: "a sorrow that pulls you under",
  environment: "a moonlit river bank with willows",
  lighting: "pale moonlight and silver water",
  paletteConcept: "river green, moon white, willow grey, deep blue",
  avoid: ["any existing game's water-spirit design"],
  splashScene: "rising waist-deep from the river with her hair spread on the water and a hand extended",
  portraitScene: "a pale face just above the waterline with lilies in her hair",
  avatarScene: "close crop on the eyes and the reed wreath",
  iconScenes: [
    "a whispered breath curling above water, for Cold Whisper",
    "pale hands rising from the water to a wrist, for Drowning Embrace",
    "willow branches hanging in a pale veil, for Willow Veil",
    "ripples spreading in concentric songlines, for Song of the River",
  ],
});
export const RUSALKA_VISUAL_BIBLE = built.bible;
export const RUSALKA_ART = built.art;
