import { useEffect, useRef } from "react";
import type { BotLevel } from "@veilbreak/ai";
import type { BattleState } from "@veilbreak/engine";
import type { BotRequest, BotResponse } from "./bot.worker";

/** Spawns the bot's Web Worker for the component's lifetime and exposes a promise-based request/response wrapper over its one-shot postMessage protocol. */
export function useBotWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // The single-file build cannot load a worker file from disk, so it carries the worker inside the page (ADR-040).
    if (__SINGLE_FILE__) {
      let cancelled = false;
      let created: Worker | null = null;
      void import("./bot.worker?worker&inline").then(({ default: InlineBotWorker }) => {
        if (cancelled) return;
        created = new InlineBotWorker();
        workerRef.current = created;
      });
      return () => {
        cancelled = true;
        created?.terminate();
      };
    }
    const worker = new Worker(new URL("./bot.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  function requestBotActions(state: BattleState, playerId: string, level?: BotLevel): Promise<BotResponse> {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error("bot worker is not ready yet"));
        return;
      }
      const handleMessage = (event: MessageEvent<BotResponse>) => {
        worker.removeEventListener("message", handleMessage);
        resolve(event.data);
      };
      worker.addEventListener("message", handleMessage);
      const request: BotRequest = { state, playerId, level };
      worker.postMessage(request);
    });
  }

  return { requestBotActions };
}
