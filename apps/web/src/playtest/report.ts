import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import { levelForXp, type Profile } from "@veilbreak/persistence";
import type { PlaytestEvent } from "./log";

// The report a tester sends back: a small JSON summary, deflated and turned into a code that survives being
// pasted into a chat or an email. Nothing personal: no name, no IP, no save contents beyond counts.

export interface Feedback {
  /** 1 (not fun) to 5 (great). */
  fun: number;
  /** 1 (confusing) to 5 (clear): could they tell what was going on? */
  clear: number;
  tutorial: "yes" | "partly" | "no" | "skipped";
  again: "yes" | "maybe" | "no";
  comment: string;
}

export interface MatchRow {
  mode: string;
  result: string;
  turns: number;
  seconds: number;
  tutorial: boolean;
  team: string;
  foe: string;
}

export interface Report {
  v: 1;
  created: number;
  build: { balance: string; ua: string; width: number; height: number; touch: boolean; lang: string };
  progress: { level: number; xp: number; matches: number; legends: number; fighters: number; questsDone: number; tutorial: string };
  funnel: {
    firstEvent: number | null;
    lastEvent: number | null;
    sessions: number;
    tutorialStarted: boolean;
    tutorialFinished: boolean;
    tutorialSkipped: boolean;
    secondsToFirstMatch: number | null;
    matchesStarted: number;
    matchesFinished: number;
  };
  matches: MatchRow[];
  screens: Record<string, number>;
  errors: string[];
  feedback?: Feedback;
}

export interface ReportEnv {
  balance: string;
  ua: string;
  width: number;
  height: number;
  touch: boolean;
  lang: string;
}

export const CODE_PREFIX = "VBP1.";
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown, max: number): string => (typeof v === "string" ? v.slice(0, max) : "");
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Math.round(n)));

export function cleanFeedback(f: Feedback): Feedback {
  return {
    fun: clamp(f.fun, 1, 5),
    clear: clamp(f.clear, 1, 5),
    tutorial: (["yes", "partly", "no", "skipped"] as const).includes(f.tutorial) ? f.tutorial : "skipped",
    again: (["yes", "maybe", "no"] as const).includes(f.again) ? f.again : "maybe",
    comment: str(f.comment, 600),
  };
}

export function buildReport(input: { profile: Profile; log: readonly PlaytestEvent[]; env: ReportEnv; feedback?: Feedback; now?: number }): Report {
  const { profile, log, env } = input;
  const at = (type: PlaytestEvent["type"]) => log.filter((e) => e.type === type);
  const times = log.map((e) => e.t);
  const firstMatch = at("match-start")[0];
  const firstEvent = times.length ? Math.min(...times) : null;
  const screens: Record<string, number> = {};
  for (const e of at("screen")) {
    const name = str(e.data?.name, 24);
    if (name) screens[name] = (screens[name] ?? 0) + 1;
  }
  const matches: MatchRow[] = at("match-end")
    .slice(-20)
    .map((e) => ({
      mode: str(e.data?.mode, 12),
      result: str(e.data?.result, 8),
      turns: num(e.data?.turns),
      seconds: num(e.data?.seconds),
      tutorial: e.data?.tutorial === true,
      team: str(e.data?.team, 120),
      foe: str(e.data?.foe, 120),
    }));
  return {
    v: 1,
    created: input.now ?? Date.now(),
    build: { balance: str(env.balance, 24), ua: str(env.ua, 120), width: num(env.width), height: num(env.height), touch: env.touch, lang: str(env.lang, 12) },
    progress: {
      level: levelForXp(profile.xp),
      xp: profile.xp,
      matches: profile.matchesPlayed,
      legends: profile.unlocks.legends.length,
      fighters: profile.unlocks.fighters.length,
      questsDone: profile.missions.completed.filter((id) => id.startsWith("quest.")).length,
      tutorial: profile.tutorial.status,
    },
    funnel: {
      firstEvent,
      lastEvent: times.length ? Math.max(...times) : null,
      sessions: at("open").length,
      tutorialStarted: at("tutorial-start").length > 0,
      tutorialFinished: at("tutorial-done").length > 0,
      tutorialSkipped: at("tutorial-skip").length > 0,
      secondsToFirstMatch: firstMatch && firstEvent !== null ? Math.round((firstMatch.t - firstEvent) / 1000) : null,
      matchesStarted: at("match-start").length,
      matchesFinished: at("match-end").length,
    },
    matches,
    screens,
    errors: at("error")
      .slice(-5)
      .map((e) => str(e.data?.message, 120)),
    ...(input.feedback ? { feedback: cleanFeedback(input.feedback) } : {}),
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replaceAll("-", "+").replaceAll("_", "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeReport(report: Report): string {
  return CODE_PREFIX + toBase64Url(deflateSync(strToU8(JSON.stringify(report)), { level: 9 }));
}

/** Decodes a code from a tester. Anything that is not a report of this version gives null. */
export function decodeReport(code: string): Report | null {
  try {
    const trimmed = code.trim().replace(/\s+/g, "");
    if (!trimmed.startsWith(CODE_PREFIX)) return null;
    const parsed = JSON.parse(strFromU8(inflateSync(fromBase64Url(trimmed.slice(CODE_PREFIX.length))))) as Report;
    if (!parsed || parsed.v !== 1 || typeof parsed.created !== "number" || !parsed.progress || !parsed.funnel || !Array.isArray(parsed.matches)) return null;
    return parsed;
  } catch {
    return null;
  }
}
