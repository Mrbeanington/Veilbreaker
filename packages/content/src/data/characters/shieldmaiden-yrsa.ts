import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #44 SHIELDMAIDEN YRSA (Northern / Celtic) — a line-holder. She stands
// in front, covers a friend, and a shield wall answered by a Shield Bash is
// her whole rhythm. docs/design/characters/shieldmaiden-yrsa.md

export const SPEAR_THRUST = ability({
  id: "ability.shieldmaiden-yrsa.spear-thrust",
  displayName: "Spear Thrust",
  description: "A steady thrust: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const SHIELD_WALL = ability({
  id: "ability.shieldmaiden-yrsa.shield-wall",
  displayName: "Shield Wall",
  description: "Draws single-target attacks for a turn and takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 },
  ],
});
export const COVER_AN_ALLY = ability({
  id: "ability.shieldmaiden-yrsa.cover-an-ally",
  displayName: "Cover an Ally",
  description: "Holds her shield over a friend: they are shielded for 30 for 3 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});
export const SHIELD_BASH = ability({
  id: "ability.shieldmaiden-yrsa.shield-bash",
  displayName: "Shield Bash",
  description: "20 damage. Right after Shield Wall it hits for 30 and stuns the enemy for a turn.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: SHIELD_WALL.id },
      ifTrue: [
        { kind: "damage", amount: 30 },
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});

export const SHIELDMAIDEN_YRSA_ABILITIES: Ability[] = [SPEAR_THRUST, SHIELD_WALL, COVER_AN_ALLY, SHIELD_BASH];

export const SHIELDMAIDEN_YRSA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "shieldmaiden-yrsa",
  version: 1,
  displayName: "Shieldmaiden Yrsa",
  rarity: "CORE",
  tags: ["MYTHOLOGY", "WARRIOR", "DEFENDER"],
  baseHp: 140,
  abilityIds: SHIELDMAIDEN_YRSA_ABILITIES.map((a) => a.id),
  artSpecId: "shieldmaiden-yrsa",
});

const built = buildArt({
  bible: {
    characterId: "shieldmaiden-yrsa",
    species: "a shield-bearing warrior woman of Norse saga",
    ageRange: "a woman in her prime",
    face: "a broad, freckled face with steady green eyes and a braided fringe",
    bodyType: "strong, square-shouldered and planted",
    clothingArmor: "a leather-and-mail shirt, a plain helm with a nose guard and a wool cloak",
    weaponsProps: "a long spear and a big round shield painted in an original knot design",
    markings: "a blue-painted line across her cheekbones",
    silhouette: "a helmed figure behind a big round shield with a spear over it",
    signatureProps: ["a round painted shield", "a long spear", "a wool cloak"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "the line that does not break",
  environment: "a shingle beach with a longship drawn up behind",
  lighting: "grey sea light with a low sun through cloud",
  paletteConcept: "shield red, wool blue, iron grey, driftwood tan",
  avoid: ["any existing game's shieldmaiden design"],
  splashScene: "kneeling behind the round shield with the spear angled over it and waves breaking behind",
  portraitScene: "a steady face over the rim of the shield",
  avatarScene: "close crop on the helm and shield rim",
  iconScenes: [
    "a spear head in a straight line, for Spear Thrust",
    "a round shield planted in sand, for Shield Wall",
    "a shield held over another figure, for Cover an Ally",
    "a shield rim striking forward, for Shield Bash",
  ],
});
export const SHIELDMAIDEN_YRSA_VISUAL_BIBLE = built.bible;
export const SHIELDMAIDEN_YRSA_ART = built.art;
