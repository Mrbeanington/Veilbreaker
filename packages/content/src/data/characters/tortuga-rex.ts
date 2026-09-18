import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { characterArtSpecSchema, characterVisualBibleSchema, composePrompt, type CharacterArtSpec, type CharacterVisualBible } from "../../schemas/art";
import { type Ability } from "../../schemas/ability";
import { ability, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 "TORTUGA REX. Ancient supernatural turtle tank. Extremely hard to
// kill, slow offensively." — the whole kit is four flat, five-second-readable
// abilities; the only real design decision is Shellquake's conditional
// (docs/design/characters/tortuga-rex.md).

export const SHELL_BASH = ability({
  id: "ability.tortuga-rex.shell-bash",
  displayName: "Shell Bash",
  description: "Slam an enemy with the edge of an ancient shell.",
  cost: { focus: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});

export const FORTRESS_SHELL = ability({
  id: "ability.tortuga-rex.fortress-shell",
  displayName: "Fortress Shell",
  description: "Withdraw into an unbreakable shell, reducing incoming damage.",
  cost: { might: 1, focus: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 30, durationTurns: 2 }],
});

export const ANCIENT_PATIENCE = ability({
  id: "ability.tortuga-rex.ancient-patience",
  displayName: "Ancient Patience",
  description: "Draw on centuries of endurance to mend wounds and brace for the next blow.",
  cost: { spirit: 2 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    { kind: "heal", healingClass: "heal", amount: 20 },
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 2 },
  ],
});

// docs/design/characters/tortuga-rex.md: "Shellquake conditional on prior
// defensive setup" (phase-04-first-five.md's required mechanic) — checked via
// the existing `conditional` effect + `hasStatus` condition against Damage
// Reduction, which only Fortress Shell or Ancient Patience puts on him. No
// new engine primitive needed.
export const SHELLQUAKE = ability({
  id: "ability.tortuga-rex.shellquake",
  displayName: "Shellquake",
  description: "A devastating ground slam — far stronger if he braced for it first.",
  cost: { might: 3, focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "self", statusId: "status.damage-reduction" },
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});

export const TORTUGA_REX_ABILITIES: Ability[] = [SHELL_BASH, FORTRESS_SHELL, ANCIENT_PATIENCE, SHELLQUAKE];

export const TORTUGA_REX: CharacterDefinition = characterDefinitionSchema.parse({
  id: "tortuga-rex",
  version: 1,
  displayName: "Tortuga Rex",
  rarity: "CORE",
  tags: ["TANK", "DEFENDER", "BEAST"],
  baseHp: 140,
  abilityIds: TORTUGA_REX_ABILITIES.map((a) => a.id),
  artSpecId: "tortuga-rex",
});

export const TORTUGA_REX_VISUAL_BIBLE: CharacterVisualBible = characterVisualBibleSchema.parse({
  characterId: "tortuga-rex",
  baseArtSpecId: "tortuga-rex",
  species: "ancient anthropomorphic turtle",
  ageRange: "impossibly old, timeless",
  face: "weathered reptilian face with a calm, intimidating expression, never a cartoon smile",
  bodyType: "low, broad, powerfully built with thick forearms",
  clothingArmor: "fragments of ancient bronze armor attached around the shoulders and wrists",
  weaponsProps: "none — fights bare-handed and shell-first",
  markings: "old battle scars across weathered reptilian skin",
  silhouette: "a massive, cracked, fortress-like shell carved with original geometric markings",
  signatureProps: ["carved geometric shell markings", "bronze armor fragments"],
});

export const TORTUGA_REX_ART: CharacterArtSpec = characterArtSpecSchema.parse({
  characterId: "tortuga-rex",
  region: "Original / no single-culture inspiration",
  visualTheme: "an immovable, ancient fortress given the shape of a warrior",
  environment: "a ruined stone arena",
  lighting: "dramatic low-angle lighting",
  paletteConcept: "weathered bronze, moss green, sun-bleached stone, dull ochre",
  colorPalette: ["weathered bronze", "moss green", "sun-bleached stone", "dull ochre"],
  poseNotes: "Low, wide stance — reads as immovable even in a square portrait crop.",
  avoid: ["any existing fictional turtle mascot or hero", "cartoon proportions", "a visible smile"],
  splashPrompt: composePrompt(
    TORTUGA_REX_VISUAL_BIBLE,
    "splash",
    "standing low and broad in a ruined stone arena, dust lifting around his feet, dramatic low-angle composition",
  ),
  portraitPrompt: composePrompt(
    TORTUGA_REX_VISUAL_BIBLE,
    "portrait",
    "calm intimidating gaze toward the camera, ruined arena stonework softly blurred behind him",
  ),
  battleAvatarPrompt: composePrompt(TORTUGA_REX_VISUAL_BIBLE, "battleAvatar", "three-quarter view, the shell visible over one shoulder"),
  abilityIconPrompts: [
    composePrompt(TORTUGA_REX_VISUAL_BIBLE, "abilityIcon", "a cracked shell edge slamming forward with impact lines, for the ability Shell Bash"),
    composePrompt(TORTUGA_REX_VISUAL_BIBLE, "abilityIcon", "the shell closing protectively inward with a glowing bronze rim, for the ability Fortress Shell"),
    composePrompt(TORTUGA_REX_VISUAL_BIBLE, "abilityIcon", "a calm meditative pose haloed by faint restorative light, for the ability Ancient Patience"),
    composePrompt(TORTUGA_REX_VISUAL_BIBLE, "abilityIcon", "the ground cracking outward in a shockwave beneath him, for the ability Shellquake"),
  ],
});
