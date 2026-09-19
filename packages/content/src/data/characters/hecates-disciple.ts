import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE } from "./helpers";

// spec/03 #12 HECATE'S DISCIPLE (Ancient Mediterranean) — crossroads magic. A
// torch that burns, a hex chosen by the road not taken, and a dark supper that
// feeds on curses. docs/design/characters/hecates-disciple.md

export const MOONLESS_TORCH = ability({
  id: "ability.hecates-disciple.moonless-torch",
  displayName: "Moonless Torch",
  description: "10 damage and Burn from a black flame.",
  cost: { chaos: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 3 },
  ],
});
export const THREE_ROADS = ability({
  id: "ability.hecates-disciple.three-roads",
  displayName: "Three Roads",
  description: "A hex chosen at the crossroads, at random: weakened, slowed, more expensive, or (rarely) silenced.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 2, effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }] },
          { weight: 2, effects: [{ kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 }] },
          { weight: 2, effects: [{ kind: "applyStatus", statusId: "status.energy-cost-increase", magnitude: 1, durationTurns: 2 }] },
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }] },
        ],
      },
    },
  ],
});
export const WITCHS_WARD = ability({
  id: "ability.hecates-disciple.witchs-ward",
  displayName: "Witch's Ward",
  description: "An ally takes 10 less damage for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 3 }],
});
export const DARK_SUPPER = ability({
  id: "ability.hecates-disciple.dark-supper",
  displayName: "Dark Supper",
  description: "Feeds on a curse: 50 damage to a cursed enemy. Otherwise 20 damage and it becomes cursed.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.curse" },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [
        { kind: "damage", amount: 20 },
        { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
      ],
    },
  ],
});

export const HECATES_DISCIPLE_ABILITIES: Ability[] = [MOONLESS_TORCH, THREE_ROADS, WITCHS_WARD, DARK_SUPPER];

export const HECATES_DISCIPLE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "hecates-disciple",
  version: 1,
  displayName: "Hecate's Disciple",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "MAGE", "CURSE", "RANDOM"],
  baseHp: 110,
  abilityIds: HECATES_DISCIPLE_ABILITIES.map((a) => a.id),
  artSpecId: "hecates-disciple",
});

const built = buildArt({
  bible: {
    characterId: "hecates-disciple",
    species: "a young initiate of a crossroads goddess from Mediterranean myth",
    ageRange: "young adult",
    face: "a watchful young face with dark eyes and a small knowing smile",
    bodyType: "lean and quick, always half in shadow",
    clothingArmor: "a dark hooded cloak over a plain grey tunic",
    weaponsProps: "a black-flamed torch and a ring of three old keys",
    markings: "three thin lines painted across her brow, one for each road",
    silhouette: "a hooded figure holding a torch at a three-way crossing",
    signatureProps: ["a black-flamed torch", "three keys", "a crossroads marker"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "someone who knows which road you will regret",
  environment: "a moonless crossroads with a stone marker and offerings",
  lighting: "black-flamed torchlight under a starless sky",
  paletteConcept: "midnight blue, torch violet, dull bronze, bone white",
  avoid: ["any existing game's witch or goddess-servant design"],
  splashScene: "standing at the crossroads with three roads fading behind her and the torch held high",
  portraitScene: "half her face lit by the black flame, keys glinting",
  avatarScene: "close crop on the face and torch",
  iconScenes: [
    "a torch burning with a black flame, for Moonless Torch",
    "a three-way fork in a road, for Three Roads",
    "a ring of hooded light around a figure, for Witch's Ward",
    "a bowl of dark liquid with a sliver of moon, for Dark Supper",
  ],
});
export const HECATES_DISCIPLE_VISUAL_BIBLE = built.bible;
export const HECATES_DISCIPLE_ART = built.art;
