import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #101 THE GUNSLINGER QB (Sports / Fighters) — a quarterback who always throws deep. The long bomb is a gamble: an interception costs him blood, a completion wins the game. docs/design/characters/the-gunslinger-qb.md

export const QUICK_SLANT = ability({
  id: "ability.the-gunslinger-qb.quick-slant",
  displayName: "Quick Slant",
  description: "A short, safe throw: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const LONG_BOMB = ability({
  id: "ability.the-gunslinger-qb.long-bomb",
  displayName: "Long Bomb",
  description: "Throws deep, at random: intercepted (10 damage to the enemy and 20 to him), 40 damage, or a 70 touchdown.",
  cost: { might: 2, focus: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "damage", amount: 10 }, { kind: "damage", amount: 20, damageType: "affliction", target: SELF_ONLY }] },
          { weight: 2, effects: [{ kind: "damage", amount: 40 }] },
          { weight: 2, effects: [{ kind: "damage", amount: 70 }] },
        ],
      },
    },
  ],
});
export const PLAY_FAKE = ability({
  id: "ability.the-gunslinger-qb.play-fake",
  displayName: "Play Fake",
  description: "A fake handoff: the enemy is weakened for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const SCRAMBLE = ability({
  id: "ability.the-gunslinger-qb.scramble",
  displayName: "Scramble",
  description: "Runs out of the pocket: untargetable for a turn.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});

export const THE_GUNSLINGER_QB_ABILITIES: Ability[] = [QUICK_SLANT, LONG_BOMB, PLAY_FAKE, SCRAMBLE];

export const THE_GUNSLINGER_QB: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-gunslinger-qb",
  version: 1,
  displayName: "The Gunslinger QB",
  rarity: "RARE",
  tags: ["ATHLETE", "ATTACKER", "RANDOM"],
  baseHp: 100,
  abilityIds: THE_GUNSLINGER_QB_ABILITIES.map((a) => a.id),
  artSpecId: "the-gunslinger-qb",
});

const built = buildArt({
  bible: {
    characterId: "the-gunslinger-qb",
    species: "a swaggering quarterback of stadium tall tales",
    ageRange: "a man in his late twenties",
    face: "a confident grin under a scuffed helmet with a clear visor and a strip of white tape across the nose",
    bodyType: "tall, lean and loose-armed",
    clothingArmor: "a dusty blue jersey with a large number, a padded vest, tape-wrapped fingers and a long towel at the belt",
    weaponsProps: "a leather football held like a pistol",
    markings: "a long white scar across the throwing hand",
    silhouette: "a tall lean figure cocked back with a football raised like a pistol",
    signatureProps: ["a clear-visor helmet", "a football held like a pistol", "a belt towel"],
  },
  region: "Stadium and ring inspiration (floodlights, worn leather, chalk dust, hand-painted banners, no real teams, leagues or people)",
  visualTheme: "the deep ball is the only ball",
  environment: "a floodlit stadium at dusk with a dusty field",
  lighting: "golden late sun and dust",
  paletteConcept: "jersey blue, dust gold, chalk white, turf green",
  avoid: ["any existing game's the gunslinger qb design"],
  splashScene: "cocking the football back like a pistol with the field stretching away and a receiver far downfield",
  portraitScene: "a confident grin under a clear visor",
  avatarScene: "close crop on the visor and grin",
  iconScenes: ["a short spiralling ball, for Quick Slant", "a huge arc of a football across a sky, for Long Bomb", "a hand pulled back from a handoff, for Play Fake", "a figure rolling out of a crumbling pocket, for Scramble"],
});
export const THE_GUNSLINGER_QB_VISUAL_BIBLE = built.bible;
export const THE_GUNSLINGER_QB_ART = built.art;
