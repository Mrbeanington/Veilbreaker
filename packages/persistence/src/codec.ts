import { Inflate, deflateSync } from "fflate";
import { checksumOf, crc32, fromBase64Url, fromUtf8, toBase64Url, utf8 } from "./bytes";
import { PROFILE_VERSION, parseProfile, profileSchema, summarizeProfile, type Profile, type ProfileSummary } from "./profile";
import { replayRecordSchema, type ReplayRecord } from "./replay";

// Everything here treats its input as untrusted: files and codes come from
// outside, so each decoder checks size, format, checksum and schema before
// anything reaches the game (spec/06 "Transfer codes are untrusted input").

// ------------------------------------------------------------- JSON backup

export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

export function exportBackup(profile: Profile, replays: readonly ReplayRecord[] = [], now = Date.now()): string {
  const body = { profile, replays };
  return JSON.stringify({
    format: "veilbreak-backup",
    version: PROFILE_VERSION,
    exportedAt: now,
    checksum: checksumOf(JSON.stringify(body)),
    ...body,
  });
}

export type ImportResult =
  | { ok: true; profile: Profile; replays: ReplayRecord[]; summary: ProfileSummary; droppedReplays: number }
  | { ok: false; error: string };

export function importBackup(text: string): ImportResult {
  if (typeof text !== "string" || text.length === 0) return { ok: false, error: "That file is empty." };
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: "That file is too large to be a save." };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That does not look like a Veilbreak save." };
  }
  if (!data || typeof data !== "object") return { ok: false, error: "That does not look like a Veilbreak save." };
  const file = data as { format?: unknown; checksum?: unknown; profile?: unknown; replays?: unknown };
  if (file.format !== "veilbreak-backup") return { ok: false, error: "That does not look like a Veilbreak save." };
  const replaysRaw = Array.isArray(file.replays) ? file.replays : [];
  if (file.checksum !== checksumOf(JSON.stringify({ profile: file.profile, replays: replaysRaw }))) {
    return { ok: false, error: "This save is damaged (its checksum does not match)." };
  }
  const parsed = parseProfile(file.profile);
  if (!parsed.ok) return { ok: false, error: `This save cannot be used: ${parsed.reason}.` };
  const replays: ReplayRecord[] = [];
  let dropped = 0;
  for (const r of replaysRaw.slice(0, 200)) {
    const ok = replayRecordSchema.safeParse(r);
    if (ok.success) replays.push(ok.data);
    else dropped += 1;
  }
  return { ok: true, profile: parsed.profile, replays, summary: summarizeProfile(parsed.profile), droppedReplays: dropped };
}

// ------------------------------------------------------------- compressed codes

const MAX_CODE_CHARS = 20_000;
const MAX_INFLATED_BYTES = 400_000;

function inflateLimited(bytes: Uint8Array): Uint8Array | null {
  const chunks: Uint8Array[] = [];
  let total = 0;
  let failed = false;
  const stream = new Inflate((chunk) => {
    total += chunk.length;
    if (total > MAX_INFLATED_BYTES) {
      failed = true;
      return;
    }
    chunks.push(chunk);
  });
  try {
    stream.push(bytes, true);
  } catch {
    return null;
  }
  if (failed) return null;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** prefix + base64url( [format byte][deflate(json)][crc32 of the previous bytes] ) */
export function packCode(prefix: string, json: unknown): string {
  const body = deflateSync(utf8(JSON.stringify(json)), { level: 9 });
  const bytes = new Uint8Array(1 + body.length + 4);
  bytes[0] = 1;
  bytes.set(body, 1);
  new DataView(bytes.buffer).setUint32(bytes.length - 4, crc32(bytes.subarray(0, bytes.length - 4)));
  return prefix + toBase64Url(bytes);
}

export function unpackCode(prefix: string, code: string): { ok: true; json: unknown } | { ok: false; error: string } {
  const trimmed = code.trim();
  if (trimmed.length > MAX_CODE_CHARS) return { ok: false, error: "That code is too long." };
  if (!trimmed.startsWith(prefix)) return { ok: false, error: "That is not a Veilbreak code." };
  const bytes = fromBase64Url(trimmed.slice(prefix.length));
  if (!bytes || bytes.length < 6) return { ok: false, error: "That code is damaged." };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(bytes.length - 4) !== crc32(bytes.subarray(0, bytes.length - 4))) return { ok: false, error: "That code is damaged (checksum mismatch)." };
  if (bytes[0] !== 1) return { ok: false, error: "That code is from a newer version of the game." };
  const inflated = inflateLimited(bytes.subarray(1, bytes.length - 4));
  if (!inflated) return { ok: false, error: "That code is damaged or too large." };
  try {
    return { ok: true, json: JSON.parse(fromUtf8(inflated)) };
  } catch {
    return { ok: false, error: "That code is damaged." };
  }
}

