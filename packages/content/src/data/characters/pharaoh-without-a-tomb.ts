import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { summonSchema, type Summon } from "../../schemas/summon";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #61 THE PHARAOH WITHOUT A TOMB (Egypt / Desert) — a king with no resting place and no one to rule. He raises a guard from the sand and taxes his enemies' power. docs/design/characters/pharaoh-without-a-tomb.md

export const ROYAL_GUARD_SUMMON: Summon = summonSchema.parse({
  id: "summon.pharaoh-without-a-tomb.royal-guard",
  displayName: "Royal Guard",
  occupiesSlot: false,
  hp: 40,
  duration: { turns: 3, permanent: false },
});

export const PHARAOH_SCEPTER_STRIKE = ability({
  id: "ability.pharaoh-without-a-tomb.scepter-strike",
  displayName: "Scepter Strike",
  description: "A royal blow: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const RAISE_THE_GUARD = ability({
  id: "ability.pharaoh-without-a-tomb.raise-the-guard",
  displayName: "Raise the Guard",
  description: "Raises a royal guard from the sand with 40 health that stays 3 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "summon", summonId: ROYAL_GUARD_SUMMON.id }],
});
export const ROYAL_DECREE = ability({
  id: "ability.pharaoh-without-a-tomb.royal-decree",
  displayName: "Royal Decree",
  description: "By his word every ally is shielded for 20 for 2 turns.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: { side: "ally", scope: "all", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 20, durationTurns: 2 }],
});
export const ROYAL_TRIBUTE = ability({
  id: "ability.pharaoh-without-a-tomb.royal-tribute",
  displayName: "Royal Tribute",
  description: "Demands tribute: takes 1 energy from the enemy team and keeps it.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "drainEnergy", family: "any", amount: 1, grantToSelf: true }],
});

export const PHARAOH_WITHOUT_A_TOMB_ABILITIES: Ability[] = [PHARAOH_SCEPTER_STRIKE, RAISE_THE_GUARD, ROYAL_DECREE, ROYAL_TRIBUTE];

export const PHARAOH_WITHOUT_A_TOMB: CharacterDefinition = characterDefinitionSchema.parse({
  id: "pharaoh-without-a-tomb",
  version: 1,
  displayName: "The Pharaoh Without a Tomb",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "SUPPORT", "SUMMONER"],
  baseHp: 140,
  abilityIds: PHARAOH_WITHOUT_A_TOMB_ABILITIES.map((a) => a.id),
  artSpecId: "pharaoh-without-a-tomb",
});

const built = buildArt({
  bible: {
    characterId: "pharaoh-without-a-tomb",
    species: "a restless pharaoh of a forgotten dynasty",
    ageRange: "a man of middle years, long dead",
    face: "a stern, gaunt, proud face with hollow eyes and a thin gold beard",
    bodyType: "tall, regal and faintly translucent at the edges",
    clothingArmor: "a tall double crown, a gold-and-lapis collar and a tattered royal kilt",
    weaponsProps: "a crook and flail and a rolled, unfinished tomb plan",
    markings: "cracks of pale light along the hands and neck",
    silhouette: "a tall crowned figure holding a crook and flail on bare sand",
    signatureProps: ["a double crown", "a crook and flail", "an unfinished tomb plan"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "a king with a throne of sand",
  environment: "an empty desert with half-buried stone blocks",
  lighting: "grey dawn light with drifting sand",
  paletteConcept: "lapis blue, pale gold, sand, bone",
  avoid: ["any existing game's the pharaoh without a tomb design"],
  splashScene: "standing on bare sand with the crook raised over a half-built tomb wall",
  portraitScene: "a proud hollow-eyed face under a tall crown",
  avatarScene: "close crop on the crown and beard",
  iconScenes: ["a crook and flail crossed on sand, for Scepter Strike", "a rank of pale spearmen rising from the dunes, for Raise the Guard", "a golden light falling on sand, for Royal Decree", "an open hand and a falling gold coin, for Royal Tribute"],
});
export const PHARAOH_WITHOUT_A_TOMB_VISUAL_BIBLE = built.bible;
export const PHARAOH_WITHOUT_A_TOMB_ART = built.art;
