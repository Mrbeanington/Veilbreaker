import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #83 THE VAMPIRE COUNTESS (Horror / Monsters / Dead) — an aristocratic predator. Every bite feeds her; she dissolves into mist and leaves her prey weakened. docs/design/characters/the-vampire-countess.md

export const FANGS = ability({
  id: "ability.the-vampire-countess.fangs",
  displayName: "Fangs",
  description: "A bite: 20 damage, and she heals 10.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "heal", healingClass: "lifeTransfer", amount: 10, target: SELF_ONLY }],
});
export const MIST_FORM = ability({
  id: "ability.the-vampire-countess.mist-form",
  displayName: "Mist Form",
  description: "Turns to mist: untargetable for a turn.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const CRIMSON_KISS = ability({
  id: "ability.the-vampire-countess.crimson-kiss",
  displayName: "Crimson Kiss",
  description: "A kiss that drains: the enemy is weakened and takes 10 more damage for 2 turns.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }, { kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 2 }],
});
export const BAT_SWARM = ability({
  id: "ability.the-vampire-countess.bat-swarm",
  displayName: "Bat Swarm",
  description: "A cloud of bats: 10 damage to every enemy.",
  cost: { might: 1, chaos: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }],
});

export const THE_VAMPIRE_COUNTESS_ABILITIES: Ability[] = [FANGS, MIST_FORM, CRIMSON_KISS, BAT_SWARM];

export const THE_VAMPIRE_COUNTESS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-vampire-countess",
  version: 1,
  displayName: "The Vampire Countess",
  rarity: "RARE",
  tags: ["FOLKLORE", "UNDEAD", "ATTACKER"],
  baseHp: 120,
  abilityIds: THE_VAMPIRE_COUNTESS_ABILITIES.map((a) => a.id),
  artSpecId: "the-vampire-countess",
});

const built = buildArt({
  bible: {
    characterId: "the-vampire-countess",
    species: "an aristocratic vampire countess of gothic folk horror",
    ageRange: "apparently thirty, centuries old",
    face: "a pale, sharp-boned face with dark red lips and cold amber eyes",
    bodyType: "tall, slender and poised",
    clothingArmor: "a high-collared black velvet gown with crimson lining and a long dark cloak",
    weaponsProps: "a jewelled goblet and a cloud of small bats",
    markings: "a thin dark line at the corner of the mouth",
    silhouette: "a tall gowned figure with a high collar and a cloak flowing into a cloud of bats",
    signatureProps: ["a high collar", "a crimson-lined cloak", "a cloud of bats"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "an old hunger with good manners",
  environment: "a moonlit castle ballroom with cobwebbed chandeliers",
  lighting: "cold moonlight and a few candles",
  paletteConcept: "velvet black, blood red, moon white, amber",
  avoid: ["any existing game's the vampire countess design"],
  splashScene: "descending a castle staircase with the cloak trailing into a swirl of bats",
  portraitScene: "a pale sharp-boned face with cold amber eyes",
  avatarScene: "close crop on the collar and eyes",
  iconScenes: ["two small fangs and a drop of red, for Fangs", "a swirl of grey mist with two eyes, for Mist Form", "dark red lips close to a pale neck, for Crimson Kiss", "a cloud of bats against a moon, for Bat Swarm"],
});
export const THE_VAMPIRE_COUNTESS_VISUAL_BIBLE = built.bible;
export const THE_VAMPIRE_COUNTESS_ART = built.art;
