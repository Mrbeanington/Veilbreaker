import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { characterArtSpecSchema, characterVisualBibleSchema, composePrompt, type CharacterArtSpec, type CharacterVisualBible } from "../../schemas/art";
import { type Ability } from "../../schemas/ability";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { transformationSchema, type Transformation } from "../../schemas/transformation";
import { summonSchema, type Summon } from "../../schemas/summon";
import { type Resource } from "../../schemas/common";
import { ability, EFFECT_TARGETS_SELF, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 "MALACHAR, LORD OF THE LAST BREATH ... Souls, Thrall, Borrowed
// Life as lifeTransfer, Corpse Command, You Belong To Me, and the Death King
// transformation. Consecration must block souls, resurrection, thralls, and
// corpse use." See docs/design/characters/malachar.md for the full breakdown
// and for exactly how Consecration's four blocks are wired — three of the
// four (souls, thralls, corpse use) route through the SAME shared Souls
// economy, a deliberate simplification logged there and in
// docs/DECISIONS.md/OPEN-QUESTIONS.md, since the engine has no way to target
// or query one specific dead character's identity (see OQ-31, OQ-36).

export const SOULS_RESOURCE: Resource = {
  id: "resource.souls",
  displayName: "Souls",
  startingValue: 0,
  min: 0,
  max: 12,
  visibleToOpponent: true,
  displayHint: "tally",
  trackMode: true,
};

export const THRALL_SUMMON: Summon = summonSchema.parse({
  id: "summon.malachar.thrall",
  displayName: "Raised Thrall",
  occupiesSlot: false,
  hp: 20,
  duration: { turns: 4, permanent: false },
});

// spec/03 "temporary fourth fighters" (coverage list) — an inert,
// slot-occupying stand-in for "temporarily resurrect a defeated character
// under Malachar's control." The engine doesn't yet let a slot-occupying
// summon act or be independently targeted (docs/DECISIONS.md ADR-010 point
// 8, OQ-32), and TargetRule-based ability targeting can't select a dead
// character to actually resurrect them under new control (OQ-31/OQ-36), so
// this is the closest honest expression of "You Belong To Me" the current
// engine supports — logged, not silently pretended away.
export const BOUND_THRALL_SUMMON: Summon = summonSchema.parse({
  id: "summon.malachar.bound-thrall",
  displayName: "Bound Thrall",
  occupiesSlot: true,
  hp: 60,
  duration: { turns: 3, permanent: false },
});

export const RAISE_THE_FORGOTTEN = ability({
  id: "ability.malachar.raise-the-forgotten",
  displayName: "Raise the Forgotten",
  description: "Spends Souls to raise a Thrall that absorbs damage meant for him.",
  cost: { spirit: 2, chaos: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: SOULS_RESOURCE.id, amount: 2 },
      ifTrue: [{ kind: "summon", summonId: THRALL_SUMMON.id }, { kind: "modifyResource", resourceId: SOULS_RESOURCE.id, amount: -2 }],
    },
  ],
});

// OQ-04 "life transfer": deals damage to an enemy and restores that HP to
// Malachar himself, not the enemy — the heal effect's own `target` override
// (ADR-011) is what makes a cross-target ability like this possible at all.
export const BORROWED_LIFE = ability({
  id: "ability.malachar.borrowed-life",
  displayName: "Borrowed Life",
  description: "Tears life from an enemy and claims it as his own.",
  cost: { might: 2, spirit: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "heal", healingClass: "lifeTransfer", amount: 20, target: EFFECT_TARGETS_SELF },
  ],
});

export const CORPSE_COMMAND = ability({
  id: "ability.malachar.corpse-command",
  displayName: "Corpse Command",
  description: "Commands a fallen enemy's power. Simplified — see docs/design/characters/malachar.md — into a Soul-fueled bonus strike.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: SOULS_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "damage", amount: 30 }, { kind: "modifyResource", resourceId: SOULS_RESOURCE.id, amount: -3, target: EFFECT_TARGETS_SELF }],
      ifFalse: [{ kind: "damage", amount: 15 }],
    },
  ],
});

export const YOU_BELONG_TO_ME = ability({
  id: "ability.malachar.you-belong-to-me",
  displayName: "You Belong to Me",
  description: "Extremely expensive. Binds a fallen combatant to fight at his side for a few turns.",
  cost: { might: 2, focus: 2, spirit: 2, chaos: 2, neutral: 2 },
  cooldown: 5,
  target: SELF_ONLY,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: SOULS_RESOURCE.id, amount: 6 },
      ifTrue: [{ kind: "summon", summonId: BOUND_THRALL_SUMMON.id }, { kind: "modifyResource", resourceId: SOULS_RESOURCE.id, amount: -6 }],
    },
  ],
});

export const EMBRACE_THE_THRONE = ability({
  id: "ability.malachar.embrace-the-throne",
  displayName: "Embrace the Throne",
  description: "At a high enough Soul threshold, ascends into the Death King.",
  cost: { spirit: 3, chaos: 3, neutral: 2 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: SOULS_RESOURCE.id, amount: 8 },
      ifTrue: [{ kind: "transformInto", transformationId: "transformation.malachar.to-death-king" }],
    },
  ],
});

