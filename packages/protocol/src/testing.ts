import {
  ABILITY_LIBRARY,
  CHARACTER_LIBRARY,
  PASSIVE_LIBRARY,
  PLAYABLE_CHARACTERS,
  RESOURCE_LIBRARY,
  STATUS_LIBRARY,
  SUMMON_LIBRARY,
  TRANSFORMATION_LIBRARY,
  defaultEnergyRules,
  defaultMatchFormat,
  defaultResolutionOrder,
} from "@veilbreak/content";
import { createRandom, decideActions } from "@veilbreak/ai";
import type { RuleSet } from "./crypto-rules";
import type { RandomBytes } from "./hash";
import { chooseActions, outgoingCode, receive, statusOf, type Session } from "./session";

// Test helpers (not exported from index.ts).

export function realRules(overrides: Partial<RuleSet> = {}): RuleSet {
  return {
    balanceVersionId: "test-balance",
    deps: {
      abilities: ABILITY_LIBRARY,
      resolutionOrder: defaultResolutionOrder,
      energyRules: defaultEnergyRules,
      statusLibrary: STATUS_LIBRARY,
      passives: PASSIVE_LIBRARY,
      summonLibrary: SUMMON_LIBRARY,
      transformationLibrary: TRANSFORMATION_LIBRARY,
      resourceLibrary: RESOURCE_LIBRARY,
    },
    characters: CHARACTER_LIBRARY,
    matchFormat: defaultMatchFormat,
    playableIds: PLAYABLE_CHARACTERS.map((c) => c.id),
    ...overrides,
  };
}

/** Deterministic "secret" bytes so a test can be reproduced. Never used outside tests. */
export function seededBytes(seed: number): RandomBytes {
  const next = createRandom(seed);
  return (length) => Uint8Array.from({ length }, () => Math.floor(next() * 256));
}

export const HOST_TEAM = ["tortuga-rex", "hydra", "malachar"];
export const GUEST_TEAM = ["shiro", "koschei", "father-bell"];

export function must<T>(result: { ok: true; session: T } | { ok: false; problem: { detail: string } }): T {
  if (!result.ok) throw new Error(`expected success, got: ${result.problem.detail}`);
  return result.session;
}

/** Hands `from`'s current outgoing code to `to`. */
export async function deliver(from: Session, to: Session, rules: RuleSet): Promise<Session> {
  return must(await receive(to, outgoingCode(from), rules));
}

/** Picks bot actions for `session`'s side of the current position. */
export function botActions(session: Session, rules: RuleSet, seed: number) {
  const state = session.state!;
  return decideActions("INTERMEDIATE", state, session.role, { deps: rules.deps, random: createRandom(seed) }).map((a) => ({
    characterId: a.characterId,
    abilityId: a.abilityId,
    targetIds: a.targetIds,
  }));
}

/** Plays a full match by exchanging nothing but codes. Returns both final sessions. */
export async function playByCodes(host: Session, guest: Session, rules: RuleSet, maxRounds = 400) {
  let h = host;
  let g = guest;
  for (let round = 0; round < maxRounds && !(h.phase === "over" && g.phase === "over"); round += 1) {
    if (statusOf(h) === "your-move") h = must(await chooseActions(h, botActions(h, rules, round * 2 + 1), rules, seededBytes(1000 + round)));
    if (statusOf(g) === "your-move") g = must(await chooseActions(g, botActions(g, rules, round * 2 + 2), rules, seededBytes(5000 + round)));
    g = await deliver(h, g, rules);
    h = await deliver(g, h, rules);
  }
  // One last exchange so both sides have seen each other's final state hash.
  g = await deliver(h, g, rules);
  h = await deliver(g, h, rules);
  return { host: h, guest: g };
}
