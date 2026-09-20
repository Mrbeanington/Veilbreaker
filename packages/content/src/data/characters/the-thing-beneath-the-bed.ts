import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #86 THE THING BENEATH THE BED (Horror / Monsters / Dead) — the childhood fear that grabs an ankle. It strikes hardest at the unwounded, and hides when it is seen. docs/design/characters/the-thing-beneath-the-bed.md

export const GRASP_FROM_BELOW = ability({
  id: "ability.the-thing-beneath-the-bed.grasp-from-below",
  displayName: "Grasp from Below",
  description: "30 damage, or 60 against an enemy at full health.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "not", condition: { type: "hpBelowPercent", target: "target", percent: 100 } },
      ifTrue: [{ kind: "damage", amount: 60 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const NIGHT_TERRORS = ability({
  id: "ability.the-thing-beneath-the-bed.night-terrors",
  displayName: "Night Terrors",
  description: "Everything in the dark stirs: every enemy takes 10 damage and is frightened for a turn.",
  cost: { focus: 1, chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }, { kind: "applyStatus", statusId: "status.fear", durationTurns: 1 }],
});
export const COLD_HAND = ability({
  id: "ability.the-thing-beneath-the-bed.cold-hand",
  displayName: "Cold Hand",
  description: "A cold hand closes round an ankle: the enemy is stunned for a turn.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const UNDER_THE_BED = ability({
  id: "ability.the-thing-beneath-the-bed.under-the-bed",
  displayName: "Under the Bed",
  description: "Slips back into the dark: untargetable for a turn.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});

export const THE_THING_BENEATH_THE_BED_ABILITIES: Ability[] = [GRASP_FROM_BELOW, NIGHT_TERRORS, COLD_HAND, UNDER_THE_BED];

export const THE_THING_BENEATH_THE_BED: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-thing-beneath-the-bed",
  version: 1,
  displayName: "The Thing Beneath the Bed",
  rarity: "RARE",
  tags: ["FOLKLORE", "ASSASSIN", "CURSE"],
  baseHp: 110,
  abilityIds: THE_THING_BENEATH_THE_BED_ABILITIES.map((a) => a.id),
  artSpecId: "the-thing-beneath-the-bed",
});

const built = buildArt({
  bible: {
    characterId: "the-thing-beneath-the-bed",
    species: "a long-armed shadow creature of childhood folk horror",
    ageRange: "unknowable",
    face: "no clear face: two wide pale eyes low in a mass of shadow",
    bodyType: "flat, low and impossibly long-armed",
    clothingArmor: "nothing: a shape of dust, shadow and loose threads",
    weaponsProps: "long thin fingers with too many joints",
    markings: "a faint film of dust and cobweb over everything",
    silhouette: "a low mass of shadow under a bed with a long thin arm reaching out",
    signatureProps: ["two pale eyes", "long thin fingers", "a dusty shadow"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "the thing you knew was there",
  environment: "a child's bedroom at night with a low iron bed",
  lighting: "a thin moonlit slice and a dim night-light",
  paletteConcept: "shadow black, dust grey, pale eyes, faded quilt blue",
  avoid: ["any existing game's the thing beneath the bed design"],
  splashScene: "reaching out from beneath a low iron bed with one long thin arm across the floorboards",
  portraitScene: "two wide pale eyes low in the dark",
  avatarScene: "close crop on the eyes",
  iconScenes: ["a long thin hand around an ankle in dust, for Grasp from Below", "faint scratching shapes on a dark wall, for Night Terrors", "a pale cold hand with too many joints, for Cold Hand", "two pale eyes sinking under a bed, for Under the Bed"],
});
export const THE_THING_BENEATH_THE_BED_VISUAL_BIBLE = built.bible;
export const THE_THING_BENEATH_THE_BED_ART = built.art;
