import { PASSIVE_LIBRARY, TRANSFORMATION_LIBRARY, CHARACTER_LIBRARY, type BattleEvent, type Effect } from "@veilbreak/content";
import type { Profile } from "@veilbreak/persistence";

// phase-08 "Codex entries unlock from the player's own match event history":
// a finished match's battle log is the only input. Pure, so it is easy to test
// and can never be gamed from the UI.

export interface MatchSummary {
  teamAIds: readonly string[];
  teamBIds: readonly string[];
  /** playerA / playerB, or null for a draw. */
  winnerPlayerId: string | null;
  /** Which teams a human actually played (vs. bot: only A). Drives mastery and "recently played". */
  humanTeams: readonly ("A" | "B")[];
  eventLog: readonly BattleEvent[];
}

// The event a given effect kind leaves in the log. A passive is "seen" when one
// of these shows up with its holder as source or target.
const EVENT_FOR_EFFECT: Record<string, string> = {
  damage: "damageDealt",
  heal: "healed",
  applyStatus: "statusApplied",
  removeStatus: "statusRemoved",
  modifyResource: "resourceChanged",
  modifyEnergy: "energyModified",
  modifyCooldown: "cooldownModified",
  drainEnergy: "energyDrained",
  summon: "summonCreated",
  transformInto: "transformed",
  erase: "erased",
  resurrect: "resurrected",
  modifyRandomOutcome: "rngModifierQueued",
  retargetQueuedAction: "queuedActionRetargeted",
  rewindTurn: "turnRewound",
};

export function eventTypesOf(effects: readonly Effect[]): Set<string> {
  const types = new Set<string>();
  const visit = (list: readonly Effect[]): void => {
    for (const e of list) {
      const mapped = EVENT_FOR_EFFECT[e.kind];
      if (mapped) types.add(mapped);
      if (e.kind === "sequence") visit(e.effects);
      if (e.kind === "conditional") {
        visit(e.ifTrue);
        visit(e.ifFalse ?? []);
      }
      if (e.kind === "randomOutcome") e.outcome.branches.forEach((b) => visit(b.effects));
    }
  };
  visit(effects);
  return types;
}

function union(existing: readonly string[], added: Iterable<string>): string[] {
  return [...new Set([...existing, ...added])];
}

function bump(table: Record<string, Record<string, number>>, a: string, b: string): Record<string, Record<string, number>> {
  const row = table[a] ?? {};
  return { ...table, [a]: { ...row, [b]: (row[b] ?? 0) + 1 } };
}

export function applyMatchToProfile(profile: Profile, match: MatchSummary): Profile {
  const present = [...match.teamAIds, ...match.teamBIds];

  const abilities = new Set<string>();
  const transformations = new Set<string>();
  for (const event of match.eventLog) {
    if (event.type === "abilityUsed" && typeof event.payload?.abilityId === "string") abilities.add(event.payload.abilityId);
    if (event.type === "transformed" && typeof event.payload?.transformationId === "string") {
      const t = TRANSFORMATION_LIBRARY[event.payload.transformationId];
      if (t) transformations.add(t.id);
    }
  }

  // A passive is met once its holder is in the match and one of the outcomes
  // its effects produce is logged for that holder.
  const passives = new Set<string>();
  for (const characterId of present) {
    const passiveId = CHARACTER_LIBRARY[characterId]?.passiveId;
    const passive = passiveId ? PASSIVE_LIBRARY[passiveId] : undefined;
    if (!passive) continue;
    const wanted = eventTypesOf(passive.effects);
    if (match.eventLog.some((e) => wanted.has(e.type) && (e.sourceId === characterId || e.targetId === characterId))) passives.add(passive.id);
  }

  const humanIds = match.humanTeams.flatMap((t) => (t === "A" ? match.teamAIds : match.teamBIds));
  const played = { ...profile.played };
  for (const id of humanIds) played[id] = (played[id] ?? 0) + 1;
  const recent = union([...humanIds].reverse(), profile.recent).slice(0, 12);

  let beat = profile.beat;
  let wonWith = profile.wonWith;
  if (match.winnerPlayerId) {
    const winners = match.winnerPlayerId === "playerA" ? match.teamAIds : match.teamBIds;
    const losers = match.winnerPlayerId === "playerA" ? match.teamBIds : match.teamAIds;
    for (const w of winners) {
      for (const l of losers) beat = bump(beat, w, l);
      for (const mate of winners) if (mate !== w) wonWith = bump(wonWith, w, mate);
    }
  }

  return {
    ...profile,
    discovered: {
      characters: union(profile.discovered.characters, present),
      abilities: union(profile.discovered.abilities, abilities),
      passives: union(profile.discovered.passives, passives),
      transformations: union(profile.discovered.transformations, transformations),
    },
    played,
    recent,
    beat,
    wonWith,
    matchesPlayed: profile.matchesPlayed + 1,
  };
}
