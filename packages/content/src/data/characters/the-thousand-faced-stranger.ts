import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #75 THE THOUSAND-FACED STRANGER [SECRET] (World Folklore) — a wanderer who is never the same person twice. Each face he wears leads into the next: wrath, mercy, fear, and wrath again. docs/design/characters/the-thousand-faced-stranger.md

export const FACE_OF_WRATH = ability({
  id: "ability.the-thousand-faced-stranger.face-of-wrath",
  displayName: "Face of Wrath",
  description: "30 damage, or 50 right after the Face of Fear.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: "ability.the-thousand-faced-stranger.face-of-fear" },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const FACE_OF_MERCY = ability({
  id: "ability.the-thousand-faced-stranger.face-of-mercy",
  displayName: "Face of Mercy",
  description: "Heals an ally for 30 right after the Face of Wrath, otherwise for 10.",
  cost: { spirit: 1 },
  target: ALLY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: "ability.the-thousand-faced-stranger.face-of-wrath" },
      ifTrue: [{ kind: "heal", healingClass: "heal", amount: 30 }],
      ifFalse: [{ kind: "heal", healingClass: "heal", amount: 10 }],
    },
  ],
});
export const FACE_OF_FEAR = ability({
  id: "ability.the-thousand-faced-stranger.face-of-fear",
  displayName: "Face of Fear",
  description: "10 damage, or a stun for a turn right after the Face of Mercy.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: "ability.the-thousand-faced-stranger.face-of-mercy" },
      ifTrue: [{ kind: "damage", amount: 10 }, { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
export const BLANK_FACE = ability({
  id: "ability.the-thousand-faced-stranger.blank-face",
  displayName: "Blank Face",
  description: "Wears no face at all: untargetable for a turn.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});

export const THE_THOUSAND_FACED_STRANGER_ABILITIES: Ability[] = [FACE_OF_WRATH, FACE_OF_MERCY, FACE_OF_FEAR, BLANK_FACE];

export const THE_THOUSAND_FACED_STRANGER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-thousand-faced-stranger",
  version: 1,
  displayName: "The Thousand-Faced Stranger",
  rarity: "SECRET",
  tags: ["FOLKLORE", "CONTROLLER", "ATTACKER", "SECRET"],
  baseHp: 120,
  abilityIds: THE_THOUSAND_FACED_STRANGER_ABILITIES.map((a) => a.id),
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-thousand-faced-stranger",
});

const built = buildArt({
  bible: {
    characterId: "the-thousand-faced-stranger",
    species: "a shape-changing wanderer of many folk tales",
    ageRange: "of no fixed age",
    face: "a smooth, half-finished face like a carved mask with different features glimpsed at the edges",
    bodyType: "of medium height and no particular shape",
    clothingArmor: "a plain grey travelling cloak over a patchwork of faded coloured cloth",
    weaponsProps: "a string of small wooden masks hung at the belt",
    markings: "none, except a faint seam along the jaw",
    silhouette: "a hooded figure with a string of small masks at the belt",
    signatureProps: ["a string of wooden masks", "a grey cloak", "a faint jaw seam"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "every road, a different face",
  environment: "a crossroads at dusk with a signpost pointing every way",
  lighting: "dim blue dusk and one lantern",
  paletteConcept: "mask wood, dusk blue, cloth patchwork, grey",
  avoid: ["any existing game's the thousand-faced stranger design"],
  splashScene: "standing at a crossroads holding one mask at arm's length and wearing another",
  portraitScene: "a smooth half-finished face with a jaw seam",
  avatarScene: "close crop on the hood and mask",
  iconScenes: ["a red-lined mask with a snarl, for Face of Wrath", "a soft, smiling wooden mask, for Face of Mercy", "a wide-eyed white mask, for Face of Fear", "a blank white mask, for Blank Face"],
  secretSilhouetteScene: "a hooded figure at a crossroads with masks at the belt, no other detail",
});
export const THE_THOUSAND_FACED_STRANGER_VISUAL_BIBLE = built.bible;
export const THE_THOUSAND_FACED_STRANGER_ART = built.art;
