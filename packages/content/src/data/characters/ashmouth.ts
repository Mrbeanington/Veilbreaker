import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #85 ASHMOUTH (Horror / Monsters / Dead) — a monster with a furnace for a throat. It chokes a team in ash so everything costs more, then swallows whoever is left. docs/design/characters/ashmouth.md

export const CHOKING_ASH = ability({
  id: "ability.ashmouth.choking-ash",
  displayName: "Choking Ash",
  description: "A cloud of ash: everything costs every enemy more for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.energy-cost-increase", durationTurns: 2 }],
});
export const MAW_SNAP = ability({
  id: "ability.ashmouth.maw-snap",
  displayName: "Maw Snap",
  description: "Snapping jaws: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const SWALLOW = ability({
  id: "ability.ashmouth.swallow",
  displayName: "Swallow",
  description: "Swallows what it catches: 40 damage, and it heals 20.",
  cost: { might: 2, chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 40 }, { kind: "heal", healingClass: "lifeTransfer", amount: 20, target: SELF_ONLY }],
});
export const ASH_SHROUD = ability({
  id: "ability.ashmouth.ash-shroud",
  displayName: "Ash Shroud",
  description: "Wraps itself in drifting ash: takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const ASHMOUTH_ABILITIES: Ability[] = [CHOKING_ASH, MAW_SNAP, SWALLOW, ASH_SHROUD];

export const ASHMOUTH: CharacterDefinition = characterDefinitionSchema.parse({
  id: "ashmouth",
  version: 1,
  displayName: "Ashmouth",
  rarity: "RARE",
  tags: ["FOLKLORE", "BEAST", "CONTROLLER"],
  baseHp: 150,
  abilityIds: ASHMOUTH_ABILITIES.map((a) => a.id),
  artSpecId: "ashmouth",
});

const built = buildArt({
  bible: {
    characterId: "ashmouth",
    species: "a furnace-throated ash monster of gothic folk horror",
    ageRange: "ancient",
    face: "a huge charcoal-black maw ringed with cracked teeth and dull orange light deep in the throat",
    bodyType: "hulking, low and hunched",
    clothingArmor: "cracked grey-black hide crusted with ash and old soot",
    weaponsProps: "trailing grey smoke and glowing cracks",
    markings: "orange ember light seeping through every crack in the hide",
    silhouette: "a huge hunched shape with an open glowing mouth trailing ash",
    signatureProps: ["a glowing furnace throat", "cracked ash-grey hide", "trailing smoke"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "the thing at the bottom of the chimney",
  environment: "a burnt-out ruin of a village with ash drifting",
  lighting: "orange glow from within and grey daylight through smoke",
  paletteConcept: "soot black, ember orange, ash grey, bone",
  avoid: ["any existing game's ashmouth design"],
  splashScene: "crawling out of a burnt cottage with its throat glowing and ash pouring from its jaws",
  portraitScene: "a wide dark mouth with a dull orange glow inside",
  avatarScene: "close crop on the maw",
  iconScenes: ["a grey cloud of ash choking a lantern, for Choking Ash", "cracked teeth snapping shut, for Maw Snap", "a wide glowing throat opening, for Swallow", "grey ash drifting round a dark shape, for Ash Shroud"],
});
export const ASHMOUTH_VISUAL_BIBLE = built.bible;
export const ASHMOUTH_ART = built.art;
