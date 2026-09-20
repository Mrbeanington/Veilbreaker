import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #50 THE VALKYRIE (Northern / Celtic) — the chooser of the slain. Once
// a battle she refuses one ally's death (an ally who would fall is lifted back
// to 20 health). She is a spearwoman first: fast, hard to pin down.
// docs/design/characters/the-valkyrie.md

export const CHOSEN_RESOURCE: Resource = {
  id: "resource.chosen",
  displayName: "Chosen",
  startingValue: 1,
  min: 0,
  max: 1,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// A trigger on an *ally's* would-die (ADR-015): the effect lands on the ally who
// is about to fall, and the charge on the Valkyrie (a separate effect, `self` target).
export const CHOOSER_OF_THE_SLAIN: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-valkyrie.chooser-of-the-slain",
  displayName: "Chooser of the Slain",
  description: "Once per battle, when an ally would fall, she lifts them back to 20 health.",
  trigger: { event: "onWouldDie", relation: "ally", effectTarget: "subject" },
  condition: { type: "resourceAtLeast", target: "self", resourceId: CHOSEN_RESOURCE.id, amount: 1 },
  effects: [
    { kind: "heal", healingClass: "setHp", amount: 20 },
    { kind: "modifyResource", resourceId: CHOSEN_RESOURCE.id, amount: -1, target: SELF_ONLY },
  ],
});

export const SPEAR_CAST = ability({
  id: "ability.the-valkyrie.spear-cast",
  displayName: "Spear Cast",
  description: "A thrown spear: 30 damage.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const WINGED_DESCENT = ability({
  id: "ability.the-valkyrie.winged-descent",
  displayName: "Winged Descent",
  description: "Swoops from the sky: 20 damage, and she is out of reach for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1, target: SELF_ONLY },
  ],
});
export const BATTLE_CRY = ability({
  id: "ability.the-valkyrie.battle-cry",
  displayName: "Battle Cry",
  description: "Steadies an ally: heals 20.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});
export const SHIELD_OF_THE_SLAIN = ability({
  id: "ability.the-valkyrie.shield-of-the-slain",
  displayName: "Shield of the Slain",
  description: "An ally takes 20 less damage for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const THE_VALKYRIE_ABILITIES: Ability[] = [SPEAR_CAST, WINGED_DESCENT, BATTLE_CRY, SHIELD_OF_THE_SLAIN];

export const THE_VALKYRIE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-valkyrie",
  version: 1,
  displayName: "The Valkyrie",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "WARRIOR", "SUPPORT"],
  baseHp: 100,
  abilityIds: THE_VALKYRIE_ABILITIES.map((a) => a.id),
  passiveId: CHOOSER_OF_THE_SLAIN.id,
  resources: [CHOSEN_RESOURCE],
  artSpecId: "the-valkyrie",
});
export const THE_VALKYRIE_INITIAL_RESOURCES = defaultResourcesFor(THE_VALKYRIE);

const built = buildArt({
  bible: {
    characterId: "the-valkyrie",
    species: "a winged chooser of the slain from Norse myth",
    ageRange: "a woman in her prime",
    face: "a stern, beautiful face with pale eyes and a fine braid",
    bodyType: "tall and athletic with wide feathered wings",
    clothingArmor: "a winged helm, a burnished mail shirt and a white cloak",
    weaponsProps: "a long spear and a round shield",
    markings: "gold knotwork running along the wing feathers in an original design",
    silhouette: "a helmed winged figure with a raised spear against storm clouds",
    signatureProps: ["a winged helm", "a long spear", "feathered wings"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "the ones who decide who is worth saving",
  environment: "a battlefield under a rift of storm cloud",
  lighting: "cold gold light breaking through dark cloud",
  paletteConcept: "storm grey, wing white, gold, steel blue",
  avoid: ["any existing game's valkyrie design"],
  splashScene: "descending over a battlefield with wings wide and the spear pointed down",
  portraitScene: "a stern face under a winged helm with one feather drifting past",
  avatarScene: "close crop on the helm and eyes",
  iconScenes: [
    "a spear in flight, for Spear Cast",
    "wings folded in a steep dive, for Winged Descent",
    "an open hand lifting a fallen figure, for Battle Cry",
    "a round shield with wings, for Shield of the Slain",
  ],
});
export const THE_VALKYRIE_VISUAL_BIBLE = built.bible;
export const THE_VALKYRIE_ART = built.art;
