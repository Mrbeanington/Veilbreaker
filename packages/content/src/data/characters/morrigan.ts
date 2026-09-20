import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 #3 Legend MORRIGAN, MOTHER OF CROWS — a dark prophecy controller. She
// marks enemies with a Prophecy of Ruin that only comes true for the wounded,
// so correct counterplay (keeping healthy, healing, dispelling) escapes it.
// `status.crow-prophecy` lives in statuses.ts. docs/design/characters/morrigan.md

// Legend lever (spec/03): a special vulnerability. Below half health the crows
// leave the dying: every wound leaves her briefly more exposed.
export const CROWS_LEAVE_THE_DYING: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.morrigan.crows-leave-the-dying",
  displayName: "Crows Leave the Dying",
  description: "Below half health, every wound leaves her more exposed for a turn.",
  trigger: { event: "onDamaged", relation: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 50 },
  effects: [{ kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 1 }],
});

export const MARK_OF_THE_CROWS = ability({
  id: "ability.morrigan.mark-of-the-crows",
  displayName: "Mark of the Crows",
  description: "Lays a Prophecy of Ruin on an enemy for 3 turns: if it ends a turn below half health, the prophecy comes true for 60 damage. A healthy enemy escapes it.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.crow-prophecy", durationTurns: 3 }],
});
export const CARRION_CALL = ability({
  id: "ability.morrigan.carrion-call",
  displayName: "Carrion Call",
  description: "The crows descend: 40 damage, or 60 against an enemy carrying her prophecy.",
  cost: { might: 2, spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.crow-prophecy" },
      ifTrue: [{ kind: "damage", amount: 60 }],
      ifFalse: [{ kind: "damage", amount: 40 }],
    },
  ],
});
export const MOTHERS_WARD = ability({
  id: "ability.morrigan.mothers-ward",
  displayName: "Mother's Ward",
  description: "Crow-feathers gather round an ally: a shield of 40 for 3 turns.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 40, durationTurns: 3 }],
});
export const STORM_OF_CROWS = ability({
  id: "ability.morrigan.storm-of-crows",
  displayName: "Storm of Crows",
  description: "A black storm of wings: every enemy takes 40 damage and receives the Prophecy of Ruin. Extremely expensive.",
  cost: { might: 3, spirit: 2, chaos: 1 },
  cooldown: 5,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 40 },
    { kind: "applyStatus", statusId: "status.crow-prophecy", durationTurns: 3 },
  ],
});

export const MORRIGAN_ABILITIES: Ability[] = [MARK_OF_THE_CROWS, CARRION_CALL, MOTHERS_WARD, STORM_OF_CROWS];

export const MORRIGAN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "morrigan",
  version: 1,
  displayName: "Morrigan, Mother of Crows",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "MYTHOLOGY", "CURSE", "CONTROLLER"],
  baseHp: 130,
  abilityIds: MORRIGAN_ABILITIES.map((a) => a.id),
  passiveId: CROWS_LEAVE_THE_DYING.id,
  artSpecId: "morrigan",
});

const built = buildArt({
  bible: {
    characterId: "morrigan",
    species: "a dark sovereign of Celtic myth, mother of crows",
    ageRange: "ageless, apparently in her prime",
    face: "an imposing pale face with dark eyes and a faint cruel calm",
    bodyType: "tall and regal, wrapped in a cloak that seems to be made of feathers",
    clothingArmor: "a long black feathered cloak over dark leather and iron torcs",
    weaponsProps: "a slender spear and a great crow perched on her shoulder",
    markings: "blue knotwork war-paint running across the face and hands in an original pattern",
    silhouette: "a tall cloaked figure ringed by circling crows on a stormy moor",
    signatureProps: ["a black feathered cloak", "circling crows", "iron torcs"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "the queen who tells you how it ends",
  environment: "a stormy moor with a standing stone circle",
  lighting: "storm-dark sky with a cold pale glow around her",
  paletteConcept: "raven black, storm grey, bone white, old gold",
  avoid: ["any existing game's crow-goddess or Morrigan depiction"],
  splashScene: "standing in a stone circle with a swirl of crows rising around her and her spear pointed at the viewer",
  portraitScene: "a still, pale face with a crow's eye glinting over her shoulder",
  avatarScene: "close crop on the face and one crow",
  iconScenes: [
    "a single black feather marked with a glowing rune, for Mark of the Crows",
    "a crow diving with talons out, for Carrion Call",
    "black feathers gathering round a small figure, for Mother's Ward",
    "a vast swirl of crows across a moon, for Storm of Crows",
  ],
  legendRevealScene: "rising out of a whirl of crows over the moor with the standing stones lit white by lightning",
});
export const MORRIGAN_VISUAL_BIBLE = built.bible;
export const MORRIGAN_ART = built.art;
