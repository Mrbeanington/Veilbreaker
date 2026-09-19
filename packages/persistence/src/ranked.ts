import { z } from "zod";

// phase-11 / spec/06 "Local ranked": a single-player ladder against tiered
// bots. A hidden Elo-style rating drives visible divisions; the first matches
// of a season are placements; seasons are calendar months. All of it is plain
// data inside the profile, so it is saved, backed up and transferred with it.
// Ratings are whole numbers and every function is pure (the caller passes
// `now`), so results are reproducible and easy to test.

export const RANKED_START_RATING = 400;
export const PLACEMENT_MATCHES = 5;
/** Placement matches move the rating faster than later ones. */
export const K_PLACEMENT = 40;
export const K_RANKED = 24;
/** A player only drops a division after falling this far below its floor, so a single loss at the edge does not flip them back and forth. */
export const DEMOTION_BUFFER = 20;
export const MAX_RECENT = 20;
export const MAX_PAST_SEASONS = 12;
const MAX_RATING = 3000;

// ------------------------------------------------------------- divisions

const TIER_NAMES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] as const;
const ROMAN = ["III", "II", "I"] as const;

export interface Division {
  index: number;
  name: string;
  tier: string;
  label: string;
  /** Lowest rating in the division. */
  floor: number;
}

/** Five named divisions of three tiers each (100 rating apiece), then the apex. */
export const DIVISIONS: readonly Division[] = [
  ...TIER_NAMES.flatMap((name, n) =>
    ROMAN.map((tier, t): Division => ({ index: n * 3 + t, name, tier, label: `${name} ${tier}`, floor: (n * 3 + t) * 100 })),
  ),
  { index: 15, name: "Veilbreaker", tier: "", label: "Veilbreaker", floor: 1500 },
];
export const APEX_DIVISION = DIVISIONS.length - 1;

/** The division a rating belongs to on its own (before promotion and demotion buffers). */
export function divisionIndexFor(rating: number): number {
  return Math.max(0, Math.min(APEX_DIVISION, Math.floor(rating / 100)));
}

/** Where a placed player lands: the rating's division, but never above Gold I (placements alone cannot buy the top). */
export const PLACEMENT_CEILING = 8;

// ------------------------------------------------------------- state

const resultEnum = z.enum(["win", "loss", "draw"]);
export type RankedResult = z.infer<typeof resultEnum>;

const recentSchema = z.object({
  id: z.string().min(1).max(60),
  at: z.number().int().min(0),
  result: resultEnum,
  delta: z.number().int(),
  /** Division shown to the player afterwards; -1 while still in placements. */
  division: z.number().int().min(-1).max(APEX_DIVISION),
  botLevel: z.string().max(20),
  team: z.array(z.string().max(80)).max(4),
  foe: z.array(z.string().max(80)).max(4),
  turns: z.number().int().min(0),
  /** The player left the match unfinished, which counts as a loss. */
  forfeit: z.boolean().default(false),
});
export type RankedMatchRecord = z.infer<typeof recentSchema>;

const seasonSummarySchema = z.object({
  season: z.string().max(10),
  placed: z.boolean(),
  division: z.number().int().min(0).max(APEX_DIVISION),
  peakDivision: z.number().int().min(0).max(APEX_DIVISION),
  peakRating: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  draws: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
});
export type SeasonSummary = z.infer<typeof seasonSummarySchema>;

// A ranked match that has begun but not finished. It is saved the moment the
// match starts, so leaving, reloading or closing the tab cannot dodge a loss.
const pendingSchema = z.object({
  id: z.string().min(1).max(60),
  at: z.number().int().min(0),
  opponentRating: z.number().int().min(0).max(MAX_RATING),
  botLevel: z.string().max(20),
  team: z.array(z.string().max(80)).max(4),
  foe: z.array(z.string().max(80)).max(4),
});
export type PendingRankedMatch = z.infer<typeof pendingSchema>;