// spec/03 passive "THE DEAD REMEMBER: whenever a valid character dies, he
// collects a Soul" — "any" relation (any death, ally or enemy), and
// `effectTarget: "self"` (ADR-011) so the Soul lands on Malachar, not on
// whoever just died. Consecration blocks it via a plain `hasStatus` check on
// the corpse — the event's subject is looked up directly by id, which works
// even though they're already dead (see docs/DECISIONS.md ADR-011).
export const THE_DEAD_REMEMBER: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.malachar.the-dead-remember",
  displayName: "The Dead Remember",
  description: "Collects a Soul whenever a valid, unconsecrated character dies.",
  trigger: { event: "onDeath", relation: "any", effectTarget: "self" },
  condition: { type: "not", condition: { type: "hasStatus", target: "target", statusId: "status.soul-consecration" } },
  effects: [{ kind: "modifyResource", resourceId: SOULS_RESOURCE.id, amount: 1 }],
});

export const MALACHAR_ABILITIES: Ability[] = [RAISE_THE_FORGOTTEN, BORROWED_LIFE, CORPSE_COMMAND, YOU_BELONG_TO_ME, EMBRACE_THE_THRONE];

export const TO_DEATH_KING: Transformation = transformationSchema.parse({
  id: "transformation.malachar.to-death-king",
  characterId: "malachar",
  fromStageId: null,
  toStageId: "death-king",
  trigger: { type: "resourceAtLeast", target: "self", resourceId: SOULS_RESOURCE.id, amount: 8 },
  changes: { displayName: "Malachar, the Death King", maxHp: 150 },
});

export const MALACHAR: CharacterDefinition = characterDefinitionSchema.parse({
  id: "malachar",
  version: 1,
  displayName: "Malachar, Lord of the Last Breath",
  rarity: "SECRET",
  tags: ["NECROMANCER", "SUMMONER", "UNDEAD", "CONTROLLER"],
  baseHp: 115,
  abilityIds: MALACHAR_ABILITIES.map((a) => a.id),
  passiveId: THE_DEAD_REMEMBER.id,
  resources: [SOULS_RESOURCE],
  transformationIds: [TO_DEATH_KING.id],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "malachar",
});

export const MALACHAR_INITIAL_RESOURCES = defaultResourcesFor(MALACHAR);

export const MALACHAR_VISUAL_BIBLE: CharacterVisualBible = characterVisualBibleSchema.parse({
  characterId: "malachar",
  baseArtSpecId: "malachar",
  species: "an original necromancer sovereign, more spirit than flesh",
  ageRange: "ageless, unnervingly calm",
  face: "a gaunt, partially visible face, unnervingly calm",
  bodyType: "a towering, long, gaunt silhouette",
  clothingArmor: "layered blackened ceremonial armor over ancient funeral robes",
  weaponsProps: "a crown formed from uneven fragments of ancient metal, floating fragments of broken gravestones",
  markings: "skeletal motifs original to this design, not copied from any existing fantasy property",
  silhouette: "a tall gaunt silhouette trailing pale soul-fire",
  signatureProps: ["the fragment crown", "floating gravestone shards", "pale soul-fire"],
});

export const MALACHAR_ART: CharacterArtSpec = characterArtSpecSchema.parse({
  characterId: "malachar",
  region: "Original / no single-culture inspiration",
  visualTheme: "a genuinely frightening necromancer sovereign commanding the dead",
  environment: "a ruined subterranean throne chamber",
  lighting: "dramatic rim lighting against near-total darkness",
  specialEffects: "several translucent spirits reaching toward him, without gore",
  paletteConcept: "blackened armor, pale soul-fire, bone-white crown fragments",
  colorPalette: ["blackened armor", "pale soul-fire", "bone white"],
  avoid: ["any existing fantasy-franchise necromancer/lich design", "graphic gore", "real skeletal iconography lifted from an existing property"],
  splashPrompt: composePrompt(
    MALACHAR_VISUAL_BIBLE,
    "splash",
    "standing inside a ruined subterranean throne chamber, one hand gathering spectral souls while the other points toward an opening grave",
  ),
  portraitPrompt: composePrompt(MALACHAR_VISUAL_BIBLE, "portrait", "an unnervingly calm three-quarter gaze, soul-fire drifting past"),
  battleAvatarPrompt: composePrompt(MALACHAR_VISUAL_BIBLE, "battleAvatar", "close crop on the fragment crown and calm face"),
  abilityIconPrompts: [
    composePrompt(MALACHAR_VISUAL_BIBLE, "abilityIcon", "a skeletal hand rising from broken earth, for the ability Raise the Forgotten"),
    composePrompt(MALACHAR_VISUAL_BIBLE, "abilityIcon", "a thread of pale soul-fire pulled from one figure into another, for the ability Borrowed Life"),
    composePrompt(MALACHAR_VISUAL_BIBLE, "abilityIcon", "a gravestone shard glowing with a puppeted afterimage, for the ability Corpse Command"),
    composePrompt(MALACHAR_VISUAL_BIBLE, "abilityIcon", "chains of soul-fire binding a spectral figure to his side, for the ability You Belong to Me"),
    composePrompt(MALACHAR_VISUAL_BIBLE, "abilityIcon", "the fragment crown erupting into a full soul-fire corona, for the ability Embrace the Throne"),
  ],
  transformationPrompts: [
    composePrompt(
      MALACHAR_VISUAL_BIBLE,
      "transformation",
      "ascending into the Death King — the fragment crown now a full soul-fire corona, robes turning to living shadow, gravestone shards orbiting him in a slow ring",
    ),
  ],
});
