import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #19 YUKI-ONNA (Japanese Folklore) — the snow woman. Her frost slows
// whoever it touches (a Chill), and a chilled enemy can be frozen solid.
// docs/design/characters/yuki-onna.md

export const FROST_BREATH = ability({
  id: "ability.yuki-onna.frost-breath",
  displayName: "Frost Breath",
  description: "10 damage to every enemy, and their cooldowns recover slower for 2 turns (a Chill).",
  cost: { focus: 1, spirit: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 },
  ],
});
export const KISS_OF_WINTER = ability({
  id: "ability.yuki-onna.kiss-of-winter",
  displayName: "Kiss of Winter",
  description: "Freezes a chilled enemy solid: 30 damage and a stun. An enemy that is not chilled takes 20 and is chilled instead.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.cooldown-increase" },
      ifTrue: [
        { kind: "damage", amount: 30 },
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
      ],
      ifFalse: [
        { kind: "damage", amount: 20 },
        { kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 },
      ],
    },
  ],
});
export const VANISH_INTO_SNOW = ability({
  id: "ability.yuki-onna.vanish-into-snow",
  displayName: "Vanish into Snow",
  description: "Melts into a whiteout: untargetable for a turn, and she heals 10.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 },
    { kind: "heal", healingClass: "heal", amount: 10 },
  ],
});
export const WINTER_LULLABY = ability({
  id: "ability.yuki-onna.winter-lullaby",
  displayName: "Winter Lullaby",
  description: "A drowsy chant: the enemy's attacks are weakened by 10 for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});

export const YUKI_ONNA_ABILITIES: Ability[] = [FROST_BREATH, KISS_OF_WINTER, VANISH_INTO_SNOW, WINTER_LULLABY];

export const YUKI_ONNA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "yuki-onna",
  version: 1,
  displayName: "Yuki-Onna",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "CONTROLLER"],
  baseHp: 100,
  abilityIds: YUKI_ONNA_ABILITIES.map((a) => a.id),
  artSpecId: "yuki-onna",
});

const built = buildArt({
  bible: {
    characterId: "yuki-onna",
    species: "a snow spirit of Japanese folklore",
    ageRange: "ageless",
    face: "a still, beautiful pale face with dark eyes and frost on the lashes",
    bodyType: "tall and slender, barely touching the ground",
    clothingArmor: "a long white kimono trailing into drifting snow",
    weaponsProps: "her own cold breath, visible as a white mist",
    markings: "faint ice-blue lines at her throat",
    silhouette: "a slender white figure dissolving into a swirl of snow at the hem",
    signatureProps: ["a trailing white kimono", "drifting snow", "visible breath"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "a beauty that is a warning",
  environment: "a mountain path in a whiteout with black pines",
  lighting: "flat white snow light with a cold blue shadow",
  paletteConcept: "snow white, ice blue, ink black, pale rose",
  avoid: ["any existing anime or game snow-woman design"],
  splashScene: "standing on a snowy path with a plume of frost breathed out ahead of her",
  portraitScene: "her calm face half hidden by a drift of snow",
  avatarScene: "close crop on the eyes and the mist of her breath",
  iconScenes: [
    "a plume of frost with crystals, for Frost Breath",
    "a fingertip touching a frozen lip, for Kiss of Winter",
    "a figure melting into a whiteout, for Vanish into Snow",
    "a curl of song made of snowflakes, for Winter Lullaby",
  ],
});
export const YUKI_ONNA_VISUAL_BIBLE = built.bible;
export const YUKI_ONNA_ART = built.art;
