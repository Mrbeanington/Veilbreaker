import { describe, expect, it } from "vitest";
import { resolveTurn, createBattle } from "@veilbreak/engine";
import { defaultMatchFormat } from "@veilbreak/content";
import {
  BUNDLE_PREFIX,
  canonicalJson,
  chooseActions,
  contentHash,
  createHost,
  decodeBundle,
  deriveSeed,
  encodeBundle,
  hasUnsent,
  joinFromInvite,
  mixRngState,
  mixSalts,
  outgoingCode,
  receive,
  replaySource,
  resign,
  seedCommitment,
  sha256Hex,
  stateHash,
  statusOf,
  turnCommitment,
  type Action,
  type Bundle,
  type Session,
} from "./index";
import { GUEST_TEAM, HOST_TEAM, botActions, deliver, must, playByCodes, realRules, seededBytes } from "./testing";

const rules = realRules();

async function startedPair(unlockRule: "own" | "all" = "all") {
  const host0 = must(await createHost(rules, { team: HOST_TEAM, unlockRule }, seededBytes(1)));
  const guest = must(await joinFromInvite(rules, outgoingCode(host0), GUEST_TEAM, seededBytes(2)));
  const host = await deliver(guest, host0, rules);
  const guestPlaying = await deliver(host, guest, rules);
  return { host, guest: guestPlaying };
}

describe("hashing and canonical form", () => {
  it("SHA-256 matches the published test vector", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("canonical JSON ignores key order", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: [3, { y: 1, x: 2 }] } })).toBe(canonicalJson({ a: { c: [3, { x: 2, y: 1 }], d: 2 }, b: 1 }));
  });

  it("the content hash changes when any rule changes, so a modified game cannot join", async () => {
    const base = await contentHash(rules);
    expect(await contentHash(rules)).toBe(base);
    const tweaked = realRules({ deps: { ...rules.deps, abilities: { ...rules.deps.abilities, "ability.hydra.serpent-bite": { ...rules.deps.abilities["ability.hydra.serpent-bite"]!, cooldown: 9 } } } });
    expect(await contentHash(tweaked)).not.toBe(base);
    expect(await contentHash(realRules({ balanceVersionId: "another" }))).not.toBe(base);
  });
});

