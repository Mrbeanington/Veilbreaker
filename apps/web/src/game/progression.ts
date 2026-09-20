import { ABILITY_LIBRARY, CHARACTER_LIBRARY, PASSIVE_LIBRARY, PLAYABLE_CHARACTERS, TRANSFORMATION_LIBRARY, type BattleEvent } from "@veilbreak/content";
import { levelForXp, type Profile } from "@veilbreak/persistence";
import { applyMatchToProfile, type MatchSummary } from "./discovery";
import { originOf, rolesOf } from "./knowledge";

// spec/06 "Progression": account level, mastery, missions, faction challenges,
// secret achievements, Legend trials. Nothing is purchasable. Every rule here
// is a pure function over the profile and a finished match's battle log:
// UI code never sets an unlock directly (spec/06 "Secret achievements").

export interface ProgressMatch extends MatchSummary {
  mode: "bot" | "hotseat" | "trial" | "friend" | "ranked";
  trialId?: string;
  turns: number;
  /** Where each fighter ended the match. */
  finalCharacters: Readonly<Record<string, { hp: number; alive: boolean }>>;
}

const teamOf = (m: MatchSummary, playerId: string | null): readonly string[] =>
  playerId === "playerA" ? m.teamAIds : playerId === "playerB" ? m.teamBIds : [];
const losersOf = (m: MatchSummary): readonly string[] => (m.winnerPlayerId === "playerA" ? m.teamBIds : m.winnerPlayerId === "playerB" ? m.teamAIds : []);
const isLegend = (id: string): boolean => CHARACTER_LIBRARY[id]?.rarity === "LEGENDARY";

// ------------------------------------------------------------------ Legends

/** spec/03 "The Twelve Legends", in chamber order. Ten are built; the rest are placeholders until they are. */
export const LEGEND_ORDER = [
  "zeiron",
  "shiro",
  "morrigan",
  "aurelia",
  "madame-fortuna",
  "behemoth",
  "minotaur-king",
  "black-knight",
  "orpheon",
  "calypsa",
  "emperor-zero",
  "the-nameless-one",
] as const;
export const NAMELESS_ID = "the-nameless-one";

export interface LegendTrial {
  id: string;
  legendId: string;
  /** The Legend plus two supporting fighters, all bot-controlled at LEGEND_BOSS level. */
  enemyTeam: readonly string[];
}

export const LEGEND_TRIALS: readonly LegendTrial[] = [
  { id: "trial.zeiron", legendId: "zeiron", enemyTeam: ["zeiron", "tortuga-rex", "plague-doctor"] },
  { id: "trial.morrigan", legendId: "morrigan", enemyTeam: ["morrigan", "the-valkyrie", "banshee"] },
  { id: "trial.aurelia", legendId: "aurelia", enemyTeam: ["aurelia", "the-sphinx", "sand-assassin"] },
  { id: "trial.madame-fortuna", legendId: "madame-fortuna", enemyTeam: ["madame-fortuna", "the-gambler", "the-referee"] },
  { id: "trial.minotaur-king", legendId: "minotaur-king", enemyTeam: ["minotaur-king", "asterion", "cyclops-brontes"] },
  { id: "trial.shiro", legendId: "shiro", enemyTeam: ["shiro", "mister-whiskers", "nine-tailed-trickster"] },
  { id: "trial.behemoth", legendId: "behemoth", enemyTeam: ["behemoth", "father-bell", "baba-yaga"] },
  { id: "trial.black-knight", legendId: "black-knight", enemyTeam: ["black-knight", "tortuga-rex", "mister-whiskers"] },
  { id: "trial.emperor-zero", legendId: "emperor-zero", enemyTeam: ["emperor-zero", "maestro-nocturne", "father-bell"] },
  // His boss encounter: only reachable once the gate below opens.
  { id: "trial.the-nameless-one", legendId: NAMELESS_ID, enemyTeam: [NAMELESS_ID, "black-knight", "emperor-zero"] },
];

/** True once all eleven other Legends are unlocked (the boss encounter is then available). */
export function namelessGateOpen(profile: Profile): boolean {
  return LEGEND_ORDER.filter((id) => id !== NAMELESS_ID).every((id) => profile.unlocks.legends.includes(id));
}