const usageSchema = z.record(z.string(), z.object({ played: z.number().int().min(0), won: z.number().int().min(0) }));

export const rankedSchema = z.object({
  /** `YYYY-MM` of the season these numbers belong to; empty until the first ranked visit. */
  season: z.string().max(10).default(""),
  rating: z.number().int().min(0).max(MAX_RATING).default(RANKED_START_RATING),
  /** Matches played this season (placements are the first PLACEMENT_MATCHES). */
  placements: z.number().int().min(0).default(0),
  /** Current division index; only shown once placed. */
  division: z.number().int().min(0).max(APEX_DIVISION).default(divisionIndexFor(RANKED_START_RATING)),
  wins: z.number().int().min(0).default(0),
  losses: z.number().int().min(0).default(0),
  draws: z.number().int().min(0).default(0),
  /** Positive: consecutive wins. Negative: consecutive losses. A draw ends a streak. */
  streak: z.number().int().default(0),
  bestStreak: z.number().int().min(0).default(0),
  peakRating: z.number().int().min(0).default(RANKED_START_RATING),
  peakDivision: z.number().int().min(0).max(APEX_DIVISION).default(0),
  recent: z.array(recentSchema).max(MAX_RECENT).default([]),
  /** Character use and results in ranked matches, all seasons. */
  usage: usageSchema.default({}),
  bests: z
    .object({
      rating: z.number().int().min(0).default(RANKED_START_RATING),
      division: z.number().int().min(0).max(APEX_DIVISION).default(0),
      winStreak: z.number().int().min(0).default(0),
      fastestWinTurns: z.number().int().min(1).nullable().default(null),
      seasonWins: z.number().int().min(0).default(0),
      matches: z.number().int().min(0).default(0),
    })
    .default({}),
  pastSeasons: z.array(seasonSummarySchema).max(MAX_PAST_SEASONS).default([]),
  pending: pendingSchema.nullable().default(null),
});
export type RankedState = z.infer<typeof rankedSchema>;

export function createRanked(): RankedState {
  return rankedSchema.parse({});
}

export const isPlaced = (r: RankedState): boolean => r.placements >= PLACEMENT_MATCHES;

/** The division to show, or null while the season's placement matches are unfinished. */
export function shownDivision(r: RankedState): Division | null {
  return isPlaced(r) ? (DIVISIONS[r.division] ?? null) : null;
}

/** Which matchmaking tier the player faces, placed or not (uses the rating, not the shown division). */
export function matchmakingDivision(r: RankedState): number {
  return isPlaced(r) ? r.division : divisionIndexFor(r.rating);
}

// ------------------------------------------------------------- seasons

/** Seasons are calendar months in UTC: `2026-09`. (ADR-020) */
export function seasonIdFor(now: number): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** A new season keeps half of the distance from the starting rating, and asks for placements again. */
export function seasonStartRating(rating: number): number {
  return Math.max(0, RANKED_START_RATING + Math.trunc((rating - RANKED_START_RATING) / 2));
}

export interface Rollover {
  ranked: RankedState;
  rolledOver: boolean;
  /** The finished season, when it had any matches. */
  archived?: SeasonSummary;
}

/** Brings the ladder into the current season, archiving the last one. The same call, made twice, changes nothing the second time. */
export function rollSeason(r: RankedState, now: number): Rollover {
  const current = seasonIdFor(now);
  if (r.season === current) return { ranked: r, rolledOver: false };
  if (r.season === "") return { ranked: { ...r, season: current }, rolledOver: false };

  const played = r.wins + r.losses + r.draws;
  const archived: SeasonSummary | undefined =
    played > 0
      ? { season: r.season, placed: isPlaced(r), division: r.division, peakDivision: r.peakDivision, peakRating: r.peakRating, wins: r.wins, losses: r.losses, draws: r.draws, bestStreak: r.bestStreak }
      : undefined;
  const rating = seasonStartRating(r.rating);
  const division = divisionIndexFor(rating);
  const next: RankedState = {
    ...r,
    season: current,
    rating,
    division,
    placements: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    bestStreak: 0,
    peakRating: rating,
    peakDivision: 0,
    pastSeasons: archived ? [archived, ...r.pastSeasons].slice(0, MAX_PAST_SEASONS) : r.pastSeasons,
  };
  return { ranked: next, rolledOver: true, archived };
}