// ------------------------------------------------------------- device transfer

/** Codes start with this so a scan or paste can be recognised at a glance. */
export const TRANSFER_PREFIX = "VB1.";
/** Byte-mode capacity of the biggest QR code (version 40) at the lowest error correction. */
export const QR_MAX_BYTES = 2953;

// The transfer payload is progress only (spec/06): no history, replays or
// backups. Ids are replaced by their position in a shared id table (both
// devices build it from the same game content), and pair counts are clamped
// to 3, which is all the Codex ever reads (it looks for 2+).
const COUNT_CAP = 3;

type Ref = number | string;

function refs(table: readonly string[]): { toRef: (id: string) => Ref; fromRef: (ref: unknown) => string | undefined } {
  const index = new Map(table.map((id, i) => [id, i]));
  return {
    toRef: (id) => index.get(id) ?? id,
    fromRef: (ref) => (typeof ref === "number" ? table[ref] : typeof ref === "string" ? ref : undefined),
  };
}

const SETTINGS_ORDER = ["animationSpeed", "reducedMotion", "turnTimer", "uiScale", "highContrast", "soundEnabled", "soundVolume", "showAllCharacters", "botLevel"] as const;

/** A transfer code has to fit one QR code, and pair tables grow with the square of the roster (120 characters is 14,000 pairs), so each table sends only its strongest pairs. Backups carry everything. */
export const MAX_TRANSFER_PAIRS = 250;

function packPairs(table: Profile["beat"], toRef: (id: string) => Ref, limit: number) {
  const entries: [string, string, number][] = [];
  for (const [a, row] of Object.entries(table)) for (const [b, n] of Object.entries(row)) if (n > 0) entries.push([a, b, Math.min(COUNT_CAP, n)]);
  // Keep the largest counts first (the Codex only reads "2 or more"), ties broken by id so the code is stable.
  entries.sort((x, y) => y[2] - x[2] || x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]));
  const kept = new Map<string, [Ref, number][]>();
  for (const [a, b, n] of entries.slice(0, limit)) kept.set(a, [...(kept.get(a) ?? []), [toRef(b), n]]);
  return [...kept.entries()].map(([a, row]) => [toRef(a), row]);
}

/**
 * Builds the transfer code, sending as many of the strongest pairs as fit one QR
 * code: the pair limit halves until the code is small enough (the rest of the
 * payload is small and fixed). Backups always carry everything.
 */
export function encodeTransfer(profile: Profile, idTable: readonly string[]): string {
  let limit = MAX_TRANSFER_PAIRS;
  for (;;) {
    const code = encodeTransferWith(profile, idTable, limit);
    if (code.length <= QR_MAX_BYTES || limit === 0) return code;
    limit = Math.floor(limit * 0.8);
  }
}

