import type { BattleEvent } from "@veilbreak/content";

// spec/05 "Sound": event hooks only, silent by default, no audio assets. A
// later phase (or a player-supplied pack) subscribes to the bus; until someone
// does, emitting is a no-op. Settings decide whether hooks fire at all.
export type SoundEventName =
  | "selection"
  | "confirm"
  | "attack"
  | "defense"
  | "transformation"
  | "death"
  | "legendReveal"
  | "turnStart"
  | "matchEnd";

export interface SoundEvent {
  name: SoundEventName;
  /** Character the sound belongs to, when there is one (spec/05: per-character events). */
  characterId?: string;
  /** 0..1, already scaled by the volume setting. */
  volume: number;
}

export type SoundListener = (event: SoundEvent) => void;

export interface SoundBus {
  subscribe(listener: SoundListener): () => void;
  configure(options: { enabled: boolean; volume: number }): void;
  emit(name: SoundEventName, characterId?: string): void;
}

export function createSoundBus(): SoundBus {
  const listeners = new Set<SoundListener>();
  let enabled = false;
  let volume = 0;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    configure(options) {
      enabled = options.enabled;
      volume = Math.max(0, Math.min(100, options.volume)) / 100;
    },
    emit(name, characterId) {
      if (!enabled || listeners.size === 0) return;
      for (const listener of listeners) listener({ name, characterId, volume });
    },
  };
}

export const soundBus: SoundBus = createSoundBus();

const DEFENSIVE = new Set(["status.shield", "status.damage-reduction", "status.invulnerable", "status.untargetable", "status.death-prevention"]);

/** Maps a turn's battle events onto sound hooks. Unknown events are silent. */
export function soundEventsFor(events: readonly BattleEvent[]): { name: SoundEventName; characterId?: string }[] {
  const out: { name: SoundEventName; characterId?: string }[] = [];
  for (const e of events) {
    switch (e.type) {
      case "damageDealt":
        out.push({ name: "attack", characterId: e.sourceId });
        break;
      case "statusApplied":
        if (typeof e.payload?.statusId === "string" && DEFENSIVE.has(e.payload.statusId)) out.push({ name: "defense", characterId: e.targetId });
        break;
      case "transformed":
        out.push({ name: "transformation", characterId: e.sourceId });
        break;
      case "death":
        out.push({ name: "death", characterId: e.targetId });
        break;
      case "matchEndedByTeamWipe":
      case "matchEndedInDraw":
      case "matchEndedByTurnLimit":
        out.push({ name: "matchEnd" });
        break;
      default:
        break;
    }
  }
  return out;
}

export function playBattleSounds(events: readonly BattleEvent[], bus: SoundBus = soundBus): void {
  for (const s of soundEventsFor(events)) bus.emit(s.name, s.characterId);
}
