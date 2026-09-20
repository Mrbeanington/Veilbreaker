import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #102 EL MAGNÍFICO (Sports / Fighters) — a masked showman of the wrestling ring. He slams a foe down, then flies onto the stunned. docs/design/characters/el-magnifico.md

export const BODY_SLAM = ability({
  id: "ability.el-magnifico.body-slam",
  displayName: "Body Slam",
  description: "Slams the enemy to the mat: 20 damage and it is stunned for a turn.",
  cost: { might: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const FLYING_ELBOW = ability({
  id: "ability.el-magnifico.flying-elbow",
  displayName: "Flying Elbow",
  description: "30 damage, or 70 against a stunned enemy.",
  cost: { might: 2, focus: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.stun" },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const TAUNT_THE_CROWD = ability({
  id: "ability.el-magnifico.taunt-the-crowd",
  displayName: "Taunt the Crowd",
  description: "Plays to the crowd: single-target attacks are drawn to him for a turn, and he takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 }, { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const SECOND_WIND = ability({
  id: "ability.el-magnifico.second-wind",
  displayName: "Second Wind",
  description: "The crowd lifts him: he heals 20.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});

export const EL_MAGNIFICO_ABILITIES: Ability[] = [BODY_SLAM, FLYING_ELBOW, TAUNT_THE_CROWD, SECOND_WIND];

export const EL_MAGNIFICO: CharacterDefinition = characterDefinitionSchema.parse({
  id: "el-magnifico",
  version: 1,
  displayName: "El Magnífico",
  rarity: "RARE",
  tags: ["ATHLETE", "ATTACKER", "CONTROLLER"],
  baseHp: 130,
  abilityIds: EL_MAGNIFICO_ABILITIES.map((a) => a.id),
  artSpecId: "el-magnifico",
});

const built = buildArt({
  bible: {
    characterId: "el-magnifico",
    species: "a masked wrestling showman of arena tall tales",
    ageRange: "a man in his thirties",
    face: "a full-face silver-and-emerald mask with gold trim, two dark eye-holes and a fierce mouth-slit",
    bodyType: "broad-shouldered and barrel-chested",
    clothingArmor: "a sequinned emerald cape, a gold championship belt, silver trunks and laced wrestling boots",
    weaponsProps: "a heavy gold belt and a rolled-up cape",
    markings: "gold thread outlines round the eye-holes of the mask",
    silhouette: "a broad masked figure on a ring corner post with a cape streaming behind",
    signatureProps: ["a silver-and-emerald mask", "a sequinned cape", "a gold belt"],
  },
  region: "Stadium and ring inspiration (floodlights, worn leather, chalk dust, hand-painted banners, no real teams, leagues or people)",
  visualTheme: "the show is the fight",
  environment: "a packed arena ring under spotlights",
  lighting: "hot white spotlights and a dark roaring crowd",
  paletteConcept: "mask emerald, silver, gold, spotlight white",
  avoid: ["any existing game's el magnífico design"],
  splashScene: "leaping from the top rope with the cape streaming and the spotlight blazing behind",
  portraitScene: "a silver-and-emerald mask with fierce dark eye-holes",
  avatarScene: "close crop on the mask",
  iconScenes: ["a body slammed into a mat, for Body Slam", "a figure diving from the top rope, for Flying Elbow", "a cape swept out towards a crowd, for Taunt the Crowd", "a hand held up to a roaring crowd, for Second Wind"],
});
export const EL_MAGNIFICO_VISUAL_BIBLE = built.bible;
export const EL_MAGNIFICO_ART = built.art;