function encodeTransferWith(profile: Profile, idTable: readonly string[], pairLimit: number): string {
  const { toRef } = refs(idTable);
  const list = (ids: readonly string[]) => ids.map(toRef);
  const payload = {
    v: PROFILE_VERSION,
    k: checksumOf(idTable.join("|")),
    x: profile.xp,
    m: profile.matchesPlayed,
    lp: profile.lastPlayedAt ?? 0,
    s: SETTINGS_ORDER.map((k) => profile.settings[k]),
    f: list(profile.favorites),
    r: list(profile.recent),
    p: Object.entries(profile.played).map(([id, n]) => [toRef(id), n]),
    t: profile.presets.map((p) => [p.id, p.name, list(p.characterIds)]),
    d: [list(profile.discovered.characters), list(profile.discovered.abilities), list(profile.discovered.passives), list(profile.discovered.transformations)],
    b: packPairs(profile.beat, toRef, pairLimit),
    w: packPairs(profile.wonWith, toRef, pairLimit),
    u: [list(profile.unlocks.legends), profile.unlocks.namelessBossDefeated ? 1 : 0],
    tw: list(profile.trialsWon),
    ms: [Object.entries(profile.missions.progress).map(([id, n]) => [toRef(id), n]), list(profile.missions.completed)],
    ac: list(profile.achievements),
    i: [profile.install.installed ? 1 : 0, profile.install.asks, profile.install.firstLaunchHandled ? 1 : 0],
    // Ranked: the standing and personal bests travel; the recent list, usage table and past seasons stay in backups (like history).
    rk: [
      profile.ranked.season,
      profile.ranked.rating,
      profile.ranked.placements,
      profile.ranked.division,
      profile.ranked.wins,
      profile.ranked.losses,
      profile.ranked.draws,
      profile.ranked.streak,
      profile.ranked.bestStreak,
      profile.ranked.peakRating,
      profile.ranked.peakDivision,
      [profile.ranked.bests.rating, profile.ranked.bests.division, profile.ranked.bests.winStreak, profile.ranked.bests.fastestWinTurns ?? 0, profile.ranked.bests.seasonWins, profile.ranked.bests.matches],
    ],
  };
  return packCode(TRANSFER_PREFIX, payload);
}

export type TransferResult =
  | { ok: true; profile: Profile; summary: ProfileSummary }
  | { ok: false; error: string };

const isArr = (v: unknown): v is unknown[] => Array.isArray(v);

export function decodeTransfer(code: string, idTable: readonly string[]): TransferResult {
  const unpacked = unpackCode(TRANSFER_PREFIX, code);
  if (!unpacked.ok) return unpacked;
  const p = unpacked.json as Record<string, unknown>;
  if (!p || typeof p !== "object") return { ok: false, error: "That code is damaged." };
  // v2 codes (before the ranked ladder) carry no `rk` block, which simply defaults.
  if (p.v !== PROFILE_VERSION && p.v !== 2) {
    return { ok: false, error: typeof p.v === "number" && p.v > PROFILE_VERSION ? "That code is from a newer version of the game." : "That code is from an unsupported version." };
  }
  // Positions only mean the same thing if both devices built the same id table.
  if (p.k !== checksumOf(idTable.join("|"))) return { ok: false, error: "That code was made by a different version of the game. Update both devices and try again." };
  const { fromRef } = refs(idTable);
  const ids = (v: unknown): string[] => (isArr(v) ? v.map(fromRef).filter((x): x is string => x !== undefined) : []);
  const counts = (v: unknown): Record<string, number> => {
    const out: Record<string, number> = {};
    if (isArr(v)) for (const e of v) if (isArr(e)) { const id = fromRef(e[0]); if (id !== undefined) out[id] = Number(e[1]); }
    return out;
  };
  const pairs = (v: unknown): Profile["beat"] => {
    const out: Profile["beat"] = {};
    if (isArr(v)) {
      for (const e of v) {
        if (!isArr(e)) continue;
        const a = fromRef(e[0]);
        if (a === undefined) continue;
        out[a] = counts(e[1]);
      }
    }
    return out;
  };
  try {
    const settingsArr = isArr(p.s) ? p.s : [];
    const settings = Object.fromEntries(SETTINGS_ORDER.map((k, i) => [k, settingsArr[i]]));
    const d = isArr(p.d) ? p.d : [];
    const u = isArr(p.u) ? p.u : [];
    const ms = isArr(p.ms) ? p.ms : [];
    const inst = isArr(p.i) ? p.i : [];
    const rk = isArr(p.rk) ? p.rk : [];
    const rb = isArr(rk[11]) ? rk[11] : [];
    const ranked = isArr(p.rk)
      ? {
          season: rk[0],
          rating: rk[1],
          placements: rk[2],
          division: rk[3],
          wins: rk[4],
          losses: rk[5],
          draws: rk[6],
          streak: rk[7],
          bestStreak: rk[8],
          peakRating: rk[9],
          peakDivision: rk[10],
          bests: { rating: rb[0], division: rb[1], winStreak: rb[2], fastestWinTurns: Number(rb[3]) > 0 ? rb[3] : null, seasonWins: rb[4], matches: rb[5] },
        }
      : undefined;
    const candidate = {
      version: PROFILE_VERSION,
      settings,
      xp: p.x,
      matchesPlayed: p.m,
      lastPlayedAt: typeof p.lp === "number" && p.lp > 0 ? p.lp : undefined,
      favorites: ids(p.f),
      recent: ids(p.r),
      played: counts(p.p),
      presets: isArr(p.t) ? p.t.filter(isArr).map((t) => ({ id: t[0], name: t[1], characterIds: ids(t[2]) })) : [],
      discovered: { characters: ids(d[0]), abilities: ids(d[1]), passives: ids(d[2]), transformations: ids(d[3]) },
      beat: pairs(p.b),
      wonWith: pairs(p.w),
      unlocks: { legends: ids(u[0]), namelessBossDefeated: u[1] === 1 },
      trialsWon: ids(p.tw),
      missions: { progress: counts(ms[0]), completed: ids(ms[1]) },
      achievements: ids(p.ac),
      install: { installed: inst[0] === 1, asks: Number(inst[1] ?? 0), firstLaunchHandled: inst[2] === 1 },
      ranked,
    };
    const parsed = profileSchema.safeParse(candidate);
    if (!parsed.success) return { ok: false, error: "That code does not contain a usable save." };
    return { ok: true, profile: parsed.data, summary: summarizeProfile(parsed.data) };
  } catch {
    return { ok: false, error: "That code does not contain a usable save." };
  }
}

