import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 #10 THE SIREN (Ancient Mediterranean) — songs in sequence. Lure, then
// Lullaby, then Shipwreck: each verse must follow the last to land. Any other
// order is only a pretty tune. docs/design/characters/the-siren.md

export const LURE = ability({
  id: "ability.the-siren.lure",
  displayName: "Lure",
  description: "A sweet first verse: 10 damage. It sets up the Lullaby.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }],
});
export const LULLABY = ability({
  id: "ability.the-siren.lullaby",
  displayName: "Lullaby",
  description: "10 damage. Sung right after Lure, it silences the enemy for a turn.",
  cost: { spirit: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: LURE.id },
      ifTrue: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
    },
  ],
});
export const SHIPWRECK = ability({
  id: "ability.the-siren.shipwreck",
  displayName: "Shipwreck",
  description: "The last verse: 20 damage. After Lure then Lullaby, it drives the enemy onto the rocks for 60 and a stun.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "abilitySequenceMatches", target: "self", sequence: [LURE.id, LULLABY.id] },
      ifTrue: [
        { kind: "damage", amount: 60 },
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const UNDERTOW = ability({
  id: "ability.the-siren.undertow",
  displayName: "Undertow",
  description: "The tide drags at every enemy: 10 damage to all.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }],
});

export const THE_SIREN_ABILITIES: Ability[] = [LURE, LULLABY, SHIPWRECK, UNDERTOW];

export const THE_SIREN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-siren",
  version: 1,
  displayName: "The Siren",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "MUSIC", "CONTROLLER", "MAGE"],
  baseHp: 110,
  abilityIds: THE_SIREN_ABILITIES.map((a) => a.id),
  artSpecId: "the-siren",
});

const built = buildArt({
  bible: {
    characterId: "the-siren",
    species: "a sea-singer of Mediterranean myth, half woman and half bird",
    ageRange: "ageless",
    face: "a beautiful open-mouthed face mid-song with pale sea-green eyes",
    bodyType: "a woman's torso with wide feathered wings and talon feet",
    clothingArmor: "a drape of wet sea-green silk and pearl strings",
    weaponsProps: "a shell-horn and trailing strands of pearls",
    markings: "shimmering blue-green feather patterns on her arms",
    silhouette: "a winged figure perched on a jagged sea rock with mouth open in song",
    signatureProps: ["wide feathered wings", "a shell horn", "a jagged sea rock"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a song that sounds like the thing you most want",
  environment: "a jagged sea rock at dusk with a wrecked hull below",
  lighting: "a low sunset with pearl-white surf light",
  paletteConcept: "sea green, pearl white, dusk violet, wet stone grey",
  avoid: ["any existing game's siren or harpy design"],
  splashScene: "perched on a rock mid-song with a ship's broken mast in the foam below",
  portraitScene: "open-mouthed and luminous, wind lifting her feathers",
  avatarScene: "close crop on the face and one wing tip",
  iconScenes: [
    "a single sweet note trailing a pearl, for Lure",
    "a closed eye and a curl of song, for Lullaby",
    "a ship's prow splitting on rocks, for Shipwreck",
    "a wave pulling sand back to sea, for Undertow",
  ],
});
export const THE_SIREN_VISUAL_BIBLE = built.bible;
export const THE_SIREN_ART = built.art;
