import { simulateBalance, type SimRequest, type SimResult } from "./simulation";

// Developer-only: runs a balance simulation off the main thread (spec/06
// "Balance tools": a quick simulation in a Worker).
export type SimWorkerMessage = { type: "progress"; done: number; total: number } | { type: "done"; result: SimResult };

const scope = self as unknown as { onmessage: ((e: MessageEvent<SimRequest>) => void) | null; postMessage: (m: SimWorkerMessage) => void };

scope.onmessage = (event) => {
  let last = 0;
  const result = simulateBalance(event.data, (done, total) => {
    if (done === total || Date.now() - last > 250) {
      last = Date.now();
      scope.postMessage({ type: "progress", done, total });
    }
  });
  scope.postMessage({ type: "done", result });
};
