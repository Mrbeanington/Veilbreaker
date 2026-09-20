import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #10 Legend CALYPSA, QUEEN BENEATH THE SEA — the Tide rises. She builds Tide turn by turn, and spends it on a catastrophic wave. docs/design/characters/calypsa.md

export const TIDE_RESOURCE: Resource = {
  id: "resource.tide",
  displayName: "Tide",
  startingValue: 0,
  min: 0,
  max: 6,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// The Tide builds slowly and visibly (a setup requirement, spec/03): one
// per turn, so the catastrophic Maelstrom is six turns of preparation.
export const RISING_TIDE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.calypsa.rising-tide",
  displayName: "Rising Tide",
  description: "At the end of each of her turns she gains a Tide (max 6).",
  trigger: { event: "onTurnEnd", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: TIDE_RESOURCE.id, amount: 1 }],
});

export const CALYPSA_UNDERTOW = ability({
  id: "ability.calypsa.undertow",
  displayName: "Undertow",
  description: "Dragged down: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const CALL_THE_TIDE = ability({
  id: "ability.calypsa.call-the-tide",
  displayName: "Call the Tide",
  description: "The sea answers: she gains 2 Tide.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "modifyResource", resourceId: TIDE_RESOURCE.id, amount: 2, target: SELF_ONLY }],
});
export const TIDAL_WAVE = ability({
  id: "ability.calypsa.tidal-wave",
  displayName: "Tidal Wave",
  description: "20 damage to every enemy, or 50 with 3 Tide, which it spends.",
  cost: { might: 2, spirit: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: TIDE_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "damage", amount: 50 }, { kind: "modifyResource", resourceId: TIDE_RESOURCE.id, amount: -3, target: SELF_ONLY }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const MAELSTROM = ability({
  id: "ability.calypsa.maelstrom",
  displayName: "Maelstrom",
  description: "The sea closes over everything: 90 damage to every enemy and a stun, but only with 6 Tide, which it spends. Otherwise only 10. Extremely expensive.",
  cost: { might: 3, spirit: 3 },
  cooldown: 5,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: TIDE_RESOURCE.id, amount: 6 },
      ifTrue: [{ kind: "damage", amount: 90 }, { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }, { kind: "modifyResource", resourceId: TIDE_RESOURCE.id, amount: -6, target: SELF_ONLY }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});

export const CALYPSA_ABILITIES: Ability[] = [CALYPSA_UNDERTOW, CALL_THE_TIDE, TIDAL_WAVE, MAELSTROM];

export const CALYPSA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "calypsa",
  version: 1,
  displayName: "Calypsa, Queen Beneath the Sea",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "FOLKLORE", "MYTHOLOGY", "MAGE", "CONTROLLER"],
  baseHp: 150,
  abilityIds: CALYPSA_ABILITIES.map((a) => a.id),
  passiveId: RISING_TIDE.id,
  resources: [TIDE_RESOURCE],
  artSpecId: "calypsa",
});

const built = buildArt({
  bible: {
    characterId: "calypsa",
    species: "a deep-sea queen of ocean legend",
    ageRange: "ageless",
    face: "a stern, pale-blue face with dark, wide-set eyes and faint gill-lines along the jaw",
    bodyType: "tall and poised, flowing at every edge as though underwater",
    clothingArmor: "layered abyssal-blue robes that drift like current, a collar of pearl-black scales and a crown of glowing bioluminescent coral",
    weaponsProps: "a long staff of pale coral and a globe of suspended water at her open hand",
    markings: "glowing teal spots along the collarbone and hands",
    silhouette: "a tall figure with a spiked glowing crown and robes that flow upward, with a floating globe of water at one hand",
    signatureProps: ["a glowing coral crown", "a globe of suspended water", "drifting abyssal robes"],
  },
  region: "Mythic-finale inspiration (courtroom oak, brass ledgers, abyssal coral, sealed iron gates, original sigils only)",
  visualTheme: "the sea has all the time in the world",
  environment: "a sunken cathedral of coral on the sea floor",
  lighting: "deep blue gloom with glowing teal bioluminescence",
  paletteConcept: "abyss blue, bioluminescent teal, pearl black, coral pale",
  avoid: ["any existing game's calypsa, queen beneath the sea design"],
  splashScene: "rising in a sunken cathedral with a huge wall of water suspended behind her and the crown blazing teal",
  portraitScene: "a stern pale-blue face under a glowing coral crown",
  avatarScene: "close crop on the crown and gill-lines",
  iconScenes: ["a dark hand of water pulling downward, for Undertow", "a slow swell rising under a moon, for Call the Tide", "a towering glowing wave about to break, for Tidal Wave", "a vast whirlpool closing over a small figure, for Maelstrom"],
  legendRevealScene: "rising out of a vast dark whirlpool with the crown blazing teal and the whole arena's floor turning to water round the viewer",
});
export const CALYPSA_VISUAL_BIBLE = built.bible;
export const CALYPSA_ART = built.art;
