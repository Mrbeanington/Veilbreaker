import type { Ability } from "../../schemas/ability";
import type { CharacterDefinition } from "../../schemas/character";
import type { PassiveDefinition } from "../../schemas/passive";
import type { Transformation } from "../../schemas/transformation";
import type { Summon } from "../../schemas/summon";
import type { Resource } from "../../schemas/common";
import type { CharacterArtSpec, CharacterVisualBible } from "../../schemas/art";

export * from "./helpers";
export * from "./tortuga-rex";
export * from "./mister-whiskers";
export * from "./whiskers-devourer-of-worlds";
export * from "./patient-zero";
export * from "./moonshot-maddox";
export * from "./malachar";
export * from "./father-bell";
export * from "./plague-doctor";
export * from "./behemoth";
export * from "./shiro";
export * from "./hydra";

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

import { FATHER_BELL, FATHER_BELL_ABILITIES, FATHER_BELL_ART, FATHER_BELL_VISUAL_BIBLE, LET_THE_DEAD_REST } from "./father-bell";
import { PLAGUE_DOCTOR, PLAGUE_DOCTOR_ABILITIES, PLAGUE_DOCTOR_ART, PLAGUE_DOCTOR_VISUAL_BIBLE } from "./plague-doctor";
import { BEHEMOTH, BEHEMOTH_ABILITIES, BEHEMOTH_ART, BEHEMOTH_VISUAL_BIBLE, PRIMORDIAL_HIDE } from "./behemoth";
import { SHIRO, SHIRO_ABILITIES, SHIRO_ART, SHIRO_VISUAL_BIBLE } from "./shiro";
import { CUT_ONE_TWO_GROW, HYDRA, HYDRA_ABILITIES, HYDRA_ART, HYDRA_VISUAL_BIBLE } from "./hydra";

/** phase-04-first-five.md's five prototypes, plus the stubbed Devourer-of-Worlds hook. */
export const CHARACTER_LIBRARY: Record<string, CharacterDefinition> = Object.fromEntries(
  [TORTUGA_REX, MISTER_WHISKERS, WHISKERS_DEVOURER_OF_WORLDS, PATIENT_ZERO, MOONSHOT_MADDOX, MALACHAR, FATHER_BELL, PLAGUE_DOCTOR, BEHEMOTH, SHIRO, HYDRA].map((c) => [c.id, c]),
);

export const ABILITY_LIBRARY: Record<string, Ability> = Object.fromEntries(
  [
    ...TORTUGA_REX_ABILITIES,
    ...MISTER_WHISKERS_ABILITIES,
    ...WHISKERS_DEVOURER_OF_WORLDS_ABILITIES,
    ...PATIENT_ZERO_ABILITIES,
    ...MOONSHOT_MADDOX_ABILITIES,
    ...MALACHAR_ABILITIES,
    ...FATHER_BELL_ABILITIES,
    ...PLAGUE_DOCTOR_ABILITIES,
    ...BEHEMOTH_ABILITIES,
    ...SHIRO_ABILITIES,
    ...HYDRA_ABILITIES,
  ].map((a) => [a.id, a]),
);

export const PASSIVE_LIBRARY: Record<string, PassiveDefinition> = Object.fromEntries(
  [NINE_LIVES, THE_HUNGER_GROWS, AT_THE_PLATE, THE_DEAD_REMEMBER, LET_THE_DEAD_REST, PRIMORDIAL_HIDE, CUT_ONE_TWO_GROW].map((p) => [p.id, p]),
);

export const TRANSFORMATION_LIBRARY: Record<string, Transformation> = Object.fromEntries(
  [...PATIENT_ZERO_TRANSFORMATIONS, TO_DEATH_KING].map((t) => [t.id, t]),
);

export const SUMMON_LIBRARY: Record<string, Summon> = Object.fromEntries([THRALL_SUMMON, BOUND_THRALL_SUMMON].map((s) => [s.id, s]));

/** Every custom Resource any implemented character uses — the `resourceLibrary` a real match's `ResolveTurnDeps` needs (clamping modifyResource to each resource's own min/max). */
export const RESOURCE_LIBRARY: Record<string, Resource> = Object.fromEntries(
  Object.values(CHARACTER_LIBRARY)
    .flatMap((c) => c.resources)
    .map((r) => [r.id, r]),
);

export const CHARACTER_ART_LIBRARY: Record<string, CharacterArtSpec> = Object.fromEntries(
  [TORTUGA_REX_ART, MISTER_WHISKERS_ART, WHISKERS_DEVOURER_OF_WORLDS_ART, PATIENT_ZERO_ART, MOONSHOT_MADDOX_ART, MALACHAR_ART, FATHER_BELL_ART, PLAGUE_DOCTOR_ART, BEHEMOTH_ART, SHIRO_ART, HYDRA_ART].map((a) => [
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
    FATHER_BELL_VISUAL_BIBLE,
    PLAGUE_DOCTOR_VISUAL_BIBLE,
    BEHEMOTH_VISUAL_BIBLE,
    SHIRO_VISUAL_BIBLE,
    HYDRA_VISUAL_BIBLE,
  ].map((b) => [b.characterId, b]),
);
