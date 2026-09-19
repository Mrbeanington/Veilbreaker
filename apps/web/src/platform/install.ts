import type { Profile } from "@veilbreak/persistence";

// spec/06 "Install as an app (PWA): the primary save-safety strategy".
export type Platform = "chromium" | "ios" | "firefox-desktop" | "other";

export interface Env {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
  /** True once the browser has offered a native install prompt (`beforeinstallprompt`). */
  canPrompt: boolean;
}

export function detectPlatform(env: Pick<Env, "userAgent" | "maxTouchPoints">): Platform {
  const ua = env.userAgent;
  // iPadOS reports a desktop Mac user agent, so touch support is the tell.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && env.maxTouchPoints > 1);
  if (ios) return "ios";
  if (/Firefox\//.test(ua) && !/Android|Mobile|Tablet/.test(ua)) return "firefox-desktop";
  if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return "chromium";
  return "other";
}

export function readEnv(): Env {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const standalone =
    (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
    (nav as (Navigator & { standalone?: boolean }) | undefined)?.standalone === true;
  return { userAgent: nav?.userAgent ?? "", maxTouchPoints: nav?.maxTouchPoints ?? 0, standalone, canPrompt: false };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type InstallPlan = "screen" | "banner" | "none";

/**
 * When to bring up the install pitch:
 *  - a friendly screen on first launch, before the first real session;
 *  - a gentle banner later (after the first Legend unlock), at most twice, a day apart;
 *  - never once installed or running as an installed app;
 *  - Firefox desktop has no install, so it is never pitched (backups are emphasised instead).
 */
export function installPlan(profile: Profile, env: Env, platform: Platform, now: number): InstallPlan {
  if (env.standalone || profile.install.installed) return "none";
  if (!profile.install.firstLaunchHandled) return "screen";
  if (platform === "firefox-desktop") return "none";
  const enoughAsks = profile.install.asks >= 3;
  const recentlyAsked = profile.install.lastAskAt !== undefined && now - profile.install.lastAskAt < DAY_MS;
  if (!enoughAsks && !recentlyAsked && profile.unlocks.legends.length >= 1) return "banner";
  return "none";
}

/** iOS keeps a home-screen app's storage separate from Safari (spec/06), so progress made in a Safari tab has to be carried over. */
export function offerMoveProgress(profile: Profile, env: Env, platform: Platform): "in-safari-with-progress" | "in-app" | "no" {
  if (platform !== "ios") return "no";
  if (env.standalone) return "in-app";
  return profile.matchesPlayed > 0 ? "in-safari-with-progress" : "no";
}

export const DELETE_WARNING =
  "If you delete the app (especially on an iPhone), its save is deleted with it. Transfer your progress or make a backup first.";

// The beforeinstallprompt event is not in TypeScript's DOM lib.
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
