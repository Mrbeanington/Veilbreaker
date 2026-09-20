import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #100 FOURTH & ONE (Sports / Fighters) — a running back who lives on the fourth down. The Downs count up every turn; at three he can go for it, all or nothing. docs/design/characters/fourth-and-one.md

export const DOWNS_RESOURCE: Resource = {
  id: "resource.downs",
  displayName: "Downs",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const DOWN_AND_DISTANCE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.fourth-and-one.down-and-distance",
  displayName: "Down and Distance",
  description: "At the end of each of his turns he gains a Down (max 3).",
  trigger: { event: "onTurnEnd", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: DOWNS_RESOURCE.id, amount: 1 }],
});

export const SHOULDER_CHARGE = ability({
  id: "ability.fourth-and-one.shoulder-charge",
  displayName: "Shoulder Charge",
  description: "Lowers the shoulder: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const GO_FOR_IT = ability({
  id: "ability.fourth-and-one.go-for-it",
  displayName: "Go For It",
  description: "20 damage, or 70 with 3 Downs, which it spends.",
  cost: { might: 2, chaos: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: DOWNS_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "damage", amount: 70 }, { kind: "modifyResource", resourceId: DOWNS_RESOURCE.id, amount: -3, target: SELF_ONLY }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const STIFF_ARM = ability({
  id: "ability.fourth-and-one.stiff-arm",
  displayName: "Stiff Arm",
  description: "Holds a tackler off: 20 damage and the enemy is weakened for 2 turns.",
  cost: { might: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const HUDDLE_UP = ability({
  id: "ability.fourth-and-one.huddle-up",
  displayName: "Huddle Up",
  description: "Calls the huddle: every ally takes 20 less damage for 2 turns.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: { side: "ally", scope: "all", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const FOURTH_AND_ONE_ABILITIES: Ability[] = [SHOULDER_CHARGE, GO_FOR_IT, STIFF_ARM, HUDDLE_UP];

export const FOURTH_AND_ONE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "fourth-and-one",
  version: 1,
  displayName: "Fourth & One",
  rarity: "RARE",
  tags: ["ATHLETE", "BRUISER", "ATTACKER"],
  baseHp: 120,
  abilityIds: FOURTH_AND_ONE_ABILITIES.map((a) => a.id),
  passiveId: DOWN_AND_DISTANCE.id,
  resources: [DOWNS_RESOURCE],
  artSpecId: "fourth-and-one",
});

const built = buildArt({
  bible: {
    characterId: "fourth-and-one",
    species: "a battered veteran running back of stadium tall tales",
    ageRange: "a man in his thirties",
    face: "a square, stubbled face with a broken nose, eye-black stripes and a calm squint",
    bodyType: "compact, thick-legged and heavily padded",
    clothingArmor: "a scuffed red-and-white armoured jersey with a large number, shoulder pads, a cracked helmet and tape-wrapped wrists",
    weaponsProps: "a worn leather football tucked under one arm",
    markings: "eye-black stripes and old tape on both wrists",
    silhouette: "a low, padded figure charging with a ball under one arm and a cracked helmet",
    signatureProps: ["a scuffed helmet", "a padded jersey", "a leather football"],
  },
  region: "Stadium and ring inspiration (floodlights, worn leather, chalk dust, hand-painted banners, no real teams, leagues or people)",
  visualTheme: "one yard, everything on the line",
  environment: "a floodlit stadium at night with chalk lines",
  lighting: "harsh white floodlights and steam off the crowd",
  paletteConcept: "jersey red, chalk white, turf green, floodlight silver",
  avoid: ["any existing game's fourth & one design"],
  splashScene: "lowering his shoulder on a chalk line at the goal with the ball tucked and floodlights flaring behind",
  portraitScene: "a stubbled face with eye-black and a calm squint under a cracked helmet",
  avatarScene: "close crop on the helmet and eye-black",
  iconScenes: ["a padded shoulder driving forward, for Shoulder Charge", "a ball tucked tight over a chalk line, for Go For It", "a straight arm held out, for Stiff Arm", "a ring of players' hands in the middle, for Huddle Up"],
});
export const FOURTH_AND_ONE_VISUAL_BIBLE = built.bible;
export const FOURTH_AND_ONE_ART = built.art;
