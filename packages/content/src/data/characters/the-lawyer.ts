import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ENEMY_ALL, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #116 THE LAWYER [SECRET] (Final Seven) — an absurd but ranked-viable Cheater. He objects, he sues, and when he loses he finds a technicality. docs/design/characters/the-lawyer.md

export const APPEALS_RESOURCE: Resource = {
  id: "resource.appeals",
  displayName: "Appeal",
  startingValue: 1,
  min: 0,
  max: 1,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const TECHNICALITY: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-lawyer.technicality",
  displayName: "Technicality",
  description: "Once per battle, when he would fall, he is restored to 20 health instead.",
  trigger: { event: "onWouldDie", relation: "self" },
  condition: { type: "resourceAtLeast", target: "self", resourceId: APPEALS_RESOURCE.id, amount: 1 },
  effects: [
    { kind: "modifyResource", resourceId: APPEALS_RESOURCE.id, amount: -1 },
    { kind: "heal", healingClass: "setHp", amount: 20 },
  ],
  knowledgeLevel: "DISCOVERABLE",
});

export const OBJECTION = ability({
  id: "ability.the-lawyer.objection",
  displayName: "Objection!",
  description: "Overruled: an enemy's chosen attack is sent to a different target, him.",
  cost: { focus: 1, chaos: 1 },
  resolutionTierId: "priority-abilities",
  cooldown: 5,
  target: ENEMY_SINGLE,
  effects: [{ kind: "retargetQueuedAction" }],
});
export const SUE = ability({
  id: "ability.the-lawyer.sue",
  displayName: "Sue",
  description: "Takes the enemy to court: 10 damage, and he takes 1 energy of theirs.",
  cost: { chaos: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "drainEnergy", family: "any", amount: 1, grantToSelf: true }],
});
export const CLASS_ACTION = ability({
  id: "ability.the-lawyer.class-action",
  displayName: "Class Action",
  description: "Every enemy is named in the suit: weakened and taking 10 more damage for 2 turns.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }, { kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 2 }],
});
export const CROSS_EXAMINE = ability({
  id: "ability.the-lawyer.cross-examine",
  displayName: "Cross-Examine",
  description: "Badgers the witness: 20 damage and it is silenced for a turn.",
  cost: { might: 1, focus: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});

export const THE_LAWYER_ABILITIES: Ability[] = [OBJECTION, SUE, CLASS_ACTION, CROSS_EXAMINE];

export const THE_LAWYER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-lawyer",
  version: 1,
  displayName: "The Lawyer",
  rarity: "SECRET",
  tags: ["FOLKLORE", "CONTROLLER", "CHEATER", "SECRET"],
  baseHp: 80,
  abilityIds: THE_LAWYER_ABILITIES.map((a) => a.id),
  passiveId: TECHNICALITY.id,
  resources: [APPEALS_RESOURCE],
  isCheater: true,
  cheaterRuleBreak: "Technicality: once per battle, when he would fall, a ruling goes his way and he is restored to 20 health instead.",
  counterplay: "It happens once, is logged when it fires, and does nothing against erasure or a second lethal hit in the same turn. It does not stop Resurrection Lock, and his 90 HP and small numbers give a team plenty of ways to burst him twice.",
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-lawyer",
});

const built = buildArt({
  bible: {
    characterId: "the-lawyer",
    species: "a slick, tireless trial lawyer of comic legend",
    ageRange: "a man in his forties",
    face: "a broad, confident grin, slicked-back hair and heavy-lidded eyes that have never lost an argument",
    bodyType: "tall, sharp-shouldered and theatrical",
    clothingArmor: "a razor-sharp charcoal three-piece suit with a gold tie-pin, a long black gown thrown over one shoulder and gleaming shoes",
    weaponsProps: "a bulging leather briefcase, a gavel-headed cane and a rolled scroll",
    markings: "a thin gold ring on every finger",
    silhouette: "a sharp-shouldered figure with a raised finger, a briefcase and a long gown",
    signatureProps: ["a bulging briefcase", "a gavel-headed cane", "a rolled scroll"],
  },
  region: "Mythic-finale inspiration (courtroom oak, brass ledgers, abyssal coral, sealed iron gates, original sigils only)",
  visualTheme: "the law is what he says it is",
  environment: "a grand wood-panelled courtroom with a raised bench",
  lighting: "warm lamplight on dark wood and bright white paper",
  paletteConcept: "suit charcoal, gold, wood brown, paper white",
  avoid: ["any existing game's the lawyer design"],
  splashScene: "pointing a finger across a courtroom with the gown swirling and papers flying through the air",
  portraitScene: "a confident grin over a gold tie-pin",
  avatarScene: "close crop on the grin and slicked-back hair",
  iconScenes: ["a raised finger and an exclamation mark, for Objection!", "a summons paper slapped on a table, for Sue", "a huge stack of names on a scroll, for Class Action", "a bright lamp on a witness stand, for Cross-Examine"],
  secretSilhouetteScene: "a sharp-shouldered figure with a raised finger and a briefcase in a courtroom, no other detail",
});
export const THE_LAWYER_VISUAL_BIBLE = built.bible;
export const THE_LAWYER_ART = built.art;
