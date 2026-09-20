import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #68 DOKKAEBI (World Folklore) — the Korean goblin with the magic club. Mischief and luck: a club that may strike hard or spill gold, and pranks that make everything cost more. docs/design/characters/dokkaebi.md

export const MAGIC_CLUB = ability({
  id: "ability.dokkaebi.magic-club",
  displayName: "Magic Club",
  description: "Knocks out a swing at random: 40 damage, or 20 damage and a shower of gold (1 extra Chaos).",
  cost: { might: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "damage", amount: 20 }, { kind: "modifyEnergy", family: "CHAOS", amount: 1 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 40 }] },
        ],
      },
    },
  ],
});
export const GOBLIN_GOLD = ability({
  id: "ability.dokkaebi.goblin-gold",
  displayName: "Goblin Gold",
  description: "Pulls gold from thin air: 2 extra Chaos energy for the team.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "modifyEnergy", family: "CHAOS", amount: 2 }],
});
export const PRANK = ability({
  id: "ability.dokkaebi.prank",
  displayName: "Prank",
  description: "A mean little trick: the enemy is weakened and everything costs it more for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }, { kind: "applyStatus", statusId: "status.energy-cost-increase", durationTurns: 2 }],
});
export const BUMP_IN_THE_NIGHT = ability({
  id: "ability.dokkaebi.bump-in-the-night",
  displayName: "Bump in the Night",
  description: "A shove out of the dark: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});

export const DOKKAEBI_ABILITIES: Ability[] = [MAGIC_CLUB, GOBLIN_GOLD, PRANK, BUMP_IN_THE_NIGHT];

export const DOKKAEBI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "dokkaebi",
  version: 1,
  displayName: "Dokkaebi",
  rarity: "RARE",
  tags: ["FOLKLORE", "CONTROLLER", "RANDOM"],
  baseHp: 120,
  abilityIds: DOKKAEBI_ABILITIES.map((a) => a.id),
  artSpecId: "dokkaebi",
});

const built = buildArt({
  bible: {
    characterId: "dokkaebi",
    species: "a mischievous goblin of Korean folk tales",
    ageRange: "ageless",
    face: "a wide grin, a single short horn and bright playful eyes",
    bodyType: "stocky and springy",
    clothingArmor: "a rough hanbok-style jacket, a fur-trimmed hat and a bright sash",
    weaponsProps: "a big knobbly magic club and a pouch that spills gold",
    markings: "small painted red stripes on the cheeks",
    silhouette: "a stocky horned figure carrying a huge knobbly club over one shoulder",
    signatureProps: ["a knobbly magic club", "a pouch of gold", "a single horn"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "a joke with a club at the end of it",
  environment: "a village lane at night with paper lanterns",
  lighting: "bright lantern light and moonlight",
  paletteConcept: "lantern red, gold, night blue, bark brown",
  avoid: ["any existing game's dokkaebi design"],
  splashScene: "leaping over a lane with the club raised and gold coins spilling from the pouch",
  portraitScene: "a wide grin under one short horn",
  avatarScene: "close crop on the grin and horn",
  iconScenes: ["a knobbly club mid-swing, for Magic Club", "a pouch spilling glowing gold, for Goblin Gold", "a rope tied across a path, for Prank", "a shadowy hand shoving from behind a door, for Bump in the Night"],
});
export const DOKKAEBI_VISUAL_BIBLE = built.bible;
export const DOKKAEBI_ART = built.art;
