import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #39 ONE-EYED LIKHO (Slavic / Russian Night) — misfortune given a
// face. Her Evil Eye curses, Ill Omen taxes, Wandering Woe is a bad-luck
// gamble, and Shared Misfortune costs her blood to break a cursed enemy.
// docs/design/characters/one-eyed-likho.md

export const LIKHO_EVIL_EYE = ability({
  id: "ability.one-eyed-likho.evil-eye",
  displayName: "Evil Eye",
  description: "Stares an enemy down: it is cursed for 3 turns and weakened for 2.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});
export const ILL_OMEN = ability({
  id: "ability.one-eyed-likho.ill-omen",
  displayName: "Ill Omen",
  description: "Bad news travels: the enemy's abilities cost 1 more and its cooldowns slow, for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.energy-cost-increase", magnitude: 1, durationTurns: 2 },
    { kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 },
  ],
});
export const WANDERING_WOE = ability({
  id: "ability.one-eyed-likho.wandering-woe",
  displayName: "Wandering Woe",
  description: "Misfortune finds someone: a random result of 10, 30 or 50 damage (the big one is rare).",
  cost: { chaos: 1, spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 4, effects: [{ kind: "damage", amount: 10 }] },
          { weight: 2, effects: [{ kind: "damage", amount: 30 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 50 }] },
        ],
      },
    },
  ],
});
export const SHARED_MISFORTUNE = ability({
  id: "ability.one-eyed-likho.shared-misfortune",
  displayName: "Shared Misfortune",
  description: "On a cursed enemy: 50 damage, and it costs her 20 of her own health. Otherwise it does nothing.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.curse" },
      ifTrue: [
        { kind: "damage", amount: 50 },
        { kind: "damage", amount: 20, damageType: "affliction", target: SELF_ONLY },
      ],
    },
  ],
});

export const ONE_EYED_LIKHO_ABILITIES: Ability[] = [LIKHO_EVIL_EYE, ILL_OMEN, WANDERING_WOE, SHARED_MISFORTUNE];

export const ONE_EYED_LIKHO: CharacterDefinition = characterDefinitionSchema.parse({
  id: "one-eyed-likho",
  version: 1,
  displayName: "One-Eyed Likho",
  rarity: "RARE",
  tags: ["FOLKLORE", "CURSE", "CONTROLLER", "RANDOM"],
  baseHp: 130,
  abilityIds: ONE_EYED_LIKHO_ABILITIES.map((a) => a.id),
  artSpecId: "one-eyed-likho",
});

const built = buildArt({
  bible: {
    characterId: "one-eyed-likho",
    species: "a misfortune spirit of Slavic folklore",
    ageRange: "an old woman in appearance",
    face: "a gaunt, sallow face with a single huge eye in the centre of her forehead and a toothless grin",
    bodyType: "tall, bent and thin, trailing rags",
    clothingArmor: "layers of grey patched rags tied with old rope",
    weaponsProps: "a walking stick and a sack of bad news",
    markings: "a milky scar where the second eye should be",
    silhouette: "a bent, ragged figure with a single glowing eye on a road at dusk",
    signatureProps: ["one huge eye", "a ragged sack", "a walking stick"],
  },
  region: "Slavic folklore inspiration (deep forests, folk ornament geometry, storybook atmosphere)",
  visualTheme: "bad luck that has learned to walk",
  environment: "a muddy crossroads with a leaning signpost",
  lighting: "flat grey dusk with a faint yellow glint on her eye",
  paletteConcept: "rag grey, mud brown, sickly yellow, black",
  avoid: ["any existing game's cyclops or hag design"],
  splashScene: "shuffling toward the viewer down the road with the big eye wide and the sack dragging",
  portraitScene: "the single huge eye filling the frame under a ragged hood",
  avatarScene: "close crop on the eye",
  iconScenes: [
    "a single eye with a black ring of curse, for Evil Eye",
    "a black bird landing on a signpost, for Ill Omen",
    "a tossed handful of bones in the dirt, for Wandering Woe",
    "two figures bound by a torn thread, for Shared Misfortune",
  ],
});
export const ONE_EYED_LIKHO_VISUAL_BIBLE = built.bible;
export const ONE_EYED_LIKHO_ART = built.art;
