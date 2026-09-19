import type { Ability, Effect } from "@veilbreak/content";
import { validateAction, type BattleState, type PlayerAction } from "@veilbreak/engine";

// phase-05-local-playable.md "vs. a simple bot (random legal action,
// prefers kills)". This is deliberately not one of BOT_LEVELS (index.ts) —
// Phase 07 builds the real BEGINNER/INTERMEDIATE/ADVANCED/EXPERT ladder with
// its own tests and design; this is just enough decision-making for a
// Phase 05 local match to have an opponent. Not part of packages/engine
// (CLAUDE.md rule 4's determinism ban is scoped to packages/engine only —
// see eslint.config.js), so it's free to use Math.random for variety.

interface Candidate {
  action: PlayerAction;
  looksLethal: boolean;
}

/** Every top-level effect a direct hit could plausibly deal — enough for a rough "would this kill them" guess, not a full simulation. */
function flatDamageAmount(effects: readonly Effect[]): number {
  let total = 0;
  for (const effect of effects) {
    if (effect.kind === "damage") total += effect.amount;
    else if (effect.kind === "sequence") total += flatDamageAmount(effect.effects);
  }
  return total;
}

function candidatesForCharacter(
  state: BattleState,
  playerId: string,
  characterId: string,
  abilities: Record<string, Ability>,
): Candidate[] {
  const character = state.characters[characterId];
  if (!character?.alive) return [];

  const everyCharacterId = state.teams.flatMap((team) => team.characterIds);
  const candidates: Candidate[] = [];

  for (const abilityId of character.abilityIds) {
    const ability = abilities[abilityId];
    if (!ability) continue;

    // "single"-scope abilities need an explicit target guess (even a
    // self-targeted one — see packages/engine/src/targeting.ts); every other
    // scope resolves its own targets, so an empty guess is enough.
    const targetGuesses: string[][] = ability.target.scope === "single" ? everyCharacterId.map((id) => [id]) : [[]];

    for (const targetIds of targetGuesses) {
      const action: PlayerAction = { playerId, characterId, abilityId, targetIds };
      if (validateAction(state, action, abilities).length > 0) continue;

      const targetId = targetIds[0];
      const target = targetId ? state.characters[targetId] : undefined;
      const looksLethal = !!target && flatDamageAmount(ability.effects) >= target.currentHp;
      candidates.push({ action, looksLethal });

      // Only the first legal explicit target matters for "single" scope
      // once we've found one guess that validates for THIS ability+target
      // pair; move on rather than re-testing the same ability against every
      // other character too (each target is still its own candidate above).
    }
  }
  return candidates;
}

function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Chooses one action per living character on `playerId`'s team: prefers a
 * lethal-looking option when one exists, otherwise picks uniformly among
 * every legal (ability, target) combination. A character with no legal
 * action simply doesn't act this turn (the same as a human choosing to
 * pass), rather than forcing an illegal submission.
 */
export function decideSimpleBotActions(state: BattleState, playerId: string, abilities: Record<string, Ability>): PlayerAction[] {
  const team = state.teams.find((t) => t.playerId === playerId);
  if (!team) return [];

  const actions: PlayerAction[] = [];
  for (const characterId of team.characterIds) {
    const candidates = candidatesForCharacter(state, playerId, characterId, abilities);
    if (candidates.length === 0) continue;
    const lethal = candidates.filter((c) => c.looksLethal);
    const chosen = pickRandom(lethal.length > 0 ? lethal : candidates);
    if (chosen) actions.push(chosen.action);
  }
  return actions;
}
