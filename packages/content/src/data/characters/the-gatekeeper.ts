import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #119 THE GATEKEEPER [SECRET] (Final Seven) — the keeper of the last gate. Nothing passes without paying: while the Gate is barred, every ability an enemy uses costs them blood. docs/design/characters/the-gatekeeper.md

export const TOLL_OF_THE_GATE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-gatekeeper.toll-of-the-gate",
  displayName: "Toll of the Gate",
  description: "While the Gate is barred, every ability an enemy uses costs that enemy 10 health.",
  trigger: { event: "onAbilityUsed", relation: "enemy", effectTarget: "subject" },
  condition: { type: "hasStatus", target: "self", statusId: "status.taunt" },
  effects: [{ kind: "damage", amount: 10, damageType: "affliction" }],
  knowledgeLevel: "DISCOVERABLE",
});

export const BAR_THE_GATE = ability({
  id: "ability.the-gatekeeper.bar-the-gate",
  displayName: "Bar the Gate",
  description: "Drops the great bar: single-target attacks are drawn to him for a turn, and he takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 }, { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const HALBERD_THRUST = ability({
  id: "ability.the-gatekeeper.halberd-thrust",
  displayName: "Halberd Thrust",
  description: "A thrust of the long halberd: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const TURN_AWAY = ability({
  id: "ability.the-gatekeeper.turn-away",
  displayName: "Turn Away",
  description: "\"You may not pass\": an enemy's abilities cost it more and it is weakened for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.energy-cost-increase", durationTurns: 2 }, { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const GATEKEEPER_OPEN_THE_GATE = ability({
  id: "ability.the-gatekeeper.open-the-gate",
  displayName: "Open the Gate",
  description: "Waves a friend through: an ally heals 20 and lifts every harmful effect.",
  cost: { spirit: 1 },
  cooldown: 4,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }, { kind: "removeStatus", dispelAll: true }],
});

export const THE_GATEKEEPER_ABILITIES: Ability[] = [BAR_THE_GATE, HALBERD_THRUST, TURN_AWAY, GATEKEEPER_OPEN_THE_GATE];

export const THE_GATEKEEPER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-gatekeeper",
  version: 1,
  displayName: "The Gatekeeper",
  rarity: "SECRET",
  tags: ["FOLKLORE", "DEFENDER", "CONTROLLER", "SECRET"],
  baseHp: 100,
  abilityIds: THE_GATEKEEPER_ABILITIES.map((a) => a.id),
  passiveId: TOLL_OF_THE_GATE.id,
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-gatekeeper",
});

const built = buildArt({
  bible: {
    characterId: "the-gatekeeper",
    species: "a tireless guardian of a final gate of tall tales",
    ageRange: "ageless",
    face: "a blank, plated helm with a single vertical slit and a faint white light behind it",
    bodyType: "huge, broad and utterly still",
    clothingArmor: "heavy dark-iron plate armour with a long grey tabard bearing a plain empty circle, and a single iron key on a chain",
    weaponsProps: "a long-hafted halberd taller than he is and a great iron key",
    markings: "a pale white light seeping through every seam of the armour",
    silhouette: "an enormous still armoured figure with a tall halberd beside a huge stone gate",
    signatureProps: ["a tall halberd", "a great iron key", "a plated slit helm"],
  },
  region: "Mythic-finale inspiration (courtroom oak, brass ledgers, abyssal coral, sealed iron gates, original sigils only)",
  visualTheme: "the one door that does not open for anyone",
  environment: "a vast stone archway at the end of a long empty hall",
  lighting: "cold grey light with a single white glow from the gate",
  paletteConcept: "dark iron, tabard grey, key gold, gate white",
  avoid: ["any existing game's the gatekeeper design"],
  splashScene: "standing motionless before an enormous closed gate with the halberd grounded and white light in every seam of the armour",
  portraitScene: "a blank plated helm with a vertical slit of white light",
  avatarScene: "close crop on the helm slit",
  iconScenes: ["a great iron bar dropping across a gate, for Bar the Gate", "a halberd blade in a shaft of light, for Halberd Thrust", "a raised gauntlet palm, for Turn Away", "a gate opening a crack with warm light, for Open the Gate"],
  secretSilhouetteScene: "an enormous still armoured figure with a halberd before a huge gate, no other detail",
});
export const THE_GATEKEEPER_VISUAL_BIBLE = built.bible;
export const THE_GATEKEEPER_ART = built.art;
