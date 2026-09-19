import { ABILITY_LIBRARY, CHARACTER_LIBRARY, TRANSFORMATION_LIBRARY } from "@veilbreak/content";
import type { HistoryEntry, ReplayRecord } from "@veilbreak/persistence";
import { runReplay } from "./replay";

// spec/06 "Analytics (local only)": personal stats from the player's own match
// history. Nothing here leaves the device, and there is no aggregate data:
// every number is about this player's matches only.

export interface Tally {
  id: string;
  played: number;
  won: number;
}

export interface PlayerStats {
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  /** Win rate by each character the player used. */
  byCharacter: Tally[];
  /** Win rate by exact team (ids sorted and joined with "|"). */
  byTeam: Tally[];
  /** Win rate against each character the player faced. */
  byOpponent: Tally[];
}

export interface AbilityStats {
  /** Matches whose replay was read. */
  replaysRead: number;
  abilities: { id: string; uses: number }[];
  transformations: { id: string; count: number }[];
}

const sideOf = (entry: Pick<HistoryEntry, "mode" | "humanSide">): "A" | "B" | null => (entry.mode === "hotseat" ? null : (entry.humanSide ?? "A"));

function bump(map: Map<string, Tally>, id: string, won: boolean) {
  const t = map.get(id) ?? { id, played: 0, won: 0 };
  t.played += 1;
  if (won) t.won += 1;
  map.set(id, t);
}

const order = (map: Map<string, Tally>): Tally[] => [...map.values()].sort((a, b) => b.played - a.played || b.won - a.won || a.id.localeCompare(b.id));

/** Hotseat matches are left out: two people share the device, so there is no single "you". */
export function historyStats(history: readonly HistoryEntry[]): PlayerStats {
  const byCharacter = new Map<string, Tally>();
  const byTeam = new Map<string, Tally>();
  const byOpponent = new Map<string, Tally>();
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let matches = 0;
  for (const entry of history) {
    const side = sideOf(entry);
    if (!side) continue;
    const mine = side === "A" ? entry.teamAIds : entry.teamBIds;
    const theirs = side === "A" ? entry.teamBIds : entry.teamAIds;
    const myId = side === "A" ? "playerA" : "playerB";
    matches += 1;
    const won = entry.winnerPlayerId === myId;
    if (entry.winnerPlayerId === null) draws += 1;
    else if (won) wins += 1;
    else losses += 1;
    for (const id of mine) bump(byCharacter, id, won);
    bump(byTeam, [...mine].sort().join("|"), won);
    for (const id of theirs) bump(byOpponent, id, won);
  }
  return { matches, wins, losses, draws, byCharacter: order(byCharacter), byTeam: order(byTeam), byOpponent: order(byOpponent) };
}

/** Favourite abilities and transformation counts come from re-running the stored replays (the newest few). */
export function abilityStats(history: readonly HistoryEntry[], replays: readonly ReplayRecord[]): AbilityStats {
  const uses = new Map<string, number>();
  const transformed = new Map<string, number>();
  let replaysRead = 0;
  for (const replay of replays) {
    const entry = history.find((h) => h.replayId === replay.id);
    const side = sideOf(entry ?? { mode: replay.mode, humanSide: undefined });
    if (!side) continue;
    const run = runReplay(replay);
    if (!run.ok) continue;
    replaysRead += 1;
    const mine = new Set(side === "A" ? replay.teamAIds : replay.teamBIds);
    for (const frame of run.frames) {
      for (const event of frame.events) {
        if (!event.sourceId || !mine.has(event.sourceId)) continue;
        if (event.type === "abilityUsed" && typeof event.payload?.abilityId === "string") uses.set(event.payload.abilityId, (uses.get(event.payload.abilityId) ?? 0) + 1);
        if (event.type === "transformed" && typeof event.payload?.transformationId === "string") transformed.set(event.payload.transformationId, (transformed.get(event.payload.transformationId) ?? 0) + 1);
      }
    }
  }
  const sorted = <T extends { id: string }>(rows: T[], key: (r: T) => number) => rows.sort((a, b) => key(b) - key(a) || a.id.localeCompare(b.id));
  return {
    replaysRead,
    abilities: sorted([...uses].map(([id, n]) => ({ id, uses: n })), (r) => r.uses),
    transformations: sorted([...transformed].map(([id, n]) => ({ id, count: n })), (r) => r.count),
  };
}

export const characterName = (id: string): string => CHARACTER_LIBRARY[id]?.displayName ?? id;
export const abilityName = (id: string): string => ABILITY_LIBRARY[id]?.displayName ?? id;
export const transformationName = (id: string): string => {
  const t = TRANSFORMATION_LIBRARY[id];
  return t ? `${characterName(t.characterId)}: ${t.changes.displayName ?? t.toStageId}` : id;
};
export const percent = (won: number, played: number): number => (played === 0 ? 0 : Math.round((won / played) * 100));
