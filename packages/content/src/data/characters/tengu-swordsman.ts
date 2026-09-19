import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #20 TENGU SWORDSMAN (Japanese Folklore) — a mountain duellist. He
// waits, lets the enemy commit, then strikes: a Waiting Blade followed by an
// Iai Strike is his whole art. docs/design/characters/tengu-swordsman.md

export const FEATHER_FAN = ability({
  id: "ability.tengu-swordsman.feather-fan",
  displayName: "Feather Fan",
  description: "A gust from a feather fan: 10 damage to every enemy.",
  cost: { focus: 1 },
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }],
});
export const WAITING_BLADE = ability({
  id: "ability.tengu-swordsman.waiting-blade",
  displayName: "Waiting Blade",
  description: "For a turn, whoever strikes him takes 30 damage back.",
  cost: { focus: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 30, durationTurns: 1 }],
});
export const IAI_STRIKE = ability({
  id: "ability.tengu-swordsman.iai-strike",
  displayName: "Iai Strike",
  description: "20 damage. If he used Waiting Blade last, the draw is instant: 70 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: WAITING_BLADE.id },
      ifTrue: [{ kind: "damage", amount: 70 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const GALE_STEP = ability({
  id: "ability.tengu-swordsman.gale-step",
  displayName: "Gale Step",
  description: "Rides the wind: his abilities recover a turn faster for 2 turns, and he takes 10 less damage.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.cooldown-reduction", magnitude: 1, durationTurns: 2 },
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 2 },
  ],
});

export const TENGU_SWORDSMAN_ABILITIES: Ability[] = [FEATHER_FAN, WAITING_BLADE, IAI_STRIKE, GALE_STEP];

export const TENGU_SWORDSMAN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "tengu-swordsman",
  version: 1,
  displayName: "Tengu Swordsman",
  rarity: "RARE",
  tags: ["FOLKLORE", "WARRIOR", "ASSASSIN"],
  baseHp: 120,
  abilityIds: TENGU_SWORDSMAN_ABILITIES.map((a) => a.id),
  artSpecId: "tengu-swordsman",
});

const built = buildArt({
  bible: {
    characterId: "tengu-swordsman",
    species: "a mountain spirit swordsman of Japanese folklore",
    ageRange: "middle-aged, weathered",
    face: "a long-nosed red face with sharp dark eyes and a stern set mouth",
    bodyType: "lean and balanced, always mid-stance",
    clothingArmor: "a dark mountain-ascetic robe with white tassels and a small black cap",
    weaponsProps: "a long straight sword in a plain scabbard and a fan of black feathers",
    markings: "black-feathered wings folded at his back",
    silhouette: "a still figure with folded wings, one hand on a sword hilt",
    signatureProps: ["a long-nosed mask-like face", "black feather wings", "a feather fan"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "patience so complete that the strike is over before it starts",
  environment: "a cedar-lined mountain path in mist",
  lighting: "grey morning light through cedar branches",
  paletteConcept: "cedar green, ink black, vermilion accents, mist white",
  avoid: ["any existing anime or game tengu design"],
  splashScene: "standing motionless on a mountain path with his hand on the hilt and feathers drifting past",
  portraitScene: "a stern long-nosed face in profile with a single feather falling",
  avatarScene: "close crop on the face and the hilt",
  iconScenes: [
    "a fan of black feathers opening, for Feather Fan",
    "a sword hand resting on a hilt, for Waiting Blade",
    "a single silver line across the frame, for Iai Strike",
    "swirling wind around a foot, for Gale Step",
  ],
});
export const TENGU_SWORDSMAN_VISUAL_BIBLE = built.bible;
export const TENGU_SWORDSMAN_ART = built.art;
