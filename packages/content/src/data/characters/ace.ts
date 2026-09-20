import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #104 ACE (Sports / Fighters) — a tennis pro whose serve cannot be blocked. Piercing damage that ignores armour and shields, with a volley to answer and a match point to end it. docs/design/characters/ace.md

export const SERVE = ability({
  id: "ability.ace.serve",
  displayName: "Serve",
  description: "A fast serve: 20 piercing damage (ignores shields and Damage Reduction).",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20, damageType: "piercing" }],
});
export const VOLLEY = ability({
  id: "ability.ace.volley",
  displayName: "Volley",
  description: "Meets the ball at the net: strikes back for 20 whenever hit, for a turn.",
  cost: { focus: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 1 }],
});
export const DROP_SHOT = ability({
  id: "ability.ace.drop-shot",
  displayName: "Drop Shot",
  description: "A soft little shot: 10 damage and the enemy is weakened for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const MATCH_POINT = ability({
  id: "ability.ace.match-point",
  displayName: "Match Point",
  description: "The final point: 60 piercing damage.",
  cost: { might: 2, focus: 2 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 60, damageType: "piercing" }],
});

export const ACE_ABILITIES: Ability[] = [SERVE, VOLLEY, DROP_SHOT, MATCH_POINT];

export const ACE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "ace",
  version: 1,
  displayName: "Ace",
  rarity: "RARE",
  tags: ["ATHLETE", "ATTACKER", "ASSASSIN"],
  baseHp: 100,
  abilityIds: ACE_ABILITIES.map((a) => a.id),
  artSpecId: "ace",
});

const built = buildArt({
  bible: {
    characterId: "ace",
    species: "a poised tennis professional of court tall tales",
    ageRange: "a woman in her mid-twenties",
    face: "a sharp, focused face with a sweatband, narrowed eyes and a steady jaw",
    bodyType: "lean, athletic and light on her feet",
    clothingArmor: "a crisp white tennis dress with a green trim, a green visor and white wristbands",
    weaponsProps: "a wooden-framed racket and a can of yellow balls",
    markings: "a green wristband on the racket arm",
    silhouette: "a lean figure in mid-serve with the racket high and a yellow ball at the top of its arc",
    signatureProps: ["a wooden racket", "a green visor", "a yellow ball"],
  },
  region: "Stadium and ring inspiration (floodlights, worn leather, chalk dust, hand-painted banners, no real teams, leagues or people)",
  visualTheme: "the point that cannot be returned",
  environment: "a sunlit grass court with white lines",
  lighting: "bright afternoon sun and crisp shadows",
  paletteConcept: "court green, line white, ball yellow, visor green",
  avoid: ["any existing game's ace design"],
  splashScene: "at the top of a serve with the racket high and the ball frozen at its peak against a bright sky",
  portraitScene: "a focused face under a green visor",
  avatarScene: "close crop on the visor and eyes",
  iconScenes: ["a yellow ball blurring off a racket, for Serve", "a racket held at the net, for Volley", "a ball dropping softly over a net, for Drop Shot", "a scoreboard showing a single glowing point, for Match Point"],
});
export const ACE_VISUAL_BIBLE = built.bible;
export const ACE_ART = built.art;
