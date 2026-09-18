import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { characterArtSpecSchema, characterVisualBibleSchema, composePrompt, type CharacterArtSpec, type CharacterVisualBible } from "../../schemas/art";
import { type Ability } from "../../schemas/ability";
import { ability, ENEMY_ALL } from "./helpers";

// spec/03 "A hidden transformation/unlock relationship leads to WHISKERS,
// DEVOURER OF WORLDS ... Funny until he becomes frightening." Roster entry
// #97 [SECRET], a wholly separate CharacterDefinition from Mister Whiskers
// (id #90) rather than a Transformation of him — Transformation.characterId
// can only move ONE character between stages of itself (packages/content/
// src/schemas/transformation.ts), it can't turn one roster entry into a
// different one. phase-04-first-five.md explicitly allows this: "the hidden
// hook toward Whiskers, Devourer of Worlds (definition may be stubbed)."
// docs/design/characters/mister-whiskers.md records the deferred unlock
// relationship (progression system, Phase 09) and OQ-34.
export const WORLD_ENDING_POUNCE = ability({
  id: "ability.whiskers-devourer-of-worlds.world-ending-pounce",
  displayName: "World-Ending Pounce",
  description: "A pounce that unmakes what it lands on. The rest of this kit is deliberately unbuilt until Whiskers, Devourer of Worlds is unlocked for real.",
  cost: { chaos: 3, neutral: 2 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }],
});

export const WHISKERS_DEVOURER_OF_WORLDS_ABILITIES: Ability[] = [WORLD_ENDING_POUNCE];

export const WHISKERS_DEVOURER_OF_WORLDS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "whiskers-devourer-of-worlds",
  version: 1,
  displayName: "???",
  rarity: "SECRET",
  tags: ["SECRET", "BEAST", "CHEATER"],
  baseHp: 220,
  abilityIds: WHISKERS_DEVOURER_OF_WORLDS_ABILITIES.map((a) => a.id),
  isCheater: true,
  cheaterRuleBreak: "Full kit deferred — stubbed this phase per phase-04-first-five.md.",
  counterplay: "Full kit deferred — stubbed this phase per phase-04-first-five.md.",
  knowledgeLevel: "TRUE_SECRET",
  artSpecId: "whiskers-devourer-of-worlds",
});

export const WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE: CharacterVisualBible = characterVisualBibleSchema.parse({
  characterId: "whiskers-devourer-of-worlds",
  baseArtSpecId: "whiskers-devourer-of-worlds",
  species: "the same small black cat, grown cosmically vast and wrong",
  ageRange: "ageless, now visibly ancient beneath the surface",
  face: "the same bright eyes, now with something moving behind them that shouldn't be there",
  bodyType: "the same small sleek cat shape, silhouette fraying into something far larger at the edges",
  clothingArmor: "the same damaged collar, now scorched black",
  weaponsProps: "the collar charm, now cracked open and leaking cosmic light",
  markings: "the same solid black fur, now dusted with impossible starlight",
  silhouette: "an ordinary housecat outline that the eye cannot quite keep at a normal scale",
  signatureProps: ["the cracked, light-leaking collar charm", "starlight dust in the fur"],
});

export const WHISKERS_DEVOURER_OF_WORLDS_ART: CharacterArtSpec = characterArtSpecSchema.parse({
  characterId: "whiskers-devourer-of-worlds",
  region: "Original / no single-culture inspiration",
  visualTheme: "the same comically harmless cat, revealed as unsettling cosmic horror",
  environment: "a void where the arena should be",
  lighting: "cold starlight bleeding from cracks in an otherwise dark scene",
  paletteConcept: "matte black fur against void-black, a single cracked point of cosmic light",
  colorPalette: ["void black", "cosmic white-gold", "scorched brass"],
  avoid: ["any existing cosmic-horror franchise creature", "losing the readable housecat silhouette entirely"],
  splashPrompt: composePrompt(
    WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE,
    "splash",
    "sitting at the center of a starlit void where the arena should be, still unmistakably a small housecat, the surrounding darkness folding wrongly around him",
  ),
  portraitPrompt: composePrompt(WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE, "portrait", "the same head tilt as before, now lit by cracked cosmic light"),
  battleAvatarPrompt: composePrompt(WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE, "battleAvatar", "close crop on the cracked, light-leaking collar charm"),
  abilityIconPrompts: [
    composePrompt(WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE, "abilityIcon", "a paw print swallowing a field of stars, for the ability World-Ending Pounce"),
  ],
  secretSilhouettePrompt: composePrompt(
    WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE,
    "secretSilhouette",
    "an ordinary small cat silhouette with one impossible crack of starlight down its side",
  ),
});
