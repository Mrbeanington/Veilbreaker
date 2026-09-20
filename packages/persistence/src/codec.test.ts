import { describe, expect, it } from "vitest";
import { deflateSync } from "fflate";
import { CHARACTER_LIBRARY } from "@veilbreak/content";
import {
  MAX_BACKUP_BYTES,
  MAX_TRANSFER_PAIRS,
  MAX_REPLAY_LINK_CHARS,
  QR_MAX_BYTES,
  TRANSFER_PREFIX,
  checksumOf,
  createDefaultProfile,
  decodeQr,
  decodeReplay,
  decodeTransfer,
  encodeReplay,
  encodeTransfer,
  exportBackup,
  extractTransferCode,
  importBackup,
  parseReplayFile,
  renderQrRgba,
  replayFileText,
  transferLink,
} from "./index";
import { ID_TABLE, maxedProfile, sampleReplay } from "./testing";

// A tampered file whose checksum has been recomputed: the checksum only catches
// accidents, so the schema is the real gate.
function forge(profile: unknown, replays: unknown[] = []): string {
  const body = { profile, replays };
  return JSON.stringify({ format: "veilbreak-backup", version: 2, checksum: checksumOf(JSON.stringify(body)), ...body });
}

describe("JSON backup (universal fallback)", () => {
  it("export -> import is a lossless round trip, replays included", () => {
    const profile = maxedProfile();
    const replay = sampleReplay("r-1");
    const result = importBackup(exportBackup(profile, [replay]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile).toEqual(profile);
    expect(result.replays).toEqual([replay]);
    expect(result.summary.legends).toBe(11);
  });

  it("a default profile round-trips too", () => {
    const result = importBackup(exportBackup(createDefaultProfile()));
    expect(result.ok && result.profile).toEqual(createDefaultProfile());
  });

  it("rejects empty, non-JSON, wrong-format and damaged files with a plain message", () => {
    const good = exportBackup(createDefaultProfile());
    const cases = ["", "not json", "[]", "null", JSON.stringify({ format: "other" }), good.replace('"xp":0', '"xp":999')];
    for (const text of cases) {
      const r = importBackup(text);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).not.toMatch(/undefined|TypeError|JSON\.parse/);
    }
  });

  it("rejects oversized files without parsing them", () => {
    const r = importBackup("x".repeat(MAX_BACKUP_BYTES + 1));
    expect(r.ok).toBe(false);
  });

  it("rejects a forged file whose checksum matches but whose content is invalid", () => {
    const bad = { ...createDefaultProfile(), xp: -5, settings: { uiScale: "huge" } };
    expect(importBackup(forge(bad)).ok).toBe(false);
    expect(importBackup(forge({ version: 99 })).ok).toBe(false);
  });

  it("ignores prototype-pollution keys in a hostile file", () => {
    const hostile = forge(JSON.parse('{"version":2,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"favorites":["hydra"]}'));
    const r = importBackup(hostile);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    if (r.ok) expect((r.profile as unknown as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("drops malformed replays but keeps the profile, and reports how many", () => {
    const text = forge(createDefaultProfile(), [sampleReplay("ok"), { junk: true }, sampleReplay("ok-2")]);
    const r = importBackup(text);
    expect(r.ok && r.replays.length).toBe(2);
    expect(r.ok && r.droppedReplays).toBe(1);
  });

  it("caps how many replays an import can carry", () => {
    const many = Array.from({ length: 500 }, (_, i) => sampleReplay(`r-${i}`, 1));
    const r = importBackup(forge(createDefaultProfile(), many));
    expect(r.ok && r.replays.length).toBeLessThanOrEqual(200);
  });
});

describe("device transfer code", () => {
  it("round-trips a full profile (progress only, counts clamped to what the Codex reads)", () => {
    const profile = maxedProfile();
    const decoded = decodeTransfer(encodeTransfer(profile, ID_TABLE), ID_TABLE);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    const p = decoded.profile;
    expect(p.xp).toBe(profile.xp);
    expect(p.unlocks).toEqual(profile.unlocks);
    expect(p.achievements).toEqual(profile.achievements);
    expect(p.missions).toEqual(profile.missions);
    expect(p.discovered).toEqual(profile.discovered);
    expect(p.favorites).toEqual(profile.favorites);
    expect(p.presets).toEqual(profile.presets);
    expect(p.settings).toEqual(profile.settings);
    expect(p.trialsWon).toEqual(profile.trialsWon);
    expect(p.matchesPlayed).toBe(profile.matchesPlayed);
    // A maxed profile has every pair seen 40 times, far more than one QR code can hold: only the strongest pairs travel (at most MAX_TRANSFER_PAIRS, fewer when the code would not fit), clamped to 3 ("2 or more").
    const pairs = Object.values(p.beat).flatMap((row) => Object.values(row));
    expect(pairs.length).toBeGreaterThan(20);
    expect(pairs.length).toBeLessThanOrEqual(MAX_TRANSFER_PAIRS);
    expect(pairs.every((n) => n === 3)).toBe(true);
    expect(p.history).toEqual([]); // match history is not transferred
  });

  it("a realistic profile keeps all of its pairs, clamped, and the strongest win when a table is over the limit", () => {
    const small = { ...createDefaultProfile(), beat: { hydra: { shiro: 40, koschei: 1 } }, wonWith: { hydra: { koschei: 2 } } };
    const back = decodeTransfer(encodeTransfer(small, ID_TABLE), ID_TABLE);
    expect(back.ok && back.profile.beat).toEqual({ hydra: { shiro: 3, koschei: 1 } });
    expect(back.ok && back.profile.wonWith).toEqual({ hydra: { koschei: 2 } });

    const ids = Object.keys(CHARACTER_LIBRARY);
    const wide: Record<string, Record<string, number>> = {};
    for (const a of ids) for (const b of ids) if (a !== b) (wide[a] ??= {})[b] = a === "hydra" && b === "zeiron" ? 9 : 1;
    const capped = decodeTransfer(encodeTransfer({ ...createDefaultProfile(), beat: wide }, ID_TABLE), ID_TABLE);
    expect(capped.ok && capped.profile.beat.hydra?.zeiron).toBe(3); // the strongest pair always survives
  });

  it("a default profile round-trips exactly", () => {
    const decoded = decodeTransfer(encodeTransfer(createDefaultProfile(), ID_TABLE), ID_TABLE);
    expect(decoded.ok && decoded.profile).toEqual(createDefaultProfile());
  });

  it("a maxed-out profile fits in a single QR code", () => {
    const code = encodeTransfer(maxedProfile(), ID_TABLE);
    expect(code.startsWith(TRANSFER_PREFIX)).toBe(true);
    expect(code.length).toBeLessThanOrEqual(QR_MAX_BYTES);
    // spec/06 also budgets 2,500 bytes for the compressed payload itself.
    expect(Math.ceil(((code.length - TRANSFER_PREFIX.length) * 3) / 4)).toBeLessThanOrEqual(2500);
  });

  it("survives being drawn as a QR image and decoded again (camera round trip)", () => {
    const profile = maxedProfile();
    const code = encodeTransfer(profile, ID_TABLE);
    const scanned = decodeQr(renderQrRgba(code, 3));
    expect(scanned).toBe(code);
    const decoded = decodeTransfer(scanned!, ID_TABLE);
    expect(decoded.ok && decoded.profile.xp).toBe(profile.xp);
  });

  it("accepts a pasted code, a whole link, or just the fragment", () => {
    const code = encodeTransfer({ ...createDefaultProfile(), xp: 321 }, ID_TABLE);
    for (const input of [code, `  ${code}\n`, transferLink("https://example.test", code), `#transfer=${code}`]) {
      const decoded = decodeTransfer(extractTransferCode(input), ID_TABLE);
      expect(decoded.ok && decoded.profile.xp).toBe(321);
    }
    expect(transferLink("https://example.test", code)).toContain("/#transfer=");
  });

  it("rejects damaged, truncated and foreign codes with a plain message", () => {
    const code = encodeTransfer(maxedProfile(), ID_TABLE);
    const flipped = code.slice(0, 40) + (code[40] === "A" ? "B" : "A") + code.slice(41);
    const cases = ["", "hello", "VB1.", "VB1.!!!!", "VB2." + code.slice(4), code.slice(0, code.length - 9), flipped];
    for (const c of cases) {
      const r = decodeTransfer(c, ID_TABLE);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.length).toBeGreaterThan(5);
    }
  });

  it("rejects an over-long code and a compression bomb without exhausting memory", () => {
    expect(decodeTransfer(TRANSFER_PREFIX + "A".repeat(30_000), ID_TABLE).ok).toBe(false);
    // ~2 MB of zeros deflates to a couple of KB but must not be inflated.
    const bomb = deflateSync(new Uint8Array(2_000_000), { level: 9 });
    const bytes = new Uint8Array(1 + bomb.length + 4);
    bytes[0] = 1;
    bytes.set(bomb, 1);
    // A valid crc is required to reach the inflater, so compute it the same way the codec does.
    const view = new DataView(bytes.buffer);
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length - 4; i += 1) {
      crc ^= bytes[i]!;
      for (let k = 0; k < 8; k += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    view.setUint32(bytes.length - 4, (crc ^ 0xffffffff) >>> 0);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const code = TRANSFER_PREFIX + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const r = decodeTransfer(code, ID_TABLE);
    expect(r.ok).toBe(false);
  });

  it("refuses a code made against a different id table (a different game version)", () => {
    const code = encodeTransfer(maxedProfile(), ID_TABLE);
    const r = decodeTransfer(code, [...ID_TABLE, "a-new-character"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/different version/);
  });

  it("a code carrying invalid values is rejected by the schema", () => {
    const evil = { ...maxedProfile(), xp: 5 };
    const code = encodeTransfer(evil, ID_TABLE);
    const decoded = decodeTransfer(code, ID_TABLE);
    expect(decoded.ok).toBe(true);
    // Hand-built payloads with wrong types never produce a profile.
    expect(decodeTransfer(TRANSFER_PREFIX + "AAAA", ID_TABLE).ok).toBe(false);
  });
});

describe("replay codes and files", () => {
  it("round-trips through a code and through a file", () => {
    const replay = sampleReplay("r-9", 4);
    const viaCode = decodeReplay(encodeReplay(replay));
    expect(viaCode.ok && viaCode.replay).toEqual(replay);
    const viaFile = parseReplayFile(replayFileText(replay));
    expect(viaFile.ok && viaFile.replay).toEqual(replay);
  });

  it("a short match fits in a URL fragment", () => {
    expect(encodeReplay(sampleReplay("short", 6)).length).toBeLessThan(MAX_REPLAY_LINK_CHARS);
  });

  it("rejects damaged and hostile replays", () => {
    const code = encodeReplay(sampleReplay());
    expect(decodeReplay(code.slice(0, -6)).ok).toBe(false);
    expect(decodeReplay("VR1.zzzz").ok).toBe(false);
    expect(parseReplayFile("{}").ok).toBe(false);
    expect(parseReplayFile(JSON.stringify({ format: "veilbreak-replay", replay: { version: 1 } })).ok).toBe(false);
    expect(parseReplayFile("x".repeat(MAX_BACKUP_BYTES + 1)).ok).toBe(false);
  });
});
