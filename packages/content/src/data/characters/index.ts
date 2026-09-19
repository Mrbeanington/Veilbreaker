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
export * from "./koschei";
export * from "./baba-yaga";
export * from "./nine-tailed-trickster";
export * from "./the-gambler";
export * from "./zeiron";
export * from "./the-referee";
export * from "./maestro-nocturne";
export * from "./black-knight";
export * from "./emperor-zero";
export * from "./the-nameless-one";
export * from "./asterion";
export * from "./medusa";
export * from "./charon";
export * from "./the-bronze-giant";
export * from "./arachne";
export * from "./cyclops-brontes";
export * from "./the-oracle";
export * from "./cerberus";
export * from "./the-siren";
export * from "./nemesis";
export * from "./hecates-disciple";
export * from "./icarion";
export * from "./the-forgotten-titan";

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

import { KOSCHEI, KOSCHEI_ABILITIES, KOSCHEI_ART, KOSCHEI_VISUAL_BIBLE, DEATH_HIDDEN_AWAY } from "./koschei";
import { BABA_YAGA, BABA_YAGA_ABILITIES, BABA_YAGA_ART, BABA_YAGA_VISUAL_BIBLE, HUT_SUMMON, OLD_HUNGER } from "./baba-yaga";
import {
  ASCENSION,
  NINE_TAILED_TRICKSTER,
  NINE_TAILED_TRICKSTER_ABILITIES,
  NINE_TAILED_TRICKSTER_ART,
  NINE_TAILED_TRICKSTER_VISUAL_BIBLE,
  TAIL_BY_TAIL,
} from "./nine-tailed-trickster";
import { THE_GAMBLER, THE_GAMBLER_ABILITIES, THE_GAMBLER_ART, THE_GAMBLER_VISUAL_BIBLE } from "./the-gambler";
import { ZEIRON, ZEIRON_ABILITIES, ZEIRON_ART, ZEIRON_VISUAL_BIBLE, BROKEN_CROWN } from "./zeiron";
import { THE_REFEREE, THE_REFEREE_ABILITIES, THE_REFEREE_ART, THE_REFEREE_VISUAL_BIBLE, PLAY_ON_THE_WHISTLE } from "./the-referee";
import {
  MAESTRO_NOCTURNE,
  MAESTRO_NOCTURNE_ABILITIES,
  MAESTRO_NOCTURNE_ART,
  MAESTRO_NOCTURNE_VISUAL_BIBLE,
  PERFECT_TEMPO,
} from "./maestro-nocturne";
import {
  BLACK_KNIGHT,
  BLACK_KNIGHT_ABILITIES,
  BLACK_KNIGHT_ART,
  BLACK_KNIGHT_VISUAL_BIBLE,
  LEGEND_SLAYERS_RESOLVE,
} from "./black-knight";
import { EMPEROR_ZERO, EMPEROR_ZERO_ABILITIES, EMPEROR_ZERO_ART, EMPEROR_ZERO_VISUAL_BIBLE, FAILSAFE_PROTOCOL } from "./emperor-zero";
import {
  THE_NAMELESS_ONE,
  THE_NAMELESS_ONE_ABILITIES,
  THE_NAMELESS_ONE_ART,
  THE_NAMELESS_ONE_VISUAL_BIBLE,
  NOT_YET_WRITTEN,
} from "./the-nameless-one";