/** The Nameless One is playable only after the gate AND his boss encounter (spec/06). */
export function namelessUnlocked(profile: Profile): boolean {
  return namelessGateOpen(profile) && profile.unlocks.namelessBossDefeated;
}

export function trialAvailable(profile: Profile, trial: LegendTrial): boolean {
  return trial.legendId === NAMELESS_ID ? namelessGateOpen(profile) : true;
}

export function legendUnlocked(profile: Profile, legendId: string): boolean {
  return legendId === NAMELESS_ID ? namelessUnlocked(profile) && profile.unlocks.legends.includes(legendId) : profile.unlocks.legends.includes(legendId);
}

// ------------------------------------------------------------------ missions

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  goal: number;
  xp: number;
  /** New progress value, given the previous one, the updated profile and the match. */
  advance: (previous: number, profile: Profile, match: ProgressMatch) => number;
  faction?: string;
}

const won = (m: MatchSummary): boolean => m.winnerPlayerId !== null;
const plus = (previous: number, condition: boolean): number => previous + (condition ? 1 : 0);

const BASE_MISSIONS: MissionDef[] = [
  { id: "mission.first-victory", title: "First victory", description: "Win a match.", goal: 1, xp: 40, advance: (p, _pr, m) => plus(p, won(m)) },
  { id: "mission.regular", title: "Regular", description: "Play 10 matches.", goal: 10, xp: 60, advance: (p) => p + 1 },
  { id: "mission.winning-streak", title: "Getting good", description: "Win 5 matches.", goal: 5, xp: 80, advance: (p, _pr, m) => plus(p, won(m)) },
  { id: "mission.roster", title: "Try everyone", description: "Play 8 different fighters.", goal: 8, xp: 80, advance: (_p, pr) => Object.values(pr.played).filter((n) => n > 0).length },
  { id: "mission.scout", title: "Scout", description: "Meet 12 different fighters.", goal: 12, xp: 60, advance: (_p, pr) => pr.discovered.characters.length },
  {
    id: "mission.legend-slayer",
    title: "Legend slayer",
    description: "Win a match against a team that has a Legend.",
    goal: 1,
    xp: 80,
    advance: (p, _pr, m) => plus(p, won(m) && losersOf(m).some(isLegend)),
  },
  {
    id: "mission.well-rounded",
    title: "Well rounded",
    description: "Win with a team of three different roles.",
    goal: 1,
    xp: 60,
    advance: (p, _pr, m) => {
      const team = teamOf(m, m.winnerPlayerId);
      const roles = new Set(team.flatMap((id) => (CHARACTER_LIBRARY[id] ? rolesOf(CHARACTER_LIBRARY[id]).slice(0, 1) : [])));
      return plus(p, team.length >= 3 && roles.size >= 3);
    },
  },
  { id: "mission.swift", title: "Swift", description: "Win a match in 12 turns or fewer.", goal: 1, xp: 60, advance: (p, _pr, m) => plus(p, won(m) && m.turns <= 12) },
  { id: "mission.trialist", title: "Trialist", description: "Win a Legend trial.", goal: 1, xp: 100, advance: (p, _pr, m) => plus(p, won(m) && m.mode === "trial") },
];

/** Faction challenges: chains per origin (spec/06): win with two or more fighters of one origin. */
function factionMissions(): MissionDef[] {
  const counts = new Map<string, number>();
  for (const c of PLAYABLE_CHARACTERS) counts.set(originOf(c.id), (counts.get(originOf(c.id)) ?? 0) + 1);
  const out: MissionDef[] = [];
  for (const [origin, n] of [...counts].sort()) {
    if (n < 2) continue;
    const slug = origin.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const tiers: [number, number][] = [[1, 40], [3, 80], [6, 140]];
    for (const [goal, xp] of tiers) {
      out.push({
        id: `faction.${slug}.${goal}`,
        title: `${origin}: ${goal === 1 ? "first blood" : `${goal} wins`}`,
        description: `Win ${goal} match${goal === 1 ? "" : "es"} with two or more ${origin} fighters on your team.`,
        goal,
        xp,
        faction: origin,
        // Each tier keeps its own counter, so tiers can be completed in any order.
        advance: (p, _pr, m) => plus(p, won(m) && teamOf(m, m.winnerPlayerId).filter((id) => originOf(id) === origin).length >= 2),
      });
    }
  }
  return out;
}

