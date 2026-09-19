import { canAct, hasStatus, type BattleState } from "@veilbreak/engine";

const WIN = 10_000;

/** Static evaluation from `playerId`'s point of view: positive means they are ahead. Used by the lookahead bots. */
export function evaluateState(state: BattleState, playerId: string): number {
  const mine = state.teams.find((t) => t.playerId === playerId);
  const theirs = state.teams.find((t) => t.playerId !== playerId);
  if (!mine || !theirs) return 0;

  const side = (ids: readonly string[]): { hp: number; alive: number; disabled: number; debuffed: number } => {
    let current = 0;
    let max = 0;
    let alive = 0;
    let disabled = 0;
    let debuffed = 0;
    for (const id of ids) {
      const c = state.characters[id];
      if (!c) continue;
      max += c.maxHp;
      if (!c.alive) continue;
      alive += 1;
      current += c.currentHp;
      if (!canAct(c)) disabled += 1;
      if (hasStatus(c, "status.anti-heal") || hasStatus(c, "status.burn") || hasStatus(c, "status.poison")) debuffed += 1;
    }
    return { hp: max === 0 ? 0 : current / max, alive, disabled, debuffed };
  };

  const me = side(mine.characterIds);
  const them = side(theirs.characterIds);
  if (them.alive === 0 && me.alive === 0) return 0;
  if (them.alive === 0) return WIN;
  if (me.alive === 0) return -WIN;
  return (
    (me.hp - them.hp) * 100 +
    (me.alive - them.alive) * 30 +
    (them.disabled - me.disabled) * 8 +
    (them.debuffed - me.debuffed) * 4
  );
}