describe("two clients complete a full match purely by exchanging codes", () => {
  it("reach the same result and identical final state hashes", async () => {
    const { host, guest } = await startedPair();
    const done = await playByCodes(host, guest, rules);
    expect(done.host.phase).toBe("over");
    expect(done.guest.phase).toBe("over");
    expect(done.host.result).toEqual(done.guest.result);
    expect(done.host.steps.length).toBeGreaterThan(3);
    expect(await stateHash(done.host.state!)).toBe(await stateHash(done.guest.state!));
    expect(done.host.hashes[String(done.host.steps.length)]).toBe(done.guest.hashes[String(done.guest.steps.length)]);
    // Every intermediate turn's hash matched too (a mismatch would have been fatal).
    for (const [step, hash] of Object.entries(done.host.hashes)) expect(done.guest.hashes[step]).toBe(hash);
    expect(done.host.problem).toBeUndefined();
    expect(done.guest.problem).toBeUndefined();
  });

  it("a clean match never carries a secret to the other side before the reveal", async () => {
    const { host, guest } = await startedPair();
    const h1 = must(await chooseActions(host, botActions(host, rules, 1), rules, seededBytes(7)));
    const decoded = decodeBundle(outgoingCode(h1));
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    const types = decoded.bundle.msgs.map((m) => (m.type === "reveal" ? `reveal:${m.kind}` : m.type));
    expect(types).not.toContain("reveal:turn"); // first committer must not reveal yet
    expect(types.filter((t) => t === "commit")).toHaveLength(1);
    void guest;
  });

  it("is asynchronous: sessions survive being saved as JSON and restored between turns", async () => {
    let { host, guest } = await startedPair();
    for (let round = 0; round < 6; round += 1) {
      host = JSON.parse(JSON.stringify(host)) as Session; // "close the tab" and reopen
      guest = JSON.parse(JSON.stringify(guest)) as Session;
      if (statusOf(host) === "your-move") host = must(await chooseActions(host, botActions(host, rules, round + 10), rules, seededBytes(100 + round)));
      guest = await deliver(host, guest, rules);
      if (statusOf(guest) === "your-move") guest = must(await chooseActions(guest, botActions(guest, rules, round + 50), rules, seededBytes(200 + round)));
      host = await deliver(guest, host, rules);
      guest = await deliver(host, guest, rules);
    }
    expect(host.steps.length).toBeGreaterThan(0);
    expect(host.steps.length).toBe(guest.steps.length);
    expect(host.hashes[String(host.steps.length)]).toBe(guest.hashes[String(guest.steps.length)]);
  });

  it("sending the same code twice is harmless", async () => {
    const { host, guest } = await startedPair();
    const h = must(await chooseActions(host, botActions(host, rules, 3), rules, seededBytes(9)));
    const once = await deliver(h, guest, rules);
    const twice = await deliver(h, once, rules);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it("a code that skips a message is refused until the missing one arrives, and nothing changes", async () => {
    const { host, guest } = await startedPair();
    const gap: Bundle = { v: 1, match: host.matchId, from: "playerB", start: host.received + 5, ack: 0, msgs: [{ type: "resign", step: 0 }] };
    const result = await receive(host, encodeBundle(gap), rules);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("outOfOrder");
      expect(result.problem.fatal).toBe(false);
      expect(result.session).toBe(host);
    }
    void guest;
  });

  it("resigning ends the match for both sides", async () => {
    const { host, guest } = await startedPair();
    const resigned = must(await resign(guest));
    expect(resigned.result).toEqual({ winner: "playerA", reason: "resign" });
    const hostAfter = await deliver(resigned, host, rules);
    expect(hostAfter.phase).toBe("over");
    expect(hostAfter.result).toEqual({ winner: "playerA", reason: "resign" });
    expect(hasUnsent(resigned)).toBe(true);
  });

  it("the finished match can be replayed exactly from the recorded steps and RNG states", async () => {
    const { host, guest } = await startedPair();
    const done = await playByCodes(host, guest, rules);
    const source = replaySource(done.host)!;
    let state = createBattle([{ playerId: "playerA", characters: source.teamAIds.map((id) => charInput(id)) }, { playerId: "playerB", characters: source.teamBIds.map((id) => charInput(id)) }], source.seed, {
      balanceVersionId: rules.balanceVersionId,
      matchFormat: defaultMatchFormat,
      energyRules: rules.deps.energyRules,
    });
    for (const step of source.steps) {
      const r = resolveTurn({ ...state, rngState: step.rng }, step.a.map((a) => ({ playerId: "playerA", ...a })), step.b.map((a) => ({ playerId: "playerB", ...a })), rules.deps);
      if (!r.ok) throw new Error("replay turn illegal");
      state = r.state;
    }
    expect(await stateHash(state)).toBe(await stateHash(done.host.state!));
  });
});

function charInput(id: string) {
  const def = rules.characters[id]!;
  return { characterId: id, maxHp: def.baseHp, abilityIds: def.abilityIds, passiveId: def.passiveId, tags: def.tags, resources: Object.fromEntries(def.resources.map((r) => [r.id, r.startingValue])) };
}

describe("commit-reveal: a wrong reveal is rejected", () => {
  /** Rebuilds a code with one message replaced, keeping the bundle otherwise valid. */
  function tamper(code: string, edit: (msgs: Bundle["msgs"]) => Bundle["msgs"]): string {
    const decoded = decodeBundle(code);
    if (!decoded.ok) throw new Error("bad code");
    return encodeBundle({ ...decoded.bundle, msgs: edit(decoded.bundle.msgs) });
  }

  it("a turn reveal that differs from the commitment is fatal", async () => {
    const { host, guest } = await startedPair();
    const h = must(await chooseActions(host, botActions(host, rules, 3), rules, seededBytes(9)));
    const g0 = await deliver(h, guest, rules);
    const g = must(await chooseActions(g0, botActions(g0, rules, 4), rules, seededBytes(10)));
    // The guest (second committer) reveals immediately. A cheating guest swaps the action after committing.
    const forged = tamper(outgoingCode(g), (msgs) =>
      msgs.map((m) => (m.type === "reveal" && m.kind === "turn" ? { ...m, actions: m.actions.slice(0, -1) } : m)),
    );
    const result = await receive(h, forged, rules);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("wrongReveal");
      expect(result.problem.fatal).toBe(true);
      expect(result.session.phase).toBe("failed");
    }
  });

  it("a reveal with the wrong salt is rejected", async () => {
    const { host, guest } = await startedPair();
    const h = must(await chooseActions(host, botActions(host, rules, 3), rules, seededBytes(9)));
    const g0 = await deliver(h, guest, rules);
    const g = must(await chooseActions(g0, botActions(g0, rules, 4), rules, seededBytes(10)));
    const forged = tamper(outgoingCode(g), (msgs) => msgs.map((m) => (m.type === "reveal" && m.kind === "turn" ? { ...m, salt: "0".repeat(64) } : m)));
    const result = await receive(h, forged, rules);
    expect(!result.ok && result.problem.code).toBe("wrongReveal");
  });

  it("revealing without committing first is rejected", async () => {
    const { host } = await startedPair();
    const forged: Bundle = {
      v: 1,
      match: host.matchId,
      from: "playerB",
      start: host.received,
      ack: 0,
      msgs: [{ type: "reveal", kind: "turn", step: 0, actions: [], salt: "ef".repeat(32) }],
    };
    const result = await receive(host, encodeBundle(forged), rules);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("wrongReveal");
      expect(result.problem.fatal).toBe(true);
    }
  });

  it("a host cannot change its seed after committing", async () => {
    const host0 = must(await createHost(rules, { team: HOST_TEAM, unlockRule: "all" }, seededBytes(1)));
    const guest = must(await joinFromInvite(rules, outgoingCode(host0), GUEST_TEAM, seededBytes(2)));
    const host = await deliver(guest, host0, rules);
    const forged = tamper(outgoingCode(host), (msgs) => msgs.map((m) => (m.type === "reveal" && m.kind === "seed" ? { ...m, seedContribution: "ab".repeat(32) } : m)));
    const result = await receive(guest, forged, rules);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("wrongReveal");
      expect(result.session.phase).toBe("failed");
    }
  });

  it("an illegal action smuggled in under a valid commitment is rejected", async () => {
    const { host, guest } = await startedPair();
    const h = must(await chooseActions(host, botActions(host, rules, 3), rules, seededBytes(9)));
    const g0 = await deliver(h, guest, rules);
    const bogus: Action[] = [{ characterId: "shiro", abilityId: "ability.shiro.final-stroke", targetIds: ["tortuga-rex"] }];
    const salt = "cd".repeat(32);
    const commitment = await turnCommitment(g0.matchId, 0, "playerB", canonicalJson(bogus), salt);
    const forged: Bundle = {
      v: 1,
      match: g0.matchId,
      from: "playerB",
      start: g0.peerAck,
      ack: g0.received,
      msgs: [
        ...g0.outbox.slice(g0.peerAck),
        { type: "commit", step: 0, commitment },
        { type: "reveal", kind: "turn", step: 0, actions: bogus.concat([{ characterId: "shiro", abilityId: "ability.shiro.ink-slash", targetIds: ["hydra"] }]), salt },
      ],
    };
    // A second action for the same fighter (and a wrong commitment) is caught either way.
    const result = await receive(h, encodeBundle(forged), rules);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(["wrongReveal", "illegalAction"]).toContain(result.problem.code);
  });
});

