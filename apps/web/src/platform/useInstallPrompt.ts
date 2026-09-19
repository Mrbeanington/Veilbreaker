import { useCallback, useEffect, useRef, useState } from "react";
import { readEnv, detectPlatform, type Env, type InstallPromptEvent, type Platform } from "./install";

// Wraps the browser's native install prompt (Chrome, Edge, Android). The event
// arrives once, early, so it is captured and kept until the player says yes.
export function useInstallPrompt(onInstalled: () => void) {
  const eventRef = useRef<InstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [env] = useState<Env>(() => readEnv());
  const [platform] = useState<Platform>(() => detectPlatform(env));
  const installedCallback = useRef(onInstalled);
  installedCallback.current = onInstalled;

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      eventRef.current = event as InstallPromptEvent;
      setCanPrompt(true);
    };
    const onDone = () => {
      eventRef.current = null;
      setCanPrompt(false);
      installedCallback.current();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onDone);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onDone);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const event = eventRef.current;
    if (!event) return "unavailable";
    await event.prompt();
    const { outcome } = await event.userChoice;
    eventRef.current = null;
    setCanPrompt(false);
    return outcome;
  }, []);

  return { env: { ...env, canPrompt }, platform, canPrompt, promptInstall };
}
