import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createBestStore,
  createDefaultProfile,
  loadProfile,
  saveProfile,
  type KeyValueStore,
  type LoadResult,
  type Profile,
} from "@veilbreak/persistence";
import { requestPersistence, type Protection } from "../platform/protection";

// The local profile (spec/06): loaded from IndexedDB on first render, created
// automatically if absent, and saved atomically after every change. Where
// IndexedDB is not available the profile lives in memory for the visit and the
// game still works.
interface ProfileValue {
  profile: Profile;
  ready: boolean;
  /** True when changes survive a reload. */
  persistent: boolean;
  /** How the profile was loaded (a backup restore is worth telling the player). */
  loadInfo: Pick<LoadResult, "source" | "problems" | "backupIndex"> | null;
  /** "Progress protection" status shown in Settings and the Profile screen. */
  protection: Protection;
  /** The store behind the profile, for replays and backups. */
  store: KeyValueStore;
  /** `milestone` forces a backup snapshot (a match, an unlock, an import). */
  update: (change: (current: Profile) => Profile, options?: { milestone?: boolean }) => void;
  /** Replaces the whole profile (import, transfer, restore). Always snapshots the old save first. */
  replace: (next: Profile) => void;
}

const ProfileContext = createContext<ProfileValue | null>(null);

export function ProfileProvider({ children, store }: { children: ReactNode; store?: KeyValueStore }) {
  const chosen = useRef<{ store: KeyValueStore; persistent: boolean }>();
  chosen.current ??= store ? { store, persistent: true } : createBestStore();
  const [profile, setProfile] = useState<Profile>(createDefaultProfile);
  const [ready, setReady] = useState(false);
  const [loadInfo, setLoadInfo] = useState<ProfileValue["loadInfo"]>(null);
  const [protection, setProtection] = useState<Protection>("unknown");
  const latest = useRef(profile);
  latest.current = profile;
  // Writes go through one queue so two quick changes can never land out of order.
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    void loadProfile(chosen.current!.store).then((loaded) => {
      if (cancelled) return;
      latest.current = loaded.profile;
      setProfile(loaded.profile);
      setLoadInfo({ source: loaded.source, problems: loaded.problems, backupIndex: loaded.backupIndex });
      setReady(true);
    });
    void requestPersistence().then((result) => {
      if (!cancelled) setProtection(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const write = useCallback((next: Profile, snapshot: boolean) => {
    latest.current = next;
    setProfile(next);
    queue.current = queue.current.then(() => saveProfile(chosen.current!.store, next, { snapshot }).catch(() => undefined));
  }, []);

  const update = useCallback(
    (change: (current: Profile) => Profile, options?: { milestone?: boolean }) => write(change(latest.current), options?.milestone === true),
    [write],
  );
  const replace = useCallback((next: Profile) => write(next, true), [write]);

  const value = useMemo<ProfileValue>(
    () => ({ profile, ready, persistent: chosen.current!.persistent, loadInfo, protection, store: chosen.current!.store, update, replace }),
    [profile, ready, loadInfo, protection, update, replace],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