describe("a player cannot bias the seed", () => {
  it("the commitment hides the contribution and binds it", async () => {
    const c = "11".repeat(32);
    const a = await seedCommitment("m".repeat(16), c, "aa".repeat(32));
    const b = await seedCommitment("m".repeat(16), c, "bb".repeat(32));
    expect(a).not.toContain(c);
    expect(a).not.toBe(b); // same contribution, different salt: nothing can be learned by guessing contributions
    expect(await seedCommitment("m".repeat(16), c, "aa".repeat(32))).toBe(a);
    expect(await seedCommitment("m".repeat(16), "22".repeat(32), "aa".repeat(32))).not.toBe(a); // binding
  });

  it("the seed depends on both contributions, so neither side alone controls it", async () => {
    const m = "0123456789abcdef";
    const base = await deriveSeed(m, "aa".repeat(32), "bb".repeat(32));
    expect(await deriveSeed(m, "ac".repeat(32), "bb".repeat(32))).not.toBe(base);
    expect(await deriveSeed(m, "aa".repeat(32), "bc".repeat(32))).not.toBe(base);
    expect(await deriveSeed("fedcba9876543210", "aa".repeat(32), "bb".repeat(32))).not.toBe(base);
  });

  it("a guest who grinds contributions still gets an unpredictable spread of seeds", async () => {
    // The guest never learns the host's contribution before choosing, so grinding buys nothing:
    // for a fixed unknown host value the outcomes are spread across the seed space.
    const host = "5a".repeat(32);
    const seeds = new Set<number>();
    let high = 0;
    for (let i = 0; i < 200; i += 1) {
      const s = await deriveSeed("0123456789abcdef", host, i.toString(16).padStart(64, "0"));
      seeds.add(s);
      if (s >= 0x80000000) high += 1;
    }
    expect(seeds.size).toBe(200);
    expect(high).toBeGreaterThan(60);
    expect(high).toBeLessThan(140);
  });

  it("the host reveals only after the guest has committed to its contribution", async () => {
    const host0 = must(await createHost(rules, { team: HOST_TEAM, unlockRule: "all" }, seededBytes(1)));
    const first = decodeBundle(outgoingCode(host0));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.bundle.msgs.map((m) => m.type)).toEqual(["setup"]); // the invite has a commitment but no reveal
    const setup = first.bundle.msgs[0]!;
    expect(setup.type === "setup" && setup.seedCommit).toBeTruthy();
    expect(setup.type === "setup" && setup.seedContribution).toBeUndefined();
  });

  it("per-turn salts are mixed into the RNG, so different salts give different futures", async () => {
    const s1 = await mixSalts("0123456789abcdef", 0, "aa".repeat(32), "bb".repeat(32));
    const s2 = await mixSalts("0123456789abcdef", 0, "aa".repeat(32), "bc".repeat(32));
    expect(s1).not.toBe(s2);
    const r1 = await mixRngState("12345", s1);
    const r2 = await mixRngState("12345", s2);
    expect(r1).not.toBe(r2);
    expect(await mixRngState("12345", s1)).toBe(r1);
    // And every turn draws a fresh mix even with identical salts.
    expect(await mixSalts("0123456789abcdef", 1, "aa".repeat(32), "bb".repeat(32))).not.toBe(s1);
  });

  it("two matches with identical choices but different salts diverge (rolls cannot be precomputed)", async () => {
    const run = async (saltSeed: number) => {
      const host0 = must(await createHost(rules, { team: HOST_TEAM, unlockRule: "all" }, seededBytes(1)));
      const guest0 = must(await joinFromInvite(rules, outgoingCode(host0), GUEST_TEAM, seededBytes(2)));
      let host = await deliver(guest0, host0, rules);
      let guest = await deliver(host, guest0, rules);
      host = must(await chooseActions(host, botActions(host, rules, 3), rules, seededBytes(saltSeed)));
      guest = await deliver(host, guest, rules);
      guest = must(await chooseActions(guest, botActions(guest, rules, 4), rules, seededBytes(saltSeed + 1)));
      host = await deliver(guest, host, rules);
      return host.steps[0]?.rng;
    };
    expect(await run(10)).toBeDefined();
    expect(await run(10)).toBe(await run(10));
    expect(await run(10)).not.toBe(await run(20));
  });
});

