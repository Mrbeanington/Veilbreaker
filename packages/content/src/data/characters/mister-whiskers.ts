import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { characterArtSpecSchema, characterVisualBibleSchema, composePrompt, type CharacterArtSpec, type CharacterVisualBible } from "../../schemas/art";
import { type Ability } from "../../schemas/ability";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { type Resource } from "../../schemas/common";
import { ability, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 "MISTER WHISKERS. Black cat Cheater who looks comically harmless.
// Manipulates targeting, energy, and randomness. Has Nine Lives mechanics."
// See docs/design/characters/mister-whiskers.md for the full breakdown of
// each ability against that one-line brief, and for why the Devourer-of-
// -Worlds relationship is a stub rather than a real Transformation.

export const NINE_LIVES_RESOURCE: Resource = {
  id: "resource.nine-lives",
  displayName: "Lives Remaining",
  startingValue: 9,
  min: 0,
  max: 9,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// spec/01 "manipulates ... randomness": a genuine gamble, not a manipulated
// one — NINE_LIVES_FAVOR (below) is the ability that tilts the odds.
export const COPYCATS_GAMBLE = ability({
  id: "ability.mister-whiskers.copycats-gamble",
  displayName: "Copycat's Gamble",
  description: "A swipe that's usually a scratch — but sometimes a lot more.",
  cost: { chaos: 2 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 3, effects: [{ kind: "damage", amount: 15 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 30 }] },
        ],
      },
    },
  ],
});

export const NINE_LIVES_FAVOR = ability({
  id: "ability.mister-whiskers.nine-lives-favor",
  displayName: "Nine Lives' Favor",
  description: "Tips his own luck in his favor for the next gamble.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "modifyRandomOutcome", mode: "weightBoost", weightMultiplier: 3 }],
});

// spec/01 Cheaters "change targets after actions are selected" (OQ-07): the
// character's one documented rule-break (see cheaterRuleBreak below). Both
// `queuedCharacterId`/`newTargetIds` are left to default (ADR-011): whichever
// enemy this ability targets gets their queued action redirected onto
// Whiskers himself. OQ-07's own proposed default names this a "Priority-tier
// effect" — resolutionTierId here makes it actually resolve before the
// standard-attacks tier a same-turn queued attack would otherwise be in.
export const PAW_SWAP = ability({
  id: "ability.mister-whiskers.paw-swap",
  displayName: "Paw Swap",
  description: "Tricks an enemy into attacking him instead of whoever they meant to.",
  cost: { chaos: 2, neutral: 1 },
  cooldown: 3,
  resolutionTierId: "priority-abilities",
  target: ENEMY_SINGLE,
  effects: [{ kind: "retargetQueuedAction" }],
});

export const BLACK_CATS_CROSSING = ability({
  id: "ability.mister-whiskers.black-cats-crossing",
  displayName: "Black Cat's Crossing",
  description: "Crosses an enemy's path, souring their luck and stealing their energy.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "drainEnergy", family: "any", amount: 2, grantToSelf: true }],
});

// docs/design/characters/mister-whiskers.md "Nine Lives": pre-charges Death
// Prevention (a real, existing Phase 03 hook — see docs/DECISIONS.md ADR-011)
// out of his Lives Remaining resource whenever he isn't already holding a
// charge, rather than reacting after the fact (which would already be too
// late — Death Prevention has to be active *before* the lethal hit).
export const NINE_LIVES: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.mister-whiskers.nine-lives",
  displayName: "Nine Lives",
  description: "At the start of his turn, spends a life to guarantee he survives the next lethal hit, if he isn't already protected.",
  trigger: { event: "onTurnStart", relation: "self" },
  condition: {
    type: "and",
    conditions: [
      { type: "resourceAtLeast", target: "self", resourceId: NINE_LIVES_RESOURCE.id, amount: 1 },
      { type: "not", condition: { type: "hasStatus", target: "self", statusId: "status.death-prevention" } },
    ],
  },
  effects: [
    { kind: "applyStatus", statusId: "status.death-prevention" },
    { kind: "modifyResource", resourceId: NINE_LIVES_RESOURCE.id, amount: -1 },
  ],
});

