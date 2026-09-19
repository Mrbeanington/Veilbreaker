import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// spec/05 "Accessibility": an animation-speed option, respecting the OS's
// reduced-motion preference. No persistence yet (Phase 09 owns save data) —
// this only lives for the current session.
export type AnimationSpeed = "instant" | "normal" | "slow";

const DURATIONS_MS: Record<AnimationSpeed, number> = { instant: 0, normal: 160, slow: 400 };

// spec/06 OQ-08 "the timer is optional in settings" for local (non-ranked)
// play — on by default (spec/05 lists a turn timer as part of the match
// screen itself), but a player can turn it off entirely for local hotseat/
// vs-bot matches, where there's no remote opponent actually waiting.
export const TURN_TIMER_SECONDS = 60;

interface SettingsValue {
  animationSpeed: AnimationSpeed;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  animationDurationMs: number;
  turnTimerEnabled: boolean;
  setTurnTimerEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>("normal");
  const [turnTimerEnabled, setTurnTimerEnabled] = useState(true);

  const prefersReducedMotion =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const animationDurationMs = prefersReducedMotion ? 0 : DURATIONS_MS[animationSpeed];

  const value = useMemo<SettingsValue>(
    () => ({ animationSpeed, setAnimationSpeed, animationDurationMs, turnTimerEnabled, setTurnTimerEnabled }),
    [animationSpeed, animationDurationMs, turnTimerEnabled],
  );

  return (
    <SettingsContext.Provider value={value}>
      <div style={{ "--anim-duration": `${animationDurationMs}ms` } as React.CSSProperties}>{children}</div>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