describe("tampering is detected", () => {
  it("a client whose state was edited is flagged as a desync on the next exchange", async () => {
    let { host, guest } = await startedPair();
    host = must(await chooseActions(host, botActions(host, rules, 3), rules, seededBytes(9)));
    guest = await deliver(host, guest, rules);
    guest = must(await chooseActions(guest, botActions(guest, rules, 4), rules, seededBytes(10)));
    host = await deliver(guest, host, rules);
    guest = await deliver(host, guest, rules); // both resolved turn 1; hashes agree
    expect(host.steps.length).toBe(1);
    expect(guest.steps.length).toBe(1);

    // The guest edits their own state (gives their fighter more health), then plays on.
    const cheat: Session = JSON.parse(JSON.stringify(guest));
    const firstId = cheat.myTeam[0]!;
    cheat.state!.characters[firstId]!.currentHp += 500;
    cheat.hashes["1"] = await stateHash(cheat.state!);

    const result = await receive(host, outgoingCode(cheat), rules);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("desync");
      expect(result.problem.fatal).toBe(true);
      expect(result.session.phase).toBe("failed");
    }
  });

  it("a tampered state that stays hidden until later is still caught when the hashes are next compared", async () => {
    let { host, guest } = await startedPair();
    for (let round = 0; round < 2; round += 1) {
      host = must(await chooseActions(host, botActions(host, rules, round + 3), rules, seededBytes(30 + round)));
      guest = await deliver(host, guest, rules);
      guest = must(await chooseActions(guest, botActions(guest, rules, round + 9), rules, seededBytes(40 + round)));
      host = await deliver(guest, host, rules);
      guest = await deliver(host, guest, rules);
    }
    // Corrupt only the host's stored hash for a past step: a later comparison of that step must fail.
    const bad: Session = JSON.parse(JSON.stringify(host));
    bad.hashes["1"] = "0".repeat(64);
    const forgedBundle = decodeBundle(outgoingCode(guest));
    expect(forgedBundle.ok).toBe(true);
    if (!forgedBundle.ok) return;
    const stale = encodeBundle({ ...forgedBundle.bundle, sh: { step: 1, hash: guest.hashes["1"]! } });
    const result = await receive(bad, stale, rules);
    expect(!result.ok && result.problem.code).toBe("desync");
  });

  it("clients running different rules cannot start a match (content hash handshake)", async () => {
    const host0 = must(await createHost(rules, { team: HOST_TEAM, unlockRule: "all" }, seededBytes(1)));
    const other = realRules({ deps: { ...rules.deps, abilities: { ...rules.deps.abilities, "ability.hydra.serpent-bite": { ...rules.deps.abilities["ability.hydra.serpent-bite"]!, cooldown: 9 } } } });
    const result = await joinFromInvite(other, outgoingCode(host0), GUEST_TEAM, seededBytes(2));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("handshake");
      expect(result.problem.detail).toMatch(/different versions/i);
    }
  });

  it("a different balance version cannot start a match either", async () => {
    const host0 = must(await createHost(rules, { team: HOST_TEAM, unlockRule: "all" }, seededBytes(1)));
    const result = await joinFromInvite(realRules({ balanceVersionId: "newer" }), outgoingCode(host0), GUEST_TEAM, seededBytes(2));
    expect(!result.ok && result.problem.code).toBe("handshake");
  });

  it("teams with unknown, duplicate or missing fighters are refused", async () => {
    for (const team of [["tortuga-rex", "hydra"], ["tortuga-rex", "tortuga-rex", "hydra"], ["tortuga-rex", "hydra", "not-a-fighter"]]) {
      const r = await createHost(rules, { team, unlockRule: "all" }, seededBytes(1));
      expect(!r.ok && r.problem.code).toBe("invalidTeam");
    }
  });

  it("an illegal choice is refused locally and never sent", async () => {
    const { host } = await startedPair();
    const r = await chooseActions(host, [{ characterId: "hydra", abilityId: "ability.shiro.ink-slash", targetIds: ["shiro"] }], rules, seededBytes(1));
    expect(!r.ok && r.problem.code).toBe("illegalChoice");
    const twice = await chooseActions(host, [{ characterId: "hydra", abilityId: "ability.hydra.serpent-bite", targetIds: ["shiro"] }, { characterId: "hydra", abilityId: "ability.hydra.serpent-bite", targetIds: ["shiro"] }], rules, seededBytes(1));
    expect(!twice.ok).toBe(true);
  });
});

