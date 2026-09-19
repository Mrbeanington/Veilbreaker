import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { KeyValueStore, Settings } from "@veilbreak/persistence";
import { ProfileProvider, useProfile } from "../profile/ProfileContext";
import { soundBus } from "../sound/soundBus";

// spec/05 "Accessibility": keyboard navigation (everywhere), colorblind-friendly
// statuses (icons plus text, always), reduced motion, adjustable sound,
// readable tooltips, a scalable interface, clear timers. Every setting is part
// of the saved profile (phase-09 owns export/import of it).
export type AnimationSpeed = Settings["animationSpeed"];

const DURATIONS_MS: Record<AnimationSpeed, number> = { instant: 0, normal: 160, slow: 400 };
export const UI_SCALE_PERCENT: Record<Settings["uiScale"], number> = { small: 88, normal: 100, large: 118, xlarge: 136 };

// spec/06 OQ-08: the timer is optional in settings for local play.
export const TURN_TIMER_SECONDS = 60;

interface SettingsValue {
  settings: Settings;
  updateSettings: (change: Partial<Settings>) => void;
  animationSpeed: AnimationSpeed;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  animationDurationMs: number;
  turnTimerEnabled: boolean;
  setTurnTimerEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function systemPrefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function SettingsInner({ children }: { children: ReactNode }) {
  const { profile, update } = useProfile();
  const settings = profile.settings;

  const reduced = settings.reducedMotion === "on" || (settings.reducedMotion === "system" && systemPrefersReducedMotion());
  const animationDurationMs = reduced ? 0 : DURATIONS_MS[settings.animationSpeed];

  useEffect(() => {
    soundBus.configure({ enabled: settings.soundEnabled, volume: settings.soundVolume });
  }, [settings.soundEnabled, settings.soundVolume]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${UI_SCALE_PERCENT[settings.uiScale]}%`;
    root.dataset.contrast = settings.highContrast ? "high" : "normal";
    root.dataset.motion = reduced ? "reduced" : "full";
  }, [settings.uiScale, settings.highContrast, reduced]);

  const value = useMemo<SettingsValue>(() => {
    const updateSettings = (change: Partial<Settings>) => update((p) => ({ ...p, settings: { ...p.settings, ...change } }));
    return {
      settings,
      updateSettings,
      animationSpeed: settings.animationSpeed,
      setAnimationSpeed: (animationSpeed) => updateSettings({ animationSpeed }),
      animationDurationMs,
      turnTimerEnabled: settings.turnTimer,
      setTurnTimerEnabled: (turnTimer) => updateSettings({ turnTimer }),
    };
  }, [settings, animationDurationMs, update]);

  return (
    <SettingsContext.Provider value={value}>
      <div style={{ "--anim-duration": `${animationDurationMs}ms` } as React.CSSProperties}>{children}</div>
    </SettingsContext.Provider>
  );
}

export function SettingsProvider({ children, store }: { children: ReactNode; store?: KeyValueStore }) {
  return (
    <ProfileProvider store={store}>
      <SettingsInner>{children}</SettingsInner>
    </ProfileProvider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
