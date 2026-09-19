import { botBan, afterBan, botLevelFor, buildBotDraft, createRandom, DRAFT_SIZE, META_POOL, opponentRating, usesPickBan, type BotLevel } from "@veilbreak/ai";
import { matchmakingDivision, type RankedState } from "@veilbreak/persistence";
import { PICKABLE_CHARACTERS, TEAM_SIZE } from "./roster";

// phase-11: turns the ladder's numbers into one concrete match. Pure and
// seeded, so the same seed and standing always give the same opponent.

export interface RankedPlan {
  seed: number;
  /** Which tier of bot the player meets (from their rating, also during placements). */
  divisionIndex: number;
  botLevel: BotLevel;
  opponentRating: number;
  /** Diamond and above: both sides bring four and each bans one of the other's. */
  pickBan: boolean;
  /** The bot's picks: three, or four when there is pick/ban. */
  botDraft: string[];
}

export function planRankedMatch(ranked: RankedState, seed: number): RankedPlan {
  const divisionIndex = matchmakingDivision(ranked);
  const pickBan = usesPickBan(divisionIndex);
  return {
    seed,
    divisionIndex,
    botLevel: botLevelFor(divisionIndex),
    opponentRating: opponentRating(ranked.rating, createRandom(seed ^ 0x5bd1e995)),
    pickBan,
    botDraft: buildBotDraft({
      divisionIndex,
      pool: PICKABLE_CHARACTERS,
      meta: META_POOL,
      random: createRandom(seed ^ 0x27d4eb2f),
      size: pickBan ? DRAFT_SIZE : TEAM_SIZE,
    }),
  };
}

export interface RankedTeams {
  teamAIds: string[];
  teamBIds: string[];
  /** The player's character the bot banned (pick/ban only). */
  banned?: string;
  /** The bot's character the player banned (pick/ban only). */
  playerBanned?: string;
}

/**
 * Settles the two teams. With pick/ban the player names one of the bot's four
 * and the bot (deterministically, by its skill) names one of the player's four.
 * Without it, the drafts are simply the teams.
 */
export function settleTeams(plan: RankedPlan, playerDraft: readonly string[], playerBan?: string): RankedTeams {
  if (!plan.pickBan) return { teamAIds: [...playerDraft], teamBIds: [...plan.botDraft] };
  if (playerBan === undefined || !plan.botDraft.includes(playerBan)) throw new Error("Choose one of the bot's four fighters to ban.");
  const banned = botBan(playerDraft, plan.botLevel, META_POOL, createRandom(plan.seed ^ 0x165667b1));
  return { teamAIds: afterBan(playerDraft, banned), teamBIds: afterBan(plan.botDraft, playerBan), banned, playerBanned: playerBan };
}