describe("malformed codes fail gracefully", () => {
  const junk = [
    "",
    "   ",
    "hello",
    BUNDLE_PREFIX,
    `${BUNDLE_PREFIX}!!!!`,
    `${BUNDLE_PREFIX}AAAA`,
    "VB1.notamatchcode",
    "x".repeat(50_000),
    `${BUNDLE_PREFIX}${"A".repeat(30_000)}`,
    "{}",
    '{"v":1}',
    "null",
  ];

  it("never throws and always explains in plain words", async () => {
    const { host } = await startedPair();
    for (const code of junk) {
      const decoded = decodeBundle(code);
      expect(decoded.ok).toBe(false);
      const r = await receive(host, code, rules);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.problem.fatal).toBe(false);
        expect(r.problem.detail).not.toMatch(/undefined|TypeError|JSON/);
        expect(r.session).toBe(host);
      }
      const j = await joinFromInvite(rules, code, GUEST_TEAM, seededBytes(1));
      expect(j.ok).toBe(false);
    }
  });

  it("a truncated or bit-flipped real code is rejected", async () => {
    const { host } = await startedPair();
    const code = outgoingCode(host);
    const flipped = code.slice(0, 30) + (code[30] === "A" ? "B" : "A") + code.slice(31);
    for (const bad of [code.slice(0, code.length - 12), flipped]) {
      expect((await receive(host, bad, rules)).ok).toBe(false);
    }
  });

  it("a code from another match, or your own code, is not applied", async () => {
    const a = await startedPair();
    const otherHost = must(await createHost(rules, { team: HOST_TEAM, unlockRule: "all" }, seededBytes(99)));
    const foreign = await receive(a.host, outgoingCode(otherHost), rules);
    expect(!foreign.ok && foreign.problem.code).toBe("wrongMatch");
    const mine = await receive(a.host, outgoingCode(a.host), rules);
    expect(!mine.ok && mine.problem.code).toBe("wrongMatch");
  });

  it("a well-formed bundle with hostile field values is rejected by the schema", () => {
    const evil = encodeBundle({ v: 1, match: "0123456789abcdef", from: "playerA", start: 0, ack: 0, msgs: [{ type: "resign", step: 0 }] });
    expect(decodeBundle(evil).ok).toBe(true);
    const tooManyMessages = { v: 1, match: "0123456789abcdef", from: "playerA", start: 0, ack: 0, msgs: Array.from({ length: 200 }, () => ({ type: "resign", step: 0 })) };
    // Encode with the same packer the real code uses, bypassing the type checks.
    return import("@veilbreak/persistence").then(({ packCode }) => {
      expect(decodeBundle(packCode(BUNDLE_PREFIX, tooManyMessages)).ok).toBe(false);
      expect(decodeBundle(packCode(BUNDLE_PREFIX, { ...tooManyMessages, msgs: [], match: "not-hex" })).ok).toBe(false);
      expect(decodeBundle(packCode(BUNDLE_PREFIX, { v: 1, match: "0123456789abcdef", from: "playerC", start: 0, ack: 0, msgs: [] })).ok).toBe(false);
    });
  });

  it("codes can travel in a link fragment", async () => {
    const { host } = await startedPair();
    const code = outgoingCode(host);
    expect(decodeBundle(`https://example.test/game/#match=${code}`).ok).toBe(true);
  });
});
