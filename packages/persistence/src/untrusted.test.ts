import { describe, expect, it } from "vitest";
import { decodeTransfer, encodeTransfer, exportBackup, importBackup, parseReplayFile, replayFileText } from "./index";
import { ID_TABLE, maxedProfile, sampleReplay } from "./testing";

// phase-15 security review: everything a player can paste, scan or load is
// untrusted input. None of the parsers may throw, hang, pollute prototypes, or
// accept a damaged file, whatever it is fed. Deterministic fuzzing (no
// Math.random): the same mutations run every time.

function rng(seed: number): () => number {
  let x = seed | 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

const NUL = String.fromCharCode(0);
const NOT_A_CHAR = String.fromCharCode(0xffff);
const JUNK = [NUL, NOT_A_CHAR, "{", "}", "[", "]", '"', String.fromCharCode(92)];

function mutate(text: string, random: () => number): string {
  const chars = [...text];
  const kind = Math.floor(random() * 6);
  const at = Math.floor(random() * Math.max(1, chars.length));
  switch (kind) {
    case 0:
      chars[at] = String.fromCharCode(32 + Math.floor(random() * 95));
      return chars.join("");
    case 1:
      return chars.slice(0, at).join("");
    case 2:
      chars.splice(at, Math.floor(random() * 20));
      return chars.join("");
    case 3:
      chars.splice(at, 0, ...JUNK.slice(0, 1 + Math.floor(random() * JUNK.length)));
      return chars.join("");
    case 4:
      return chars.slice(at).join("") + chars.slice(0, at).join("");
    default:
      return text + text.slice(0, Math.floor(random() * text.length));
  }
}

const NASTY = [
  "",
  " ",
  "null",
  "[]",
  "{}",
  '{"__proto__":{"polluted":true}}',
  '{"constructor":{"prototype":{"polluted":true}}}',
  '{"format":"veilbreak-backup","version":2,"checksum":1,"profile":{"__proto__":{"polluted":true}},"replays":[]}',
  "VB1.",
  "VB1.!!!!",
  "VB1." + "A".repeat(100000),
  "x".repeat(2_000_000),
  NUL.repeat(1000),
  "<script>alert(1)</script>",
  "javascript:alert(1)",
];

function expectNoPollution(): void {
  expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  expect(Object.prototype.hasOwnProperty.call(Object.prototype, "polluted")).toBe(false);
}

describe("importBackup on untrusted text", () => {
  const valid = exportBackup(maxedProfile(), [sampleReplay("r-1")]);
  it("never throws and rejects or cleans every mutated file", () => {
    const random = rng(12345);
    for (let i = 0; i < 400; i += 1) {
      const result = importBackup(mutate(valid, random));
      expect(typeof result.ok).toBe("boolean");
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    }
    expectNoPollution();
  });
  it("survives hostile literals, huge inputs and prototype-pollution attempts", () => {
    for (const text of NASTY) expect(importBackup(text).ok, text.slice(0, 30)).toBe(false);
    expectNoPollution();
  });
  it("still accepts the untouched file", () => {
    expect(importBackup(valid).ok).toBe(true);
  });
});

describe("decodeTransfer on untrusted codes", () => {
  const valid = encodeTransfer(maxedProfile(), ID_TABLE);
  it("never throws on mutated codes", () => {
    const random = rng(777);
    for (let i = 0; i < 400; i += 1) {
      const result = decodeTransfer(mutate(valid, random), ID_TABLE);
      expect(typeof result.ok).toBe("boolean");
    }
    expectNoPollution();
  });
  it("rejects hostile literals, and a code from a different id table", () => {
    for (const text of NASTY) expect(decodeTransfer(text, ID_TABLE).ok, text.slice(0, 30)).toBe(false);
    expect(decodeTransfer(valid, [...ID_TABLE].reverse()).ok).toBe(false);
  });
  it("does not blow up on a decompression-bomb-looking code", () => {
    const started = Date.now();
    expect(decodeTransfer("VB1." + "eJz" + "A".repeat(50_000), ID_TABLE).ok).toBe(false);
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe("parseReplayFile on untrusted text", () => {
  const valid = replayFileText(sampleReplay("r-2"));
  it("never throws on mutated files and rejects hostile literals", () => {
    const random = rng(4242);
    for (let i = 0; i < 400; i += 1) expect(typeof parseReplayFile(mutate(valid, random)).ok).toBe("boolean");
    for (const text of NASTY) expect(parseReplayFile(text).ok, text.slice(0, 30)).toBe(false);
    expectNoPollution();
  });
});