export const MISTER_WHISKERS_ABILITIES: Ability[] = [COPYCATS_GAMBLE, NINE_LIVES_FAVOR, PAW_SWAP, BLACK_CATS_CROSSING];

export const MISTER_WHISKERS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "mister-whiskers",
  version: 1,
  displayName: "Mister Whiskers",
  rarity: "CORE",
  tags: ["CHEATER", "BEAST", "ASSASSIN"],
  baseHp: 90,
  abilityIds: MISTER_WHISKERS_ABILITIES.map((a) => a.id),
  passiveId: NINE_LIVES.id,
  resources: [NINE_LIVES_RESOURCE],
  isCheater: true,
  cheaterRuleBreak: "Paw Swap may redirect an enemy's already-selected action onto a new target after it was chosen.",
  counterplay: "The redirect is logged the instant it happens, and Paw Swap has its own 3-turn cooldown, so it can't be used every turn.",
  artSpecId: "mister-whiskers",
});

export const MISTER_WHISKERS_INITIAL_RESOURCES = defaultResourcesFor(MISTER_WHISKERS);

export const MISTER_WHISKERS_VISUAL_BIBLE: CharacterVisualBible = characterVisualBibleSchema.parse({
  characterId: "mister-whiskers",
  baseArtSpecId: "mister-whiskers",
  species: "a small black cat",
  ageRange: "ageless, though he looks like an ordinary young cat",
  face: "bright intelligent eyes and slightly crooked whiskers",
  bodyType: "small and sleek",
  clothingArmor: "a tiny damaged collar carrying an unidentified original charm",
  weaponsProps: "none visible — his claws and the collar charm are the only props",
  markings: "solid black fur with no distinguishing patches",
  silhouette: "an ordinary small housecat silhouette, deceptively unthreatening",
  signatureProps: ["the damaged collar charm", "subtle impossible shadows extending behind him"],
});

export const MISTER_WHISKERS_ART: CharacterArtSpec = characterArtSpecSchema.parse({
  characterId: "mister-whiskers",
  region: "Original / no single-culture inspiration",
  visualTheme: "harmless house pet who is secretly extraordinarily dangerous",
  environment: "the center of an enormous supernatural arena",
  lighting: "dramatic competitive-game lighting with a subtle uncanny undertone",
  paletteConcept: "matte black fur, a single warm highlight on the collar charm, cool arena shadow",
  colorPalette: ["matte black", "warm brass charm", "cool shadow blue"],
  poseNotes: "Sitting innocently, playful but suspicious expression — the surroundings should imply danger the cat itself doesn't visually announce.",
  avoid: ["any existing cartoon or mascot cat character", "clothing resembling an existing mascot costume", "a cute/harmless-only expression with no suspicious edge"],
  splashPrompt: composePrompt(
    MISTER_WHISKERS_VISUAL_BIBLE,
    "splash",
    "sitting innocently at the center of an enormous supernatural arena, subtle impossible shadows extending behind him, surroundings implying the harmless animal may secretly be extraordinarily dangerous",
  ),
  portraitPrompt: composePrompt(MISTER_WHISKERS_VISUAL_BIBLE, "portrait", "head tilted, one eye slightly narrowed in mischief"),
  battleAvatarPrompt: composePrompt(MISTER_WHISKERS_VISUAL_BIBLE, "battleAvatar", "close crop on the face and collar charm"),
  abilityIconPrompts: [
    composePrompt(MISTER_WHISKERS_VISUAL_BIBLE, "abilityIcon", "two playing-card-like paw prints crossing over dice, for the ability Copycat's Gamble"),
    composePrompt(MISTER_WHISKERS_VISUAL_BIBLE, "abilityIcon", "the collar charm glowing as probability symbols bend around it, for the ability Nine Lives' Favor"),
    composePrompt(MISTER_WHISKERS_VISUAL_BIBLE, "abilityIcon", "a single paw print splitting into two ghostly copies, for the ability Paw Swap"),
    composePrompt(MISTER_WHISKERS_VISUAL_BIBLE, "abilityIcon", "a black cat silhouette crossing a faint dotted path, draining a spark of light, for the ability Black Cat's Crossing"),
  ],
});