export const MISSIONS: MissionDef[] = [...BASE_MISSIONS, ...factionMissions()];

// ------------------------------------------------------------------ secret achievements

export interface AchievementDef {
  id: string;
  title: string;
  /** Shown before it is earned: cryptic on purpose (spec/06). */
  hint: string;
  earned: (m: ProgressMatch) => boolean;
}

const has = (log: readonly BattleEvent[], type: string): BattleEvent[] => log.filter((e) => e.type === type);
const directDamageBy = (m: ProgressMatch, team: readonly string[]): boolean =>
  has(m.eventLog, "damageDealt").some((e) => e.sourceId && team.includes(e.sourceId) && e.sourceId !== e.targetId);

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "achievement.hollow-victory",
    title: "Hollow victory",
    hint: "Some wins are paid for with company.",
    earned: (m) => {
      const team = teamOf(m, m.winnerPlayerId);
      return team.length > 0 && has(m.eventLog, "death").filter((e) => e.targetId && team.includes(e.targetId)).length >= 2;
    },
  },
  {
    id: "achievement.clean-hands",
    title: "Clean hands",
    hint: "Victory without a single blow struck.",
    earned: (m) => won(m) && !directDamageBy(m, teamOf(m, m.winnerPlayerId)),
  },
  {
    id: "achievement.again-and-again",
    title: "Again and again",
    hint: "Death is a door that opens more than once.",
    earned: (m) => {
      const counts = new Map<string, number>();
      for (const e of has(m.eventLog, "resurrected")) if (e.targetId) counts.set(e.targetId, (counts.get(e.targetId) ?? 0) + 1);
      return [...counts.values()].some((n) => n >= 2);
    },
  },
  {
    id: "achievement.full-repertoire",
    title: "Full repertoire",
    hint: "Every string of the instrument, in a single night.",
    earned: (m) => {
      const used = new Set(has(m.eventLog, "abilityUsed").map((e) => `${e.sourceId}:${String(e.payload?.abilityId)}`));
      return [...m.teamAIds, ...m.teamBIds].some((id) => {
        const def = CHARACTER_LIBRARY[id];
        return !!def && def.abilityIds.length >= 3 && def.abilityIds.every((a) => used.has(`${id}:${a}`));
      });
    },
  },
  {
    id: "achievement.by-a-thread",
    title: "By a thread",
    hint: "One breath away.",
    earned: (m) => won(m) && teamOf(m, m.winnerPlayerId).some((id) => m.finalCharacters[id]?.alive && m.finalCharacters[id]?.hp === 1),
  },
  {
    id: "achievement.outbreak",
    title: "Outbreak",
    hint: "Sickness has a final form.",
    earned: (m) => has(m.eventLog, "transformed").some((e) => String(e.payload?.transformationId).endsWith("to-the-outbreak")),
  },
  {
    id: "achievement.giant-killer",
    title: "Giant killer",
    hint: "The small can topple the mighty.",
    earned: (m) => won(m) && losersOf(m).some(isLegend) && !teamOf(m, m.winnerPlayerId).some(isLegend),
  },
  {
    id: "achievement.unwritten",
    title: "Unwritten",
    hint: "Watch a moment be taken back.",
    earned: (m) => has(m.eventLog, "turnRewound").length > 0,
  },
];

// ------------------------------------------------------------------ applying a match

export const XP = { win: 30, draw: 15, loss: 10, newFighter: 8, trialWin: 100, achievement: 50 } as const;

export interface ProgressReport {
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  revealed: string[];
  achievements: string[];
  missionsCompleted: string[];
  legendUnlocked?: string;
}

export interface ProgressResult {
  profile: Profile;
  report: ProgressReport;
}

