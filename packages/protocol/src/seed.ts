import { sha256Hex } from "./hash";

// spec/06: "The seed is derived from both contributions using commit-reveal,
// so neither player controls the RNG." The host commits to its contribution
// first; the guest then picks its own without knowing the host's; the host
// reveals. Neither can steer the result: the host cannot change its
// contribution after committing, and the guest chose blind.

export const seedCommitment = (matchId: string, contribution: string, salt: string): Promise<string> =>
  sha256Hex(`veilbreak/seed-commit/v1|${matchId}|${contribution}|${salt}`);

/** A 32-bit match seed from both contributions (the engine's RNG state is 32 bits). */
export async function deriveSeed(matchId: string, hostContribution: string, guestContribution: string): Promise<number> {
  const digest = await sha256Hex(`veilbreak/seed/v1|${matchId}|${hostContribution}|${guestContribution}`);
  return Number.parseInt(digest.slice(0, 8), 16) >>> 0;
}

export const turnCommitment = (matchId: string, step: number, role: string, actionsJson: string, salt: string): Promise<string> =>
  sha256Hex(`veilbreak/turn-commit/v1|${matchId}|${step}|${role}|${actionsJson}|${salt}`);

/** Both players' per-turn salts, combined. Neither knows the other's until the reveal. */
export const mixSalts = (matchId: string, step: number, saltA: string, saltB: string): Promise<string> =>
  sha256Hex(`veilbreak/turn-salt/v1|${matchId}|${step}|${saltA}|${saltB}`);

/**
 * Mixes the turn's combined salt into the RNG stream before the turn resolves,
 * so future rolls cannot be precomputed from the initial seed alone. Pure and
 * deterministic: both clients compute the same next state.
 */
export async function mixRngState(rngState: string, mixedSalt: string): Promise<string> {
  const digest = await sha256Hex(`veilbreak/rng-mix/v1|${rngState}|${mixedSalt}`);
  return String(Number.parseInt(digest.slice(0, 8), 16) >>> 0);
}
