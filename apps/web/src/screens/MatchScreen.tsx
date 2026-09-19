import { useEffect, useMemo, useState } from "react";
import { ABILITY_LIBRARY, CHARACTER_LIBRARY, defaultEnergyRules, type Ability, type EnergyRules } from "@veilbreak/content";
import { canAct, resolveTurn, validateAction, type BattleState, type PlayerAction } from "@veilbreak/engine";
import { matchDeps, startMatch } from "../game/setup";
import { useBotWorker } from "../game/useBotWorker";
import { describeValidationError } from "../game/describeValidationError";
import { useSettings, TURN_TIMER_SECONDS } from "../settings/SettingsContext";
import { CharacterCard } from "../components/CharacterCard";
import { AbilityList } from "../components/AbilityList";
import { QueuedActionsPanel } from "../components/QueuedActionsPanel";
import { BattleLog } from "../components/BattleLog";
import { EnergyRow } from "../components/EnergyRow";
import { PassDeviceScreen } from "../components/PassDeviceScreen";
import { TurnTimer } from "../components/TurnTimer";

export interface MatchOutcome {
  result: "win" | "draw";
  winnerPlayerId: string | null;
}

export interface MatchScreenProps {
  mode: "hotseat" | "bot";
  teamAIds: string[];
  teamBIds: string[];
  seed: number;
  onMatchOver: (outcome: MatchOutcome) => void;
  /** Defaults to spec/01's real EnergyRules; component tests override it (e.g. "fixed" mode) for deterministic affordability. */
  energyRules?: EnergyRules;
}

type PendingAbility = { characterId: string; ability: Ability };

type TurnStep =
  | { kind: "pass-device"; forPlayerId: string; label: string }
  | { kind: "selecting"; playerId: string };

const PLAYER_LABELS: Record<string, string> = { playerA: "Player 1", playerB: "Player 2" };

/**
 * phase-05-local-playable.md's match screen. Everything HP/status/energy-
 * related on screen is read straight from `battleState`, which only ever
 * changes via `createBattle`/`resolveTurn` — this component never computes
 * a combat result itself (the phase's own acceptance criterion).
 */
