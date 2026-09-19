import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createBestStore, createDefaultProfile, loadProfile, saveProfile, type KeyValueStore, type Profile } from "@veilbreak/persistence";

// The local profile (spec/06): loaded from IndexedDB on first render, created
// automatically if absent, saved after every change. Where IndexedDB is not
// available the profile lives in memory for the visit and the game still works.
interface ProfileValue {
  profile: Profile;
  ready: boolean;
  /** True when changes survive a reload. */
  persistent: boolean;
  update: (change: (current: Profile) => Profile) => void;
}

const ProfileContext = createContext<ProfileValue | null>(null);

export function ProfileProvider({ children, store }: { children: ReactNode; store?: KeyValueStore }) {
  const chosen = useRef<{ store: KeyValueStore; persistent: boolean }>();
  chosen.current ??= store ? { store, persistent: true } : createBestStore();
  const [profile, setProfile] = useState<Profile>(createDefaultProfile);
  const [ready, setReady] = useState(false);
  const latest = useRef(profile);
  latest.current = profile;

  useEffect(() => {
    let cancelled = false;
    void loadProfile(chosen.current!.store).then((loaded) => {
      if (cancelled) return;
      latest.current = loaded;
      setProfile(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((change: (current: Profile) => Profile) => {
    const next = change(latest.current);
    latest.current = next;
    setProfile(next);
    void saveProfile(chosen.current!.store, next).catch(() => undefined);
  }, []);

  const value = useMemo<ProfileValue>(
    () => ({ profile, ready, persistent: chosen.current!.persistent, update }),
    [profile, ready, update],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
