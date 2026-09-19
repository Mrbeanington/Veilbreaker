import type { CharacterDefinition } from "@veilbreak/content";
import type { BotLevel } from "./bots";
import type { Random } from "./prng";

// phase-11: the bot side of the local ranked ladder. Everything here is pure
// and seeded, so a ladder opponent is reproducible from the match seed. The
// player's rating and divisions live in packages/persistence; this module only
// sees a division *index* (0 = lowest) so the two packages stay independent.

/** Balance data the ladder reads: character win rates and the strongest trios, both measured by `pnpm meta`. */
export interface MetaPool {
  source: { matches: number; seed: number; bots: string; date: string };
  /** Win rate in percent, per character, from random-team simulation. */
  winRates: Record<string, number>;
  /** The best trios seen, strongest first (smoothed win rate, enough games to trust). */
  topTeams: { team: string[]; games: number; winRate: number }[];
}

export const TEAM_SIZE = 3;
export const DRAFT_SIZE = 4;

/** Divisions 0-2 Bronze, 3-5 Silver, 6-8 Gold, 9-11 Platinum, 12-14 Diamond, 15 apex (see persistence/ranked). */
export const FIRST_META_DIVISION = 9;
export const FIRST_PICK_BAN_DIVISION = 12;

/** How hard the bot thinks, by division (spec/06: opponents scale with division). */
export function botLevelFor(divisionIndex: number): BotLevel {
  if (divisionIndex < 3) return "BEGINNER";
  if (divisionIndex < 6) return "INTERMEDIATE";
  if (divisionIndex < 12) return "ADVANCED";
  return "EXPERT";
}

/** OQ-05: lower divisions meet at most one Legend per bot team, Platinum and above at most two. The player is not limited. */
export function legendCapFor(divisionIndex: number): number {
  return divisionIndex < FIRST_META_DIVISION ? 1 : 2;
}

/** 0 (random teams) to 10 (strongest picks): how strongly the bot leans on the meta. */
export function teamQualityFor(divisionIndex: number): number {
  return Math.max(0, Math.min(10, Math.round((divisionIndex * 10) / 15)));
}

/** Pick/ban against bots happens at high divisions only (phase-11). */
export function usesPickBan(divisionIndex: number): boolean {
  return divisionIndex >= FIRST_PICK_BAN_DIVISION;
}

/** The bot's rating for one match: the player's own, nudged a little either way (seeded), so results stay informative. */
export function opponentRating(playerRating: number, random: Random): number {
  const nudge = (Math.floor(random() * 7) - 3) * 20; // -60 .. +60
  return Math.max(0, playerRating + nudge);
}

const isLegend = (c: CharacterDefinition) => c.rarity === "LEGENDARY";

function weightOf(character: CharacterDefinition, quality: number, meta: MetaPool): number {
  const rate = meta.winRates[character.id] ?? 50;
  return Math.max(1, 100 + Math.round(quality * (rate - 50)));
}

function weightedPick<T>(items: readonly T[], weight: (item: T) => number, random: Random): T | undefined {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  if (items.length === 0 || total <= 0) return undefined;
  let roll = random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

export interface DraftOptions {
  divisionIndex: number;
  pool: readonly CharacterDefinition[];
  meta: MetaPool;
  random: Random;
  /** How many characters to choose (a team, or a team plus a spare when there is pick/ban). */
  size?: number;
}

/**
 * Builds the bot's picks. Low divisions choose close to at random; higher ones
 * lean on the measured meta, and from Platinum a bot often plays one of the
 * strongest known trios outright. The Legend cap always holds.
 */
export function buildBotDraft({ divisionIndex, pool, meta, random, size = TEAM_SIZE }: DraftOptions): string[] {
  const byId = new Map(pool.map((c) => [c.id, c]));
  const cap = legendCapFor(divisionIndex);
  const quality = teamQualityFor(divisionIndex);
  const chosen: CharacterDefinition[] = [];
  const legends = () => chosen.filter(isLegend).length;

  // Platinum and above: often start from a known-strong trio.
  if (divisionIndex >= FIRST_META_DIVISION && random() < 0.6) {
    const candidates = meta.topTeams
      .slice(0, 12)
      .map((t) => t.team.map((id) => byId.get(id)))
      .filter((team): team is CharacterDefinition[] => team.length === TEAM_SIZE && team.every((c) => c !== undefined) && team.filter(isLegend).length <= cap);
    const team = weightedPick(candidates, () => 1, random);
    if (team) chosen.push(...team);
  }

  while (chosen.length < size) {
    const available = pool.filter((c) => !chosen.includes(c) && (!isLegend(c) || legends() < cap));
    const next = weightedPick(available, (c) => weightOf(c, quality, meta), random);
    if (!next) break;
    chosen.push(next);
  }
  return chosen.slice(0, size).map((c) => c.id);
}

/** The bot removes one of the player's four. Better bots take the character that measures strongest; weaker ones often pick at random. */
export function botBan(playerDraft: readonly string[], level: BotLevel, meta: MetaPool, random: Random): string {
  const skilled = level === "EXPERT" || level === "LEGEND_BOSS" || (level === "ADVANCED" && random() < 0.7);
  if (!skilled) return playerDraft[Math.floor(random() * playerDraft.length)] as string;
  return [...playerDraft].sort((a, b) => (meta.winRates[b] ?? 50) - (meta.winRates[a] ?? 50) || a.localeCompare(b))[0] as string;
}

/** What is left of a four-character draft after the opponent's ban. */
export function afterBan(draft: readonly string[], banned: string): string[] {
  return draft.filter((id) => id !== banned);
}

// ------------------------------------------------------------- meta data

export interface MetaGame {
  teamA: readonly string[];
  teamB: readonly string[];
  winner: "playerA" | "playerB" | "draw";
}

const MIN_TEAM_GAMES = 20;
const TOP_TEAMS = 40;

/** Turns simulation results into the ladder's meta pool: per-character win rates plus the best trios (win rate smoothed toward 50% so a lucky small sample cannot top the list). */
export function buildMetaPool(
  games: readonly MetaGame[],
  characterWinRates: Record<string, number>,
  source: MetaPool["source"],
  /** A trio needs this many games to be listed; larger rosters have more trios, so the script lowers it. */
  minGames = MIN_TEAM_GAMES,
): MetaPool {
  const teams = new Map<string, { team: string[]; games: number; wins: number }>();
  const note = (team: readonly string[], won: boolean) => {
    const sorted = [...team].sort();
    const key = sorted.join("|");
    const entry = teams.get(key) ?? { team: sorted, games: 0, wins: 0 };
    entry.games += 1;
    if (won) entry.wins += 1;
    teams.set(key, entry);
  };
  for (const g of games) {
    note(g.teamA, g.winner === "playerA");
    note(g.teamB, g.winner === "playerB");
  }
  const SMOOTHING = 10; // ten imaginary 50% games
  const topTeams = [...teams.values()]
    .filter((t) => t.games >= minGames)
    .map((t) => ({ team: t.team, games: t.games, winRate: Math.round(((t.wins + SMOOTHING / 2) / (t.games + SMOOTHING)) * 1000) / 10 }))
    .sort((a, b) => b.winRate - a.winRate || a.team.join("|").localeCompare(b.team.join("|")))
    .slice(0, TOP_TEAMS);
  return { source, winRates: characterWinRates, topTeams };
}