import { ASTERION, ASTERION_ABILITIES, ASTERION_ART, ASTERION_VISUAL_BIBLE, RAGE_OF_THE_MAZE } from "./asterion";
import { MEDUSA, MEDUSA_ABILITIES, MEDUSA_ART, MEDUSA_VISUAL_BIBLE } from "./medusa";
import { CHARON, CHARON_ABILITIES, CHARON_ART, CHARON_VISUAL_BIBLE, THE_TOLL } from "./charon";
import { THE_BRONZE_GIANT, THE_BRONZE_GIANT_ABILITIES, THE_BRONZE_GIANT_ART, THE_BRONZE_GIANT_VISUAL_BIBLE, ICHOR_VEIN } from "./the-bronze-giant";
import { ARACHNE, ARACHNE_ABILITIES, ARACHNE_ART, ARACHNE_VISUAL_BIBLE, WEB_SENSE } from "./arachne";
import { CYCLOPS_BRONTES, CYCLOPS_BRONTES_ABILITIES, CYCLOPS_BRONTES_ART, CYCLOPS_BRONTES_VISUAL_BIBLE } from "./cyclops-brontes";
import { THE_ORACLE, THE_ORACLE_ABILITIES, THE_ORACLE_ART, THE_ORACLE_VISUAL_BIBLE } from "./the-oracle";
import { CERBERUS, CERBERUS_ABILITIES, CERBERUS_ART, CERBERUS_VISUAL_BIBLE, GATE_GUARD } from "./cerberus";
import { THE_SIREN, THE_SIREN_ABILITIES, THE_SIREN_ART, THE_SIREN_VISUAL_BIBLE } from "./the-siren";
import { NEMESIS, NEMESIS_ABILITIES, NEMESIS_ART, NEMESIS_VISUAL_BIBLE, SCALES_MUST_BALANCE } from "./nemesis";
import { HECATES_DISCIPLE, HECATES_DISCIPLE_ABILITIES, HECATES_DISCIPLE_ART, HECATES_DISCIPLE_VISUAL_BIBLE } from "./hecates-disciple";
import { ICARION, ICARION_ABILITIES, ICARION_ART, ICARION_VISUAL_BIBLE, MELTING_WAX } from "./icarion";
import { THE_FORGOTTEN_TITAN, THE_FORGOTTEN_TITAN_ABILITIES, THE_FORGOTTEN_TITAN_ART, THE_FORGOTTEN_TITAN_VISUAL_BIBLE, HEAVY_SLEEPER, AWAKENED } from "./the-forgotten-titan";

/** phase-04-first-five.md's five prototypes, plus the stubbed Devourer-of-Worlds hook. */
export const CHARACTER_LIBRARY: Record<string, CharacterDefinition> = Object.fromEntries(
  [TORTUGA_REX, MISTER_WHISKERS, WHISKERS_DEVOURER_OF_WORLDS, PATIENT_ZERO, MOONSHOT_MADDOX, MALACHAR, FATHER_BELL, PLAGUE_DOCTOR, BEHEMOTH, SHIRO, HYDRA, KOSCHEI, BABA_YAGA, NINE_TAILED_TRICKSTER, THE_GAMBLER, ZEIRON, THE_REFEREE, MAESTRO_NOCTURNE, BLACK_KNIGHT, EMPEROR_ZERO, THE_NAMELESS_ONE, ASTERION, MEDUSA, CHARON, THE_BRONZE_GIANT, ARACHNE, CYCLOPS_BRONTES, THE_ORACLE, CERBERUS, THE_SIREN, NEMESIS, HECATES_DISCIPLE, ICARION, THE_FORGOTTEN_TITAN].map((c) => [c.id, c]),
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
    ...KOSCHEI_ABILITIES,
    ...BABA_YAGA_ABILITIES,
    ...NINE_TAILED_TRICKSTER_ABILITIES,
    ...THE_GAMBLER_ABILITIES,
    ...ZEIRON_ABILITIES,
    ...THE_REFEREE_ABILITIES,
    ...MAESTRO_NOCTURNE_ABILITIES,
    ...BLACK_KNIGHT_ABILITIES,
    ...EMPEROR_ZERO_ABILITIES,
    ...THE_NAMELESS_ONE_ABILITIES,
    ...ASTERION_ABILITIES,
    ...MEDUSA_ABILITIES,
    ...CHARON_ABILITIES,
    ...THE_BRONZE_GIANT_ABILITIES,
    ...ARACHNE_ABILITIES,
    ...CYCLOPS_BRONTES_ABILITIES,
    ...THE_ORACLE_ABILITIES,
    ...CERBERUS_ABILITIES,
    ...THE_SIREN_ABILITIES,
    ...NEMESIS_ABILITIES,
    ...HECATES_DISCIPLE_ABILITIES,
    ...ICARION_ABILITIES,
    ...THE_FORGOTTEN_TITAN_ABILITIES,
  ].map((a) => [a.id, a]),
);

export const PASSIVE_LIBRARY: Record<string, PassiveDefinition> = Object.fromEntries(
  [NINE_LIVES, THE_HUNGER_GROWS, AT_THE_PLATE, THE_DEAD_REMEMBER, LET_THE_DEAD_REST, PRIMORDIAL_HIDE, CUT_ONE_TWO_GROW, DEATH_HIDDEN_AWAY, OLD_HUNGER, TAIL_BY_TAIL, BROKEN_CROWN, PLAY_ON_THE_WHISTLE, PERFECT_TEMPO, LEGEND_SLAYERS_RESOLVE, FAILSAFE_PROTOCOL, NOT_YET_WRITTEN, RAGE_OF_THE_MAZE, THE_TOLL, ICHOR_VEIN, WEB_SENSE, GATE_GUARD, SCALES_MUST_BALANCE, MELTING_WAX, HEAVY_SLEEPER].map((p) => [p.id, p]),
);

