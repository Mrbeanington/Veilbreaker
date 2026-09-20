import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { characterArtSpecSchema, characterVisualBibleSchema, composePrompt, type CharacterArtSpec, type CharacterVisualBible } from "../../schemas/art";
import { type Ability } from "../../schemas/ability";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { type Resource } from "../../schemas/common";
import { ability, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 "MASON 'MOONSHOT' MADDOX ... Base track: NO BASE → FIRST → SECOND →
// THIRD → HOME RUN AVAILABLE ... Opponents can inflict STRIKES or disrupt his
// advancement." See docs/design/characters/moonshot-maddox.md for why all of
// the base/strike bookkeeping lives in one passive (onAbilityUsed) rather
// than spread across abilities.

export const BASES_RESOURCE: Resource = {
  id: "resource.bases",
  displayName: "Bases",
  startingValue: 0,
  min: 0,
  max: 4,
  visibleToOpponent: true,
  displayHint: "bases",
  trackMode: true,
};

export const STRIKES_RESOURCE: Resource = {
  id: "resource.strikes",
  displayName: "Strikes",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const LEADOFF_SINGLE = ability({
  id: "ability.moonshot-maddox.leadoff-single",
  displayName: "Leadoff Single",
  description: "A clean base hit — advances one base.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});

export const DOUBLE_DOWN_THE_LINE = ability({
  id: "ability.moonshot-maddox.double-down-the-line",
  displayName: "Double Down the Line",
  description: "A hard-hit double — advances two bases.",
  cost: { focus: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});

export const HUSTLE = ability({
  id: "ability.moonshot-maddox.hustle",
  displayName: "Hustle",
  description: "Grinds out an extra base through sheer effort, shaking off a strike in the process.",
  cost: { focus: 1 },
  cooldown: 1,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 1 }],
});

// docs/design/characters/moonshot-maddox.md "Home Run payoff": the swing's
// own damage is conditional on bases being loaded — the actual base reset
// happens in the passive below, since this ability's TargetRule is the enemy
// and can't also touch his own Bases resource in the same cast (ADR-011).
export const HOME_RUN_SWING = ability({
  id: "ability.moonshot-maddox.home-run-swing",
  displayName: "Home Run Swing",
  description: "Swings for the fences. Only a real payoff if the bases are loaded.",
  cost: { focus: 2, might: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: BASES_RESOURCE.id, amount: 4 },
      ifTrue: [{ kind: "damage", amount: 60 }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});

// spec/03 "Opponents can inflict STRIKES or disrupt his advancement": a
// strikeout is checked first (and resets everything) before any per-ability
// base advance, so three strikes land the disruption on his very next action
// even if the strikes came from an opponent's ability on a turn he didn't
// act. `usedAbilityLastTurn` doubles here as "the ability just used" — by the
// time onAbilityUsed fires, abilityHistory already has it as its last entry.
export const AT_THE_PLATE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.moonshot-maddox.at-the-plate",
  displayName: "At the Plate",
  description: "Tracks every trip around the bases — and every strikeout.",
  trigger: { event: "onAbilityUsed", relation: "self", effectTarget: "self" },
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: STRIKES_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "modifyResource", resourceId: BASES_RESOURCE.id, amount: -4 },
        { kind: "modifyResource", resourceId: STRIKES_RESOURCE.id, amount: -3 },
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
      ],
      ifFalse: [
        {
          kind: "conditional",
          condition: { type: "usedAbilityLastTurn", target: "self", abilityId: LEADOFF_SINGLE.id },
          ifTrue: [{ kind: "modifyResource", resourceId: BASES_RESOURCE.id, amount: 1 }],
          ifFalse: [
            {
              kind: "conditional",
              condition: { type: "usedAbilityLastTurn", target: "self", abilityId: DOUBLE_DOWN_THE_LINE.id },
              ifTrue: [{ kind: "modifyResource", resourceId: BASES_RESOURCE.id, amount: 2 }],
              ifFalse: [
                {
                  kind: "conditional",
                  condition: { type: "usedAbilityLastTurn", target: "self", abilityId: HUSTLE.id },
                  ifTrue: [
                    { kind: "modifyResource", resourceId: BASES_RESOURCE.id, amount: 1 },
                    { kind: "modifyResource", resourceId: STRIKES_RESOURCE.id, amount: -1 },
                  ],
                  ifFalse: [
                    {
                      kind: "conditional",
                      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: HOME_RUN_SWING.id },
                      ifTrue: [
                        {
                          kind: "conditional",
                          condition: { type: "resourceAtLeast", target: "self", resourceId: BASES_RESOURCE.id, amount: 4 },
                          ifTrue: [{ kind: "modifyResource", resourceId: BASES_RESOURCE.id, amount: -4 }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

export const MOONSHOT_MADDOX_ABILITIES: Ability[] = [LEADOFF_SINGLE, DOUBLE_DOWN_THE_LINE, HUSTLE, HOME_RUN_SWING];

export const MOONSHOT_MADDOX: CharacterDefinition = characterDefinitionSchema.parse({
  id: "moonshot-maddox",
  version: 1,
  displayName: "Mason \"Moonshot\" Maddox",
  rarity: "CORE",
  tags: ["ATHLETE", "ATTACKER"],
  baseHp: 110,
  abilityIds: MOONSHOT_MADDOX_ABILITIES.map((a) => a.id),
  passiveId: AT_THE_PLATE.id,
  resources: [BASES_RESOURCE, STRIKES_RESOURCE],
  artSpecId: "moonshot-maddox",
});

export const MOONSHOT_MADDOX_INITIAL_RESOURCES = defaultResourcesFor(MOONSHOT_MADDOX);

export const MOONSHOT_MADDOX_VISUAL_BIBLE: CharacterVisualBible = characterVisualBibleSchema.parse({
  characterId: "moonshot-maddox",
  baseArtSpecId: "moonshot-maddox",
  species: "human",
  ageRange: "prime athletic adulthood",
  face: "a confident, competitive expression",
  bodyType: "powerful athletic build",
  clothingArmor: "a completely original cream and dark-red uniform with plain, unmarked panels and no real-world team or sponsor identity",
  weaponsProps: "a wooden bat, resting over one shoulder",
  markings: "dirt and chalk marks around his cleats",
  silhouette: "a classic power-hitter stance silhouette",
  signatureProps: ["the wooden bat", "cream and dark-red uniform"],
});

export const MOONSHOT_MADDOX_ART: CharacterArtSpec = characterArtSpecSchema.parse({
  characterId: "moonshot-maddox",
  region: "Original / no single-culture inspiration",
  visualTheme: "a fictional baseball superstar playing in an impossible supernatural stadium",
  environment: "an impossible supernatural stadium at home plate",
  lighting: "stadium lights cutting through supernatural fog",
  paletteConcept: "cream uniform, dark red trim, stadium-light gold, night-sky navy",
  colorPalette: ["cream", "dark red", "stadium gold", "navy"],
  avoid: ["any real MLB team branding, logo, or uniform", "any real athlete's likeness"],
  splashPrompt: composePrompt(
    MOONSHOT_MADDOX_VISUAL_BIBLE,
    "splash",
    "standing at home plate inside an impossible supernatural stadium, stadium lights cutting through supernatural fog, bases faintly glowing behind him",
  ),
  portraitPrompt: composePrompt(MOONSHOT_MADDOX_VISUAL_BIBLE, "portrait", "confident three-quarter turn, bat resting on one shoulder"),
  battleAvatarPrompt: composePrompt(MOONSHOT_MADDOX_VISUAL_BIBLE, "battleAvatar", "close crop, mid-swing follow-through"),
  abilityIconPrompts: [
    composePrompt(MOONSHOT_MADDOX_VISUAL_BIBLE, "abilityIcon", "a bat connecting cleanly with a glowing ball low and away, for the ability Leadoff Single"),
    composePrompt(MOONSHOT_MADDOX_VISUAL_BIBLE, "abilityIcon", "a ball rocketing down the foul line trailing motion lines, for the ability Double Down the Line"),
    composePrompt(MOONSHOT_MADDOX_VISUAL_BIBLE, "abilityIcon", "a cleat digging into dirt mid-sprint, for the ability Hustle"),
    composePrompt(MOONSHOT_MADDOX_VISUAL_BIBLE, "abilityIcon", "a ball arcing high out of a glowing stadium, for the ability Home Run Swing"),
  ],
});