// ------------------------------------------------------------- rating math

/** The chance (in thousandths) that a player rated `rating` beats one rated `opponent`, on the standard Elo curve. */
export function expectedPermille(rating: number, opponent: number): number {
  return Math.round(1000 / (1 + 10 ** ((opponent - rating) / 400)));
}

/** Points gained or lost for one result. A win always earns at least 1 and a loss always costs at least 1; a draw pulls both sides toward parity. */
export function ratingChange(rating: number, opponent: number, result: RankedResult, k: number): number {
  const score = result === "win" ? 1000 : result === "draw" ? 500 : 0;
  const raw = Math.round((k * (score - expectedPermille(rating, opponent))) / 1000);
  if (result === "win") return Math.max(1, raw);
  if (result === "loss") return Math.min(-1, raw);
  return raw;
}

/** Promotion is immediate; demotion needs a real fall below the division's floor. */
export function settleDivision(current: number, rating: number): number {
  const target = divisionIndexFor(rating);
  if (target > current) return target;
  const floor = DIVISIONS[current]?.floor ?? 0;
  if (target < current && rating < floor - DEMOTION_BUFFER) return target;
  return current;
}

export interface RankedMatchInput {
  id: string;
  result: RankedResult;
  opponentRating: number;
  botLevel: string;
  team: readonly string[];
  foe: readonly string[];
  turns: number;
  forfeit?: boolean;
}

export interface RankedChange {
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  /** Shown divisions; null while in placements. */
  divisionBefore: Division | null;
  divisionAfter: Division | null;
  promoted: boolean;
  demoted: boolean;
  /** This match finished the placements. */
  placed: boolean;
  placementsLeft: number;
  seasonRolledOver: boolean;
  newBests: string[];
}

