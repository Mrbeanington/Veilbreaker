import { ABILITY_LIBRARY } from "@veilbreak/content";
import { decideSimpleBotActions } from "@veilbreak/ai";
import type { BattleState, PlayerAction } from "@veilbreak/engine";

// phase-05-local-playable.md "The bot runs in a Web Worker." Kept
// deliberately tiny: all the actual decision logic lives in
// @veilbreak/ai (decideSimpleBotActions), tested there on its own — this
// file is just the thread boundary. Typed as a minimal message-passing
// interface rather than the ambient `DedicatedWorkerGlobalScope` lib, which
// conflicts with the DOM lib the rest of apps/web's tsconfig already needs.

export interface BotRequest {
  state: BattleState;
  playerId: string;
}

export type BotResponse = PlayerAction[];

interface WorkerScope {
  onmessage: ((event: MessageEvent<BotRequest>) => void) | null;
  postMessage: (message: BotResponse) => void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event) => {
  const { state, playerId } = event.data;
  const actions = decideSimpleBotActions(state, playerId, ABILITY_LIBRARY);
  scope.postMessage(actions);
};
