import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 #22 UMBRELLA YOKAI (Japanese Folklore) — a one-legged, one-eyed
// umbrella that hops about and steals your breath. Shelters friends, licks
// energy away, and brings the rain. docs/design/characters/umbrella-yokai.md

export const HOP_KICK = ability({
  id: "ability.umbrella-yokai.hop-kick",
  displayName: "Hop Kick",
  description: "A springy kick: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const TONGUE_LASH = ability({
  id: "ability.umbrella-yokai.tongue-lash",
  displayName: "Tongue Lash",
  description: "Licks 1 energy from an enemy for himself, and weakens its attacks by 10 for 2 turns.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "drainEnergy", family: "any", amount: 1, grantToSelf: true },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});
export const OPEN_UMBRELLA = ability({
  id: "ability.umbrella-yokai.open-umbrella",
  displayName: "Open Umbrella",
  description: "Shelters an ally: they take 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const RAIN_DANCE = ability({
  id: "ability.umbrella-yokai.rain-dance",
  displayName: "Rain Dance",
  description: "Summons a downpour: 10 damage to every enemy, and their abilities cost 1 more next turn.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.energy-cost-increase", magnitude: 1, durationTurns: 1 },
  ],
});

export const UMBRELLA_YOKAI_ABILITIES: Ability[] = [HOP_KICK, TONGUE_LASH, OPEN_UMBRELLA, RAIN_DANCE];

export const UMBRELLA_YOKAI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "umbrella-yokai",
  version: 1,
  displayName: "Umbrella Yokai",
  rarity: "RARE",
  tags: ["FOLKLORE", "CONTROLLER", "DEFENDER"],
  baseHp: 110,
  abilityIds: UMBRELLA_YOKAI_ABILITIES.map((a) => a.id),
  artSpecId: "umbrella-yokai",
});

const built = buildArt({
  bible: {
    characterId: "umbrella-yokai",
    species: "an old oiled-paper umbrella come to life, from Japanese folklore",
    ageRange: "a hundred years old",
    face: "a single large eye on the umbrella's canopy and a wide grin with a long tongue",
    bodyType: "an upright umbrella hopping on a single geta-shod leg",
    clothingArmor: "none — patched oiled paper and bamboo ribs",
    weaponsProps: "a long lolling tongue and a wooden handle used as a limb",
    markings: "a faded blue-and-white pattern on the canopy in an original design",
    silhouette: "an umbrella on a single wooden sandal with a long tongue trailing",
    signatureProps: ["a big single eye", "a long tongue", "one wooden sandal"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "a slapstick prankster that is truly a nuisance",
  environment: "a rainy village lane with wet cobbles",
  lighting: "grey rain light with lantern reflections in puddles",
  paletteConcept: "indigo paper, rain grey, red sandal, lantern amber",
  avoid: ["any existing game's umbrella-ghost design"],
  splashScene: "hopping through a puddle with the canopy open and the tongue flapping",
  portraitScene: "the one big eye and a wide grin on the canopy",
  avatarScene: "close crop on the eye and tongue",
  iconScenes: [
    "a wooden sandal kicking upward, for Hop Kick",
    "a long tongue wrapped around a glowing sphere, for Tongue Lash",
    "an open umbrella over a small figure, for Open Umbrella",
    "heavy rain falling on dark water, for Rain Dance",
  ],
});
export const UMBRELLA_YOKAI_VISUAL_BIBLE = built.bible;
export const UMBRELLA_YOKAI_ART = built.art;
