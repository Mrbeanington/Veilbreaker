import type { Ability } from "../../schemas/ability";
import type { CharacterDefinition } from "../../schemas/character";
import type { PassiveDefinition } from "../../schemas/passive";
import type { Transformation } from "../../schemas/transformation";
import type { Summon } from "../../schemas/summon";
import type { CharacterArtSpec, CharacterVisualBible } from "../../schemas/art";

export * from "./helpers";
export * from "./tortuga-rex";
export * from "./mister-whiskers";
export * from "./whiskers-devourer-of-worlds";
export * from "./patient-zero";
export * from "./moonshot-maddox";
export * from "./malachar";

import { TORTUGA_REX, TORTUGA_REX_ABILITIES, TORTUGA_REX_ART, TORTUGA_REX_VISUAL_BIBLE } from "./tortuga-rex";
import {
  MISTER_WHISKERS,
  MISTER_WHISKERS_ABILITIES,
  MISTER_WHISKERS_ART,
  MISTER_WHISKERS_VISUAL_BIBLE,
  NINE_LIVES,
} from "./mister-whiskers";
import {
  WHISKERS_DEVOURER_OF_WORLDS,
  WHISKERS_DEVOURER_OF_WORLDS_ABILITIES,
  WHISKERS_DEVOURER_OF_WORLDS_ART,
  WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE,
} from "./whiskers-devourer-of-worlds";
import {
  PATIENT_ZERO,
  PATIENT_ZERO_ABILITIES,
  PATIENT_ZERO_ART,
  PATIENT_ZERO_TRANSFORMATIONS,
  PATIENT_ZERO_VISUAL_BIBLE,
  THE_HUNGER_GROWS,
} from "./patient-zero";
import {
  AT_THE_PLATE,
  MOONSHOT_MADDOX,
  MOONSHOT_MADDOX_ABILITIES,
  MOONSHOT_MADDOX_ART,
  MOONSHOT_MADDOX_VISUAL_BIBLE,
} from "./moonshot-maddox";
import {
  BOUND_THRALL_SUMMON,
  MALACHAR,
  MALACHAR_ABILITIES,
  MALACHAR_ART,
  MALACHAR_VISUAL_BIBLE,
  THE_DEAD_REMEMBER,
  THRALL_SUMMON,
  TO_DEATH_KING,
} from "./malachar";

/** phase-04-first-five.md's five prototypes, plus the stubbed Devourer-of-Worlds hook. */
export const CHARACTER_LIBRARY: Record<string, CharacterDefinition> = Object.fromEntries(
  [TORTUGA_REX, MISTER_WHISKERS, WHISKERS_DEVOURER_OF_WORLDS, PATIENT_ZERO, MOONSHOT_MADDOX, MALACHAR].map((c) => [c.id, c]),
);

export const ABILITY_LIBRARY: Record<string, Ability> = Object.fromEntries(
  [
    ...TORTUGA_REX_ABILITIES,
    ...MISTER_WHISKERS_ABILITIES,
    ...WHISKERS_DEVOURER_OF_WORLDS_ABILITIES,
    ...PATIENT_ZERO_ABILITIES,
    ...MOONSHOT_MADDOX_ABILITIES,
    ...MALACHAR_ABILITIES,
  ].map((a) => [a.id, a]),
);

export const PASSIVE_LIBRARY: Record<string, PassiveDefinition> = Object.fromEntries(
  [NINE_LIVES, THE_HUNGER_GROWS, AT_THE_PLATE, THE_DEAD_REMEMBER].map((p) => [p.id, p]),
);

export const TRANSFORMATION_LIBRARY: Record<string, Transformation> = Object.fromEntries(
  [...PATIENT_ZERO_TRANSFORMATIONS, TO_DEATH_KING].map((t) => [t.id, t]),
);

export const SUMMON_LIBRARY: Record<string, Summon> = Object.fromEntries([THRALL_SUMMON, BOUND_THRALL_SUMMON].map((s) => [s.id, s]));

export const CHARACTER_ART_LIBRARY: Record<string, CharacterArtSpec> = Object.fromEntries(
  [TORTUGA_REX_ART, MISTER_WHISKERS_ART, WHISKERS_DEVOURER_OF_WORLDS_ART, PATIENT_ZERO_ART, MOONSHOT_MADDOX_ART, MALACHAR_ART].map((a) => [
    a.characterId,
    a,
  ]),
);

export const CHARACTER_VISUAL_BIBLE_LIBRARY: Record<string, CharacterVisualBible> = Object.fromEntries(
  [
    TORTUGA_REX_VISUAL_BIBLE,
    MISTER_WHISKERS_VISUAL_BIBLE,
    WHISKERS_DEVOURER_OF_WORLDS_VISUAL_BIBLE,
    PATIENT_ZERO_VISUAL_BIBLE,
    MOONSHOT_MADDOX_VISUAL_BIBLE,
    MALACHAR_VISUAL_BIBLE,
  ].map((b) => [b.characterId, b]),
);
