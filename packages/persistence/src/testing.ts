import {
  ABILITY_LIBRARY,
  CHARACTER_LIBRARY,
  PASSIVE_LIBRARY,
  TRANSFORMATION_LIBRARY,
  defaultEnergyRules,
} from "@veilbreak/content";
import { PROFILE_VERSION, createDefaultProfile, profileSchema, type Profile } from "./profile";
import type { ReplayRecord } from "./replay";

// Test helpers shared by the persistence tests (not exported from index.ts).

export const ID_TABLE: string[] = [
  ...Object.keys(CHARACTER_LIBRARY),
  ...Object.keys(ABILITY_LIBRARY),
  ...Object.keys(PASSIVE_LIBRARY),
  ...Object.keys(TRANSFORMATION_LIBRARY),
].sort();

/** A profile with every field pushed to its realistic maximum: the worst case for size budgets. */
export function maxedProfile(): Profile {
  const characters = Object.keys(CHARACTER_LIBRARY);
  const pairs = () => Object.fromEntries(characters.map((a) => [a, Object.fromEntries(characters.filter((b) => b !== a).map((b) => [b, 40]))]));
  const legends = ["zeiron", "shiro", "behemoth", "black-knight", "emperor-zero", "morrigan", "aurelia", "madame-fortuna", "minotaur-king", "orpheon", "calypsa"];
  return profileSchema.parse({
    version: PROFILE_VERSION,
    settings: { animationSpeed: "slow", reducedMotion: "on", turnTimer: false, uiScale: "xlarge", highContrast: true, soundEnabled: true, soundVolume: 100, showAllCharacters: true, botLevel: "EXPERT" },
    favorites: characters,
    recent: characters.slice(0, 12),
    played: Object.fromEntries(characters.map((c) => [c, 999])),
    presets: Array.from({ length: 24 }, (_, i) => ({ id: `preset-${i.toString(36)}abcdef`, name: `Team number ${i} with a long name`, characterIds: characters.slice(i % 10, (i % 10) + 3) })),
    discovered: {
      characters,
      abilities: Object.keys(ABILITY_LIBRARY),
      passives: Object.keys(PASSIVE_LIBRARY),
      transformations: Object.keys(TRANSFORMATION_LIBRARY),
    },
    beat: pairs(),
    wonWith: pairs(),
    matchesPlayed: 99999,
    xp: 987654,
    unlocks: { legends, namelessBossDefeated: true },
    trialsWon: legends.map((l) => `trial.${l}`),
    missions: {
      progress: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`mission.progress-${i}`, 500])),
      completed: Array.from({ length: 30 }, (_, i) => `mission.done-${i}`),
    },
    achievements: Array.from({ length: 24 }, (_, i) => `achievement.secret-${i}`),
    history: Array.from({ length: 50 }, (_, i) => ({ id: `m-${i}`, playedAt: 1_700_000_000_000 + i, mode: "bot", teamAIds: characters.slice(0, 3), teamBIds: characters.slice(3, 6), winnerPlayerId: "playerA", turns: 20 })),
    install: { firstLaunchHandled: true, installed: true, asks: 2, lastAskAt: 1_700_000_000_000 },
    lastPlayedAt: 1_700_000_000_000,
  });
}

export function sampleReplay(id = "r1", turns = 3): ReplayRecord {
  return {
    version: 1,
    id,
    playedAt: 1_700_000_000_000,
    mode: "bot",
    seed: 12345,
    balanceVersionId: "phase-05-v1",
    energyRules: defaultEnergyRules,
    teamAIds: ["tortuga-rex", "hydra", "malachar"],
    teamBIds: ["shiro", "koschei", "father-bell"],
    turns: Array.from({ length: turns }, () => ({
      a: [{ playerId: "playerA", characterId: "hydra", abilityId: "ability.hydra.serpent-bite", targetIds: ["shiro"] }],
      b: [{ playerId: "playerB", characterId: "shiro", abilityId: "ability.shiro.ink-slash", targetIds: ["hydra"] }],
    })),
    winnerPlayerId: "playerA",
  };
}

export const freshProfile = createDefaultProfile;
