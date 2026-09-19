import { describe, expect, it } from "vitest";
import { decodeReplay, encodeReplay, MAX_REPLAY_LINK_CHARS, parseReplayFile, replayFileText } from "@veilbreak/persistence";
import { buildReplayRecord, runReplay } from "./replay";
import { playRealMatch } from "./testing";

function recorded(seed: number) {
  const outcome = playRealMatch(["tortuga-rex", "hydra", "malachar"], ["shiro", "koschei", "father-bell"], seed);
  const record = buildReplayRecord({
    id: `r-${seed}`,
    playedAt: 1,
    mode: "bot",
    seed,
    energyRules: outcome.energyRules!,
    teamAIds: ["tortuga-rex", "hydra", "malachar"],
    teamBIds: ["shiro", "koschei", "father-bell"],
    turns: outcome.turnLog!,
    winnerPlayerId: outcome.winnerPlayerId,
  });
  return { outcome, record };
}

describe("replays re-run the real engine (spec/02 determinism)", () => {
  it("playing a recording back reproduces the match exactly", () => {
    const { outcome, record } = recorded(21);
    const run = runReplay(record);
    expect(run.ok).toBe(true);
    if (!run.ok) return;
    expect(run.frames).toHaveLength(record.turns.length + 1);
    expect(run.winnerPlayerId).toBe(outcome.winnerPlayerId);
    expect(run.balanceMismatch).toBe(false);
    const final = run.frames[run.frames.length - 1]!.state;
    expect(JSON.stringify(final.eventLog)).toBe(JSON.stringify(outcome.eventLog));
  });

  it("replaying the same recording twice is identical", () => {
    const { record } = recorded(5);
    const a = runReplay(record);
    const b = runReplay(record);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("a different seed changes the match (the seed is part of the recording)", () => {
    const { record } = recorded(9);
    const other = runReplay({ ...record, seed: record.seed + 1 });
    const same = runReplay(record);
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(same));
  });

  it("a doctored action that is no longer legal is reported, not silently ignored", () => {
    const { record } = recorded(9);
    const bad = { ...record, turns: [{ a: [{ playerId: "playerA", characterId: "hydra", abilityId: "ability.nonexistent", targetIds: [] }], b: [] }] };
    const run = runReplay(bad);
    expect(run.ok).toBe(false);
    if (!run.ok) expect(run.error).toMatch(/Turn 1/);
  });

  it("replays a match that contains a Nameless One rewind faithfully (the rewound turn is recorded too)", () => {
    let found = false;
    for (let seed = 1; seed <= 120 && !found; seed += 1) {
      const teamA = ["the-nameless-one", "tortuga-rex", "hydra"];
      const teamB = ["shiro", "koschei", "father-bell"];
      const outcome = playRealMatch(teamA, teamB, seed);
      if (!outcome.eventLog?.some((e) => e.type === "turnRewound")) continue;
      found = true;
      const record = buildReplayRecord({ id: "rw", playedAt: 1, mode: "bot", seed, energyRules: outcome.energyRules!, teamAIds: teamA, teamBIds: teamB, turns: outcome.turnLog!, winnerPlayerId: outcome.winnerPlayerId });
      const run = runReplay(record);
      expect(run.ok).toBe(true);
      if (run.ok) expect(JSON.stringify(run.frames[run.frames.length - 1]!.state.eventLog)).toBe(JSON.stringify(outcome.eventLog));
    }
    expect(found).toBe(true);
  });

  it("survives the code, link and file formats", () => {
    const { record } = recorded(31);
    const viaCode = decodeReplay(encodeReplay(record));
    expect(viaCode.ok && JSON.stringify(runReplay(viaCode.replay))).toBe(JSON.stringify(runReplay(record)));
    const viaFile = parseReplayFile(replayFileText(record));
    expect(viaFile.ok && viaFile.replay).toEqual(record);
    // A short match fits in a link; a long one falls back to a file.
    const short = { ...record, turns: record.turns.slice(0, 3) };
    expect(encodeReplay(short).length).toBeLessThan(MAX_REPLAY_LINK_CHARS);
  });

  it("warns when the recording was made under different balance rules", () => {
    const { record } = recorded(9);
    const run = runReplay({ ...record, balanceVersionId: "phase-01-v0" });
    expect(run.ok && run.balanceMismatch).toBe(true);
  });
});