export function MatchScreen({ mode, teamAIds, teamBIds, seed, onMatchOver, energyRules = defaultEnergyRules }: MatchScreenProps) {
  const [battleState, setBattleState] = useState<BattleState>(() => startMatch(teamAIds, teamBIds, seed, energyRules));
  const [step, setStep] = useState<TurnStep>(
    mode === "hotseat" ? { kind: "pass-device", forPlayerId: "playerA", label: PLAYER_LABELS.playerA! } : { kind: "selecting", playerId: "playerA" },
  );
  const [pendingActionsA, setPendingActionsA] = useState<Record<string, PlayerAction>>({});
  const [pendingActionsB, setPendingActionsB] = useState<Record<string, PlayerAction>>({});
  const [skippedA, setSkippedA] = useState<ReadonlySet<string>>(new Set());
  const [skippedB, setSkippedB] = useState<ReadonlySet<string>>(new Set());
  const [pendingAbility, setPendingAbility] = useState<PendingAbility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TURN_TIMER_SECONDS);
  const { requestBotActions } = useBotWorker();
  const { turnTimerEnabled } = useSettings();

  const deps = useMemo(() => matchDeps(energyRules), [energyRules]);

  // spec/05 "turn timer" + spec/06 OQ-08 "unlocked actions are dropped":
  // resets every time a new selection step begins (a fresh `step` object,
  // since setStep always constructs one), counts down while enabled, and —
  // in a separate effect below — locks in whatever's already queued once it
  // reaches zero, exactly as if the player had pressed Confirm themselves.
  useEffect(() => {
    if (step.kind !== "selecting" || !turnTimerEnabled) return undefined;
    setSecondsLeft(TURN_TIMER_SECONDS);
    const interval = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [step, turnTimerEnabled]);

  useEffect(() => {
    if (step.kind !== "selecting" || !turnTimerEnabled || secondsLeft > 0) return;
    void confirmTurn(step.playerId);
    // Deliberately keyed on `secondsLeft` alone: this should fire exactly
    // once, the moment the countdown reaches zero — not on every render
    // where `step`, `confirmTurn`, or the queued actions happen to change.
  }, [secondsLeft]);

  function actingCharacterIds(playerId: string): string[] {
    const team = battleState.teams.find((t) => t.playerId === playerId);
    if (!team) return [];
    return team.characterIds.filter((id) => {
      const character = battleState.characters[id];
      return character?.alive && canAct(character);
    });
  }

  function actionsFor(playerId: string): Record<string, PlayerAction> {
    return playerId === "playerA" ? pendingActionsA : pendingActionsB;
  }

  function setActionsFor(playerId: string, updater: (prev: Record<string, PlayerAction>) => Record<string, PlayerAction>) {
    if (playerId === "playerA") setPendingActionsA(updater);
    else setPendingActionsB(updater);
  }

  function skipsFor(playerId: string): ReadonlySet<string> {
    return playerId === "playerA" ? skippedA : skippedB;
  }

  function setSkipsFor(playerId: string, updater: (prev: ReadonlySet<string>) => ReadonlySet<string>) {
    if (playerId === "playerA") setSkippedA(updater);
    else setSkippedB(updater);
  }

  function queueAction(playerId: string, characterId: string, ability: Ability, targetIds: string[]) {
    const action: PlayerAction = { playerId, characterId, abilityId: ability.id, targetIds };
    const errors = validateAction(battleState, action, ABILITY_LIBRARY);
    if (errors.length > 0) {
      setError(describeValidationError(errors[0]!));
      return;
    }
    setError(null);
    setActionsFor(playerId, (prev) => ({ ...prev, [characterId]: action }));
    setSkipsFor(playerId, (prev) => {
      if (!prev.has(characterId)) return prev;
      const next = new Set(prev);
      next.delete(characterId);
      return next;
    });
    setPendingAbility(null);
  }

  // A character with no affordable/legal ability this turn (or whose player
  // simply doesn't want to act) must still be resolvable — resolveTurn is
  // happy with fewer actions than living characters (a skip is just "no
  // action this turn"), but the UI needs an explicit way to mark that
  // choice, or "Confirm turn" could never enable for that character.
  function skipCharacter(playerId: string, characterId: string) {
    setError(null);
    setSkipsFor(playerId, (prev) => new Set(prev).add(characterId));
  }

  function handleAbilityClick(playerId: string, characterId: string, ability: Ability) {
    setError(null);
    if (ability.target.side === "self") {
      queueAction(playerId, characterId, ability, [characterId]);
    } else if (ability.target.scope !== "single") {
      queueAction(playerId, characterId, ability, []);
    } else {
      setPendingAbility({ characterId, ability });
    }
  }

  function handleTargetClick(playerId: string, targetId: string) {
    if (!pendingAbility) return;
    queueAction(playerId, pendingAbility.characterId, pendingAbility.ability, [targetId]);
  }

  function cancelQueuedAction(playerId: string, characterId: string) {
    setError(null);
    setActionsFor(playerId, (prev) => {
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
    setSkipsFor(playerId, (prev) => {
      if (!prev.has(characterId)) return prev;
      const next = new Set(prev);
      next.delete(characterId);
      return next;
    });
  }

  async function runTurn(actionsA: PlayerAction[], actionsB: PlayerAction[]) {
    const result = resolveTurn(battleState, actionsA, actionsB, deps);
    if (!result.ok) {
      // Every queued action was already validated individually above, so
      // this should be unreachable — surfaced anyway rather than silently
      // dropping the turn, per CLAUDE.md's "never silently drop" spirit.
      setError("One of the queued actions became illegal before the turn resolved — please try again.");
      return;
    }
    setBattleState(result.state);
    setPendingActionsA({});
    setPendingActionsB({});
    setSkippedA(new Set());
    setSkippedB(new Set());
    setPendingAbility(null);
    setError(null);

    const endEvent = result.events.find(
      (e) => e.type === "matchEndedInDraw" || e.type === "matchEndedByTeamWipe" || e.type === "matchEndedByTurnLimit",
    );
    if (endEvent) {
      const winnerPlayerId = typeof endEvent.payload?.winnerPlayerId === "string" ? endEvent.payload.winnerPlayerId : null;
      onMatchOver({ result: endEvent.type === "matchEndedInDraw" ? "draw" : "win", winnerPlayerId });
      return;
    }

    setStep(mode === "hotseat" ? { kind: "pass-device", forPlayerId: "playerA", label: PLAYER_LABELS.playerA! } : { kind: "selecting", playerId: "playerA" });
  }

  async function confirmTurn(playerId: string) {
    // A half-chosen target must never survive into the next player's screen
    // (or the bot's turn) — otherwise it would leak which ability the
    // outgoing player was mid-selecting, defeating the pass-device screen's
    // whole purpose.
    setPendingAbility(null);
    if (mode === "hotseat" && playerId === "playerA") {
      setStep({ kind: "pass-device", forPlayerId: "playerB", label: PLAYER_LABELS.playerB! });
      return;
    }
    if (mode === "hotseat" && playerId === "playerB") {
      await runTurn(Object.values(pendingActionsA), Object.values(pendingActionsB));
      return;
    }
    // vs. bot: player A just confirmed — ask the worker for player B's move.
    setIsResolving(true);
    try {
      const botActions = await requestBotActions(battleState, "playerB");
      await runTurn(Object.values(pendingActionsA), botActions);
    } finally {
      setIsResolving(false);
    }
  }

  if (step.kind === "pass-device") {
    return <PassDeviceScreen playerLabel={step.label} onReady={() => setStep({ kind: "selecting", playerId: step.forPlayerId })} />;
  }

  const playerId = step.playerId;
  const readyIds = actingCharacterIds(playerId);
  const skips = skipsFor(playerId);
  const activeCharacterId = readyIds.find((id) => !actionsFor(playerId)[id] && !skips.has(id));
  const activeCharacter = activeCharacterId ? battleState.characters[activeCharacterId] : undefined;
  const pool = battleState.energyPools[playerId];

  return (
    <div>
      <h2 className="title" style={{ fontSize: "1.4rem" }}>
        Turn {battleState.turn} — {PLAYER_LABELS[playerId]}'s move {turnTimerEnabled && <TurnTimer secondsLeft={secondsLeft} />}
      </h2>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {pool && <EnergyRow pool={pool} />}

      <div className="match-grid">
        <div className="team-column">
          <div className="section-title">Player 1's team</div>
          {battleState.teams[0]!.characterIds.map((id) => (
            <CharacterCard
              key={id}
              character={battleState.characters[id]!}
              displayName={CHARACTER_LIBRARY[id]?.displayName ?? id}
              targetable={!!pendingAbility && !!battleState.characters[id]?.alive}
              acting={id === activeCharacterId}
              onClick={pendingAbility ? () => handleTargetClick(playerId, id) : undefined}
            />
          ))}
        </div>
        <div className="team-column">
          <div className="section-title">Player 2's team</div>
          {battleState.teams[1]!.characterIds.map((id) => (
            <CharacterCard
              key={id}
              character={battleState.characters[id]!}
              displayName={CHARACTER_LIBRARY[id]?.displayName ?? id}
              targetable={!!pendingAbility && !!battleState.characters[id]?.alive}
              acting={id === activeCharacterId}
              onClick={pendingAbility ? () => handleTargetClick(playerId, id) : undefined}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        {pendingAbility ? (
          <>
            <div className="section-title">
              Choose a target for {pendingAbility.ability.displayName} ({CHARACTER_LIBRARY[pendingAbility.characterId]?.displayName})
            </div>
            <p className="hp-text">Click a character above.</p>
            <button type="button" className="btn" onClick={() => setPendingAbility(null)}>
              Cancel
            </button>
          </>
        ) : activeCharacter && activeCharacterId ? (
          <>
            <div className="section-title">{CHARACTER_LIBRARY[activeCharacterId]?.displayName}'s action</div>
            <AbilityList
              abilities={activeCharacter.abilityIds.map((id) => ABILITY_LIBRARY[id]).filter((a): a is Ability => !!a)}
              actor={activeCharacter}
              pool={pool ?? { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 }}
              selectedAbilityId={null}
              onSelect={(ability) => handleAbilityClick(playerId, activeCharacterId, ability)}
            />
            <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => skipCharacter(playerId, activeCharacterId)}>
              Pass (no affordable action)
            </button>
          </>
        ) : (
          <p>Every action is queued.</p>
        )}
      </div>

      <QueuedActionsPanel
        actions={actionsFor(playerId)}
        skipped={skips}
        readyCharacterIds={readyIds}
        onCancel={(characterId) => cancelQueuedAction(playerId, characterId)}
        onConfirm={() => confirmTurn(playerId)}
      />

      {isResolving && <p className="subtitle">The bot is thinking…</p>}

      <div className="panel">
        <div className="section-title">Battle log</div>
        <BattleLog events={battleState.eventLog} />
      </div>
    </div>
  );
}