/** `/#transfer=<code>`: the fragment never leaves the device (spec/06). */
export function transferLink(origin: string, code: string): string {
  return `${origin}/#transfer=${code}`;
}

/** Pulls a code out of a pasted code, a whole link, or a `#transfer=` fragment. */
export function extractTransferCode(input: string): string {
  const trimmed = input.trim();
  const match = /#transfer=([A-Za-z0-9_.-]+)/.exec(trimmed);
  return match?.[1] ?? trimmed;
}

// ------------------------------------------------------------- replay codes

export const REPLAY_PREFIX = "VR1.";
/** A replay short enough to live in a URL fragment. */
export const MAX_REPLAY_LINK_CHARS = 1800;

export function encodeReplay(replay: ReplayRecord): string {
  return packCode(REPLAY_PREFIX, replay);
}

export type ReplayDecode = { ok: true; replay: ReplayRecord } | { ok: false; error: string };

export function decodeReplay(code: string): ReplayDecode {
  const unpacked = unpackCode(REPLAY_PREFIX, code);
  if (!unpacked.ok) return unpacked;
  const parsed = replayRecordSchema.safeParse(unpacked.json);
  return parsed.success ? { ok: true, replay: parsed.data } : { ok: false, error: "That replay is damaged." };
}

export function replayFileText(replay: ReplayRecord): string {
  return JSON.stringify({ format: "veilbreak-replay", replay });
}

export function parseReplayFile(text: string): ReplayDecode {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: "That file is too large to be a replay." };
  try {
    const data = JSON.parse(text) as { format?: unknown; replay?: unknown };
    if (data.format !== "veilbreak-replay") return { ok: false, error: "That does not look like a Veilbreak replay." };
    const parsed = replayRecordSchema.safeParse(data.replay);
    return parsed.success ? { ok: true, replay: parsed.data } : { ok: false, error: "That replay is damaged." };
  } catch {
    return { ok: false, error: "That does not look like a Veilbreak replay." };
  }
}