export function applyMatchProgress(profile: Profile, match: ProgressMatch, replayId: string | undefined, now: number): ProgressResult {
  let next = applyMatchToProfile(profile, match);
  const revealed = next.discovered.characters.filter((id) => !profile.discovered.characters.includes(id));
  let xp: number = match.winnerPlayerId === null ? XP.draw : XP.win;
  // A local match has two sides but one profile: the human side's result counts.
  const humanWon = match.winnerPlayerId !== null && match.humanTeams.includes(match.winnerPlayerId === "playerA" ? "A" : "B");
  if (match.winnerPlayerId !== null && !humanWon) xp = XP.loss;
  xp += revealed.length * XP.newFighter;

  // Legend trial: winning unlocks the Legend (and, for the boss, opens the Nameless One).
  let legendUnlocked: string | undefined;
  const trial = LEGEND_TRIALS.find((t) => t.id === match.trialId);
  const playerWonTrial = match.mode === "trial" && humanWon;
  if (trial && playerWonTrial && trialAvailable(profile, trial)) {
    const legends = next.unlocks.legends.includes(trial.legendId) ? next.unlocks.legends : [...next.unlocks.legends, trial.legendId];
    next = {
      ...next,
      unlocks: { legends, namelessBossDefeated: next.unlocks.namelessBossDefeated || trial.legendId === NAMELESS_ID },
      trialsWon: next.trialsWon.includes(trial.id) ? next.trialsWon : [...next.trialsWon, trial.id],
    };
    if (!profile.unlocks.legends.includes(trial.legendId)) {
      legendUnlocked = trial.legendId;
      xp += XP.trialWin;
    }
  }

  // Missions and achievements score the match from the player's side: a bot's
  // victory is not a "win" for the profile.
  const scoring: ProgressMatch = humanWon ? match : { ...match, winnerPlayerId: null };
  const progress = { ...next.missions.progress };
  const completed = [...next.missions.completed];
  const missionsCompleted: string[] = [];
  for (const mission of MISSIONS) {
    if (completed.includes(mission.id)) continue;
    const value = mission.advance(progress[mission.id] ?? 0, next, scoring);
    progress[mission.id] = Math.min(mission.goal, value);
    if (progress[mission.id]! >= mission.goal) {
      completed.push(mission.id);
      missionsCompleted.push(mission.id);
      xp += mission.xp;
    }
  }
  next = { ...next, missions: { progress, completed } };

  // Secret achievements.
  const achievements: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (next.achievements.includes(a.id) || !a.earned(scoring)) continue;
    achievements.push(a.id);
    xp += XP.achievement;
  }
  if (achievements.length > 0) next = { ...next, achievements: [...next.achievements, ...achievements] };

  const entry = {
    id: replayId ?? `match-${now.toString(36)}`,
    playedAt: now,
    mode: match.mode,
    teamAIds: [...match.teamAIds],
    teamBIds: [...match.teamBIds],
    winnerPlayerId: match.winnerPlayerId,
    turns: match.turns,
    replayId,
    trialId: match.trialId,
    humanSide: match.humanTeams.length === 1 ? match.humanTeams[0] : undefined,
  };
  next = { ...next, xp: next.xp + xp, lastPlayedAt: now, history: [entry, ...next.history].slice(0, 50) };

  return {
    profile: next,
    report: {
      xpGained: xp,
      levelBefore: levelForXp(profile.xp),
      levelAfter: levelForXp(next.xp),
      revealed,
      achievements,
      missionsCompleted,
      legendUnlocked,
    },
  };
}

export const missionById = (id: string): MissionDef | undefined => MISSIONS.find((m) => m.id === id);
export const achievementById = (id: string): AchievementDef | undefined => ACHIEVEMENTS.find((a) => a.id === id);

/** Every id the transfer codec may replace by a table position, so both devices agree (persistence compares a fingerprint). */
export function buildIdTable(): string[] {
  return [...new Set([
    ...Object.keys(CHARACTER_LIBRARY),
    ...Object.keys(ABILITY_LIBRARY),
    ...Object.keys(PASSIVE_LIBRARY),
    ...Object.keys(TRANSFORMATION_LIBRARY),
    ...MISSIONS.map((m) => m.id),
    ...ACHIEVEMENTS.map((a) => a.id),
    ...LEGEND_TRIALS.map((t) => t.id),
    ...LEGEND_ORDER,
  ])].sort();
}