/** Applies one finished ranked match. Rolls the season first if the calendar moved on. */
export function applyRankedMatch(before: RankedState, match: RankedMatchInput, now: number): { ranked: RankedState; change: RankedChange } {
  const rolled = rollSeason(before, now);
  const r = rolled.ranked;
  const wasPlaced = isPlaced(r);
  const divisionBefore = shownDivision(r);

  const delta = ratingChange(r.rating, match.opponentRating, match.result, wasPlaced ? K_RANKED : K_PLACEMENT);
  let rating = Math.max(0, Math.min(MAX_RATING, r.rating + delta));
  const placements = r.placements + 1;
  const placedNow = !wasPlaced && placements >= PLACEMENT_MATCHES;

  let division = r.division;
  if (placedNow) {
    // Placement fixes the division from the rating, capped so it cannot start above Gold I.
    division = Math.min(PLACEMENT_CEILING, divisionIndexFor(rating));
    rating = Math.min(rating, DIVISIONS[PLACEMENT_CEILING + 1]!.floor - 1);
  } else if (wasPlaced) {
    division = settleDivision(r.division, rating);
  } else {
    division = divisionIndexFor(rating);
  }

  const streak = match.result === "win" ? (r.streak > 0 ? r.streak + 1 : 1) : match.result === "loss" ? (r.streak < 0 ? r.streak - 1 : -1) : 0;
  const wins = r.wins + (match.result === "win" ? 1 : 0);
  const won = match.result === "win";

  const usage = { ...r.usage };
  for (const id of match.team) {
    const u = usage[id] ?? { played: 0, won: 0 };
    usage[id] = { played: u.played + 1, won: u.won + (won ? 1 : 0) };
  }

  const placedAfter = wasPlaced || placedNow;
  const peakDivision = placedAfter ? Math.max(r.peakDivision, division) : r.peakDivision;
  const bests = { ...r.bests, matches: r.bests.matches + 1 };
  const newBests: string[] = [];
  if (rating > bests.rating) {
    if (bests.matches > 1) newBests.push("Highest rating");
    bests.rating = rating;
  }
  if (placedAfter && division > bests.division) {
    if (bests.matches > 1) newBests.push("Highest division");
    bests.division = division;
  }
  if (Math.max(0, streak) > bests.winStreak) {
    if (streak >= 3) newBests.push("Longest win streak");
    bests.winStreak = Math.max(0, streak);
  }
  if (won && match.turns >= 1 && (bests.fastestWinTurns === null || match.turns < bests.fastestWinTurns)) {
    if (bests.fastestWinTurns !== null) newBests.push("Fastest win");
    bests.fastestWinTurns = match.turns;
  }
  if (wins > bests.seasonWins) bests.seasonWins = wins;

  const record: RankedMatchRecord = {
    id: match.id,
    at: now,
    result: match.result,
    delta,
    division: placedAfter ? division : -1,
    botLevel: match.botLevel,
    team: [...match.team],
    foe: [...match.foe],
    turns: match.turns,
    forfeit: match.forfeit ?? false,
  };

  const ranked: RankedState = {
    ...r,
    pending: null,
    rating,
    division,
    placements,
    wins,
    losses: r.losses + (match.result === "loss" ? 1 : 0),
    draws: r.draws + (match.result === "draw" ? 1 : 0),
    streak,
    bestStreak: Math.max(r.bestStreak, Math.max(0, streak)),
    peakRating: Math.max(r.peakRating, rating),
    peakDivision,
    recent: [record, ...r.recent].slice(0, MAX_RECENT),
    usage,
    bests,
  };

  const divisionAfter = shownDivision(ranked);
  return {
    ranked,
    change: {
      ratingBefore: r.rating,
      ratingAfter: rating,
      delta: rating - r.rating,
      divisionBefore,
      divisionAfter,
      promoted: divisionBefore !== null && divisionAfter !== null && divisionAfter.index > divisionBefore.index,
      demoted: divisionBefore !== null && divisionAfter !== null && divisionAfter.index < divisionBefore.index,
      placed: placedNow,
      placementsLeft: Math.max(0, PLACEMENT_MATCHES - placements),
      seasonRolledOver: rolled.rolledOver,
      newBests,
    },
  };
}

// ------------------------------------------------------------- unfinished matches

/** Marks a match as begun. If it is never finished, the next visit counts it as a loss. */
export function beginRankedMatch(r: RankedState, pending: PendingRankedMatch, now: number): RankedState {
  return { ...rollSeason(r, now).ranked, pending };
}

/** Settles a match that was left unfinished as a loss. Returns null when nothing was pending. */
export function forfeitUnfinished(r: RankedState, now: number): { ranked: RankedState; change: RankedChange } | null {
  const p = r.pending;
  if (!p) return null;
  return applyRankedMatch(r, { id: p.id, result: "loss", opponentRating: p.opponentRating, botLevel: p.botLevel, team: p.team, foe: p.foe, turns: 0, forfeit: true }, now);
}

// ------------------------------------------------------------- display helpers

/** How close the player is to moving, without revealing the rating itself. */
export function standing(r: RankedState): "climbing" | "steady" | "at-risk" | "unplaced" {
  if (!isPlaced(r)) return "unplaced";
  const division = DIVISIONS[r.division];
  const next = DIVISIONS[r.division + 1];
  if (division && r.rating < division.floor + 25 && r.division > 0) return "at-risk";
  if (next && r.rating >= next.floor - 25) return "climbing";
  return "steady";
}

/** Most-played characters in ranked, most played first. */
export function usageRanking(r: RankedState, limit = 8): { id: string; played: number; won: number }[] {
  return Object.entries(r.usage)
    .map(([id, u]) => ({ id, ...u }))
    .sort((a, b) => b.played - a.played || b.won - a.won || a.id.localeCompare(b.id))
    .slice(0, limit);
}
