import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE } from "./helpers";

// spec/03 #7 THE ORACLE (Ancient Mediterranean) — prophecy. She foretells an
// enemy's fate: the next time it is hurt, the wound is worse, exactly once.
// docs/design/characters/the-oracle.md. `status.foretold` lives in statuses.ts.

export const FORETELL = ability({
  id: "ability.the-oracle.foretell",
  displayName: "Foretell",
  description: "Foretells an enemy's fate for 3 turns: the next time it is damaged, it takes 30 more, once.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.foretold", durationTurns: 3 }],
});
export const WARNING_DREAM = ability({
  id: "ability.the-oracle.warning-dream",
  displayName: "Warning Dream",
  description: "Gives an ally a shield of 30 for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});
export const SIBYLLINE_RIDDLE = ability({
  id: "ability.the-oracle.sibylline-riddle",
  displayName: "Sibylline Riddle",
  description: "An unanswerable riddle silences an enemy for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const FATES_VERDICT = ability({
  id: "ability.the-oracle.fates-verdict",
  displayName: "Fate's Verdict",
  description: "60 damage to a foretold enemy, and the prophecy is spent. Otherwise 20.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.foretold" },
      ifTrue: [
        { kind: "removeStatus", statusId: "status.foretold" },
        { kind: "damage", amount: 60 },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});

export const THE_ORACLE_ABILITIES: Ability[] = [FORETELL, WARNING_DREAM, SIBYLLINE_RIDDLE, FATES_VERDICT];

export const THE_ORACLE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-oracle",
  version: 1,
  displayName: "The Oracle",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "SUPPORT", "MAGE"],
  baseHp: 100,
  abilityIds: THE_ORACLE_ABILITIES.map((a) => a.id),
  artSpecId: "the-oracle",
});

const built = buildArt({
  bible: {
    characterId: "the-oracle",
    species: "a priestess-seer of Mediterranean myth",
    ageRange: "impossible to tell",
    face: "a calm face with milky, unfocused eyes and lips slightly parted mid-prophecy",
    bodyType: "slight and upright, seated on a tall tripod",
    clothingArmor: "flowing white robes with a laurel wreath",
    weaponsProps: "a shallow bronze bowl of smoking vapours and a laurel branch",
    markings: "faint gold lines drawn across her closed lids",
    silhouette: "a robed figure perched on a tripod amid rising vapour",
    signatureProps: ["a tripod", "rising vapour", "a laurel wreath"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a voice that knows how everything ends",
  environment: "a cracked marble temple floor over a chasm of vapour",
  lighting: "pale gold light through drifting smoke",
  paletteConcept: "marble white, laurel green, pale gold, vapour grey",
  avoid: ["any existing game's seer or priestess design"],
  splashScene: "seated on the tripod with vapour curling around her and her eyes wide and blank",
  portraitScene: "her milky eyes fixed past the viewer, gold lines on her lids",
  avatarScene: "close crop on the eyes and laurel",
  iconScenes: [
    "an eye with a thread of gold leading away, for Foretell",
    "a closed eye under a shield of light, for Warning Dream",
    "a knot of question marks in smoke shaped like a face, for Sibylline Riddle",
    "a scroll unrolling to a final line, for Fate's Verdict",
  ],
});
export const THE_ORACLE_VISUAL_BIBLE = built.bible;
export const THE_ORACLE_ART = built.art;