export const TRANSFORMATION_LIBRARY: Record<string, Transformation> = Object.fromEntries(
  [...PATIENT_ZERO_TRANSFORMATIONS, TO_DEATH_KING, ASCENSION, AWAKENED].map((t) => [t.id, t]),
);

export const SUMMON_LIBRARY: Record<string, Summon> = Object.fromEntries([THRALL_SUMMON, BOUND_THRALL_SUMMON, HUT_SUMMON].map((s) => [s.id, s]));

/** Every custom Resource any implemented character uses — the `resourceLibrary` a real match's `ResolveTurnDeps` needs (clamping modifyResource to each resource's own min/max). */
export const RESOURCE_LIBRARY: Record<string, Resource> = Object.fromEntries(
  Object.values(CHARACTER_LIBRARY)
    .flatMap((c) => c.resources)
    .map((r) => [r.id, r]),
);

export const CHARACTER_ART_LIBRARY: Record<string, CharacterArtSpec> = Object.fromEntries(
  [TORTUGA_REX_ART, MISTER_WHISKERS_ART, WHISKERS_DEVOURER_OF_WORLDS_ART, PATIENT_ZERO_ART, MOONSHOT_MADDOX_ART, MALACHAR_ART, FATHER_BELL_ART, PLAGUE_DOCTOR_ART, BEHEMOTH_ART, SHIRO_ART, HYDRA_ART, KOSCHEI_ART, BABA_YAGA_ART, NINE_TAILED_TRICKSTER_ART, THE_GAMBLER_ART, ZEIRON_ART, THE_REFEREE_ART, MAESTRO_NOCTURNE_ART, BLACK_KNIGHT_ART, EMPEROR_ZERO_ART, THE_NAMELESS_ONE_ART, ASTERION_ART, MEDUSA_ART, CHARON_ART, THE_BRONZE_GIANT_ART, ARACHNE_ART, CYCLOPS_BRONTES_ART, THE_ORACLE_ART, CERBERUS_ART, THE_SIREN_ART, NEMESIS_ART, HECATES_DISCIPLE_ART, ICARION_ART, THE_FORGOTTEN_TITAN_ART].map((a) => [
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
    KOSCHEI_VISUAL_BIBLE,
    BABA_YAGA_VISUAL_BIBLE,
    NINE_TAILED_TRICKSTER_VISUAL_BIBLE,
    THE_GAMBLER_VISUAL_BIBLE,
    ZEIRON_VISUAL_BIBLE,
    THE_REFEREE_VISUAL_BIBLE,
    MAESTRO_NOCTURNE_VISUAL_BIBLE,
    BLACK_KNIGHT_VISUAL_BIBLE,
    EMPEROR_ZERO_VISUAL_BIBLE,
    THE_NAMELESS_ONE_VISUAL_BIBLE,
    ASTERION_VISUAL_BIBLE,
    MEDUSA_VISUAL_BIBLE,
    CHARON_VISUAL_BIBLE,
    THE_BRONZE_GIANT_VISUAL_BIBLE,
    ARACHNE_VISUAL_BIBLE,
    CYCLOPS_BRONTES_VISUAL_BIBLE,
    THE_ORACLE_VISUAL_BIBLE,
    CERBERUS_VISUAL_BIBLE,
    THE_SIREN_VISUAL_BIBLE,
    NEMESIS_VISUAL_BIBLE,
    HECATES_DISCIPLE_VISUAL_BIBLE,
    ICARION_VISUAL_BIBLE,
    THE_FORGOTTEN_TITAN_VISUAL_BIBLE,
  ].map((b) => [b.characterId, b]),
);

/** Phase 04 stub with one placeholder ability — not a real playable kit (docs/design/characters/mister-whiskers.md). */
export const STUB_CHARACTER_IDS: ReadonlySet<string> = new Set(["whiskers-devourer-of-worlds"]);

/** Every character with a real kit: the pool for team pickers and balance simulation. */
export const PLAYABLE_CHARACTERS: CharacterDefinition[] = Object.values(CHARACTER_LIBRARY).filter((c) => !STUB_CHARACTER_IDS.has(c.id));
