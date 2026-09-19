import { useEffect, useRef } from "react";
import type { BattleState } from "@veilbreak/engine";
import type { BotRequest, BotResponse } from "./bot.worker";

/** Spawns the bot's Web Worker for the component's lifetime and exposes a promise-based request/response wrapper over its one-shot postMessage protocol. */
export function useBotWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./bot.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  function requestBotActions(state: BattleState, playerId: string): Promise<BotResponse> {
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
      const request: BotRequest = { state, playerId };
      worker.postMessage(request);
    });
  }

  return { requestBotActions };
}
