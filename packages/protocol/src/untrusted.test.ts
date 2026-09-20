import { describe, expect, it } from "vitest";
import { BUNDLE_PREFIX, decodeBundle, encodeBundle } from "./messages";

// phase-15 security review: a friend-match code arrives from another person's
// device (a paste, a link or a scan), so it is untrusted. decodeBundle must never
// throw, must never accept a bundle that fails its schema, and must not be
// steerable by prototype-pollution keys or oversize input.

function rng(seed: number): () => number {
  let x = seed | 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

describe("decodeBundle on untrusted input", () => {
  it("rejects well-packed but wrong payloads", () => {
    for (const payload of [{}, [], null, 5, "text", JSON.parse('{"__proto__":{"polluted":true}}'), { messages: "x" }]) {
      expect(decodeBundle(encodeBundle(payload as never)).ok).toBe(false);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("never throws on random codes, links and junk", () => {
    const random = rng(99);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-.#=%";
    for (let i = 0; i < 500; i += 1) {
      const length = Math.floor(random() * 300);
      let junk = "";
      for (let j = 0; j < length; j += 1) junk += alphabet[Math.floor(random() * alphabet.length)];
      for (const input of [junk, BUNDLE_PREFIX + junk, `https://example.test/#match=${BUNDLE_PREFIX}${junk}`]) {
        expect(decodeBundle(input).ok).toBe(false);
      }
    }
    for (const input of ["", "#match=", "x".repeat(3_000_000), "<script>alert(1)</script>", BUNDLE_PREFIX + "%%%"]) {
      expect(decodeBundle(input).ok, input.slice(0, 20)).toBe(false);
    }
  });
});
