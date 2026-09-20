import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #32 DOMOVOI (Slavic / Russian Night) — the house spirit. Whoever
// shelters under his roof is a little safer, and anyone who threatens the house
// finds their things going missing. docs/design/characters/domovoi.md

export const HEARTH_KEEPER: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.domovoi.hearth-keeper",
  displayName: "Hearth Keeper",
  description: "Whenever an ally is damaged, they gain a small shield of 10 for a turn.",
  trigger: { event: "onDamaged", relation: "ally", effectTarget: "subject" },
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 10, durationTurns: 1 }],
});

export const WARM_HEARTH = ability({
  id: "ability.domovoi.warm-hearth",
  displayName: "Warm Hearth",
  description: "Heals an ally for 20.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});
export const SWEEP_THE_FLOOR = ability({
  id: "ability.domovoi.sweep-the-floor",
  displayName: "Sweep the Floor",
  description: "A broom-blow: 10 damage, and he pockets 1 energy from the enemy.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "drainEnergy", family: "any", amount: 1, grantToSelf: true },
  ],
});
export const HIDE_IN_THE_STOVE = ability({
  id: "ability.domovoi.hide-in-the-stove",
  displayName: "Hide in the Stove",
  description: "Slips out of sight for a turn.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const HOUSEHOLD_MISCHIEF = ability({
  id: "ability.domovoi.household-mischief",
  displayName: "Household Mischief",
  description: "Hides an enemy's things: its abilities cost 1 more for 2 turns.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.energy-cost-increase", magnitude: 1, durationTurns: 2 }],
});

export const DOMOVOI_ABILITIES: Ability[] = [WARM_HEARTH, SWEEP_THE_FLOOR, HIDE_IN_THE_STOVE, HOUSEHOLD_MISCHIEF];

export const DOMOVOI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "domovoi",
  version: 1,
  displayName: "Domovoi",
  rarity: "CORE",
  tags: ["FOLKLORE", "SUPPORT", "DEFENDER"],
  baseHp: 110,
  abilityIds: DOMOVOI_ABILITIES.map((a) => a.id),
  passiveId: HEARTH_KEEPER.id,
  artSpecId: "domovoi",
});

const built = buildArt({
  bible: {
    characterId: "domovoi",
    species: "a household spirit of Slavic folklore",
    ageRange: "an old man in appearance",
    face: "a small wrinkled face with a thick grey beard and bright watchful eyes",
    bodyType: "short, stout and shaggy",
    clothingArmor: "a patched wool coat and felt boots",
    weaponsProps: "a short-handled broom and a ring of house keys",
    markings: "soot smudges on his cheeks",
    silhouette: "a small bearded figure with a broom beside a warm glowing stove",
    signatureProps: ["a broom", "a ring of keys", "a warm stove glow"],
  },
  region: "Slavic folklore inspiration (deep forests, folk ornament geometry, wood carving)",
  visualTheme: "the quiet keeper of a home who is not to be crossed",
  environment: "a wooden cottage kitchen with a big clay stove",
  lighting: "warm firelight from the stove in a dark room",
  paletteConcept: "stove orange, wood brown, wool grey, soot black",
  avoid: ["any existing game's house-spirit design"],
  splashScene: "standing on a stool by the stove with the broom raised and firelight on his beard",
  portraitScene: "a bearded face lit orange by the stove, one eye narrowed",
  avatarScene: "close crop on the beard and eyes",
  iconScenes: [
    "a glowing stove door, for Warm Hearth",
    "a broom sweeping dust in a curve, for Sweep the Floor",
    "a small figure vanishing into a stove mouth, for Hide in the Stove",
    "a ring of keys sliding off a peg, for Household Mischief",
  ],
});
export const DOMOVOI_VISUAL_BIBLE = built.bible;
export const DOMOVOI_ART = built.art;
