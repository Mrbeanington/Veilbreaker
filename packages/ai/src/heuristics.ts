import type { Effect } from "@veilbreak/content";
import { canAct, type BattleState } from "@veilbreak/engine";
import type { Candidate } from "./candidates";

// Rough, data-driven reading of what an ability does. Bots never special-case a
// character id: everything comes from Effect data, so new content is played
// sensibly without touching the AI (CLAUDE.md rule 3 spirit).

const CONTROL_STATUSES = new Set(["status.stun", "status.silence", "status.petrification", "status.fear"]);
const DEBUFF_STATUSES = new Set([
  "status.anti-heal",
  "status.unhealable",
  "status.healing-reduction",
  "status.burn",
  "status.bleed",
  "status.poison",
  "status.infection",
  "status.weakness",
  "status.curse",
  "status.cooldown-increase",
  "status.ability-lock",
  "status.energy-lock",
  "status.damage-amplification",
  "status.mark",
  "status.exposed",
]);
const DEFENSIVE_STATUSES = new Set([
  "status.shield",
  "status.damage-reduction",
  "status.invulnerable",
  "status.untargetable",
  "status.death-prevention",
  "status.counter",
  "status.reflect",
  "status.taunt",
  "status.stealth",
]);

export interface EffectSummary {
  damage: number;
  heal: number;
  control: string[];
  debuffs: string[];
  defensive: string[];
  other: number;
}

export function summarizeEffects(effects: readonly Effect[]): EffectSummary {
  const out: EffectSummary = { damage: 0, heal: 0, control: [], debuffs: [], defensive: [], other: 0 };
  const visit = (list: readonly Effect[], weight: number): void => {
    for (const e of list) {
      switch (e.kind) {
        case "damage":
          out.damage += e.amount * weight;
          break;
        case "heal":
          out.heal += e.amount * weight;
          break;
        case "applyStatus":
          if (CONTROL_STATUSES.has(e.statusId)) out.control.push(e.statusId);
          else if (DEBUFF_STATUSES.has(e.statusId)) out.debuffs.push(e.statusId);
          else if (DEFENSIVE_STATUSES.has(e.statusId)) out.defensive.push(e.statusId);
          else out.other += 1;
          break;
        case "sequence":
          visit(e.effects, weight);
          break;
        case "conditional": {
          // Optimistic-but-hedged: assume the better branch half the time.
          const best = summarizeEffects(e.ifTrue);
          const worst = summarizeEffects(e.ifFalse ?? []);
          out.damage += ((best.damage + worst.damage) / 2) * weight;
          out.heal += ((best.heal + worst.heal) / 2) * weight;
          out.control.push(...best.control);
          out.debuffs.push(...best.debuffs);
          out.defensive.push(...best.defensive);
          out.other += best.other + worst.other;
          break;
        }
        case "randomOutcome": {
          const total = e.outcome.branches.reduce((s, b) => s + b.weight, 0) || 1;
          for (const b of e.outcome.branches) visit(b.effects, (weight * b.weight) / total);
          break;
        }
        default:
          out.other += 1;
      }
    }
  };
  visit(effects, 1);
  return out;
}

function livingIds(state: BattleState, ids: readonly string[]): string[] {
  return ids.filter((id) => state.characters[id]?.alive);
}

/** Who this candidate will actually affect, read from its target rule. */
export function likelyTargets(state: BattleState, c: Candidate): { ids: string[]; enemy: boolean } {
  const actorId = c.action.characterId;
  const myTeam = state.teams.find((t) => t.characterIds.includes(actorId));
  const theirTeam = state.teams.find((t) => t !== myTeam);
  const explicit = c.action.targetIds;
  if (c.ability.target.scope === "single" && explicit.length > 0) {
    const id = explicit[0] as string;
    return { ids: [id], enemy: !!theirTeam?.characterIds.includes(id) };
  }
  switch (c.ability.target.side) {
    case "self":
      return { ids: [actorId], enemy: false };
    case "ally":
      return { ids: livingIds(state, myTeam?.characterIds ?? []), enemy: false };
    default:
      return { ids: livingIds(state, theirTeam?.characterIds ?? []), enemy: true };
  }
}

const totalCost = (c: Candidate): number => {
  const k = c.ability.cost;
  return k.might + k.focus + k.spirit + k.chaos + k.neutral;
};

/** One number for "how good does this action look right now". `noise` diversifies the plans a lookahead bot compares. */
export function scoreCandidate(state: BattleState, c: Candidate, noise: number, random: () => number): number {
  const actor = state.characters[c.action.characterId];
  if (!actor) return -Infinity;
  const fx = summarizeEffects(c.ability.effects);
  const { ids, enemy } = likelyTargets(state, c);
  let score = -1.5 * totalCost(c);

  for (const id of ids) {
    const t = state.characters[id];
    if (!t) continue;
    if (enemy) {
      const dealt = Math.min(fx.damage, t.currentHp);
      score += dealt * (1 + (1 - t.currentHp / t.maxHp)); // finish wounded targets first
      if (fx.damage > 0 && fx.damage >= t.currentHp) score += 80;
      const disabled = !canAct(t);
      for (const _ of fx.control) score += disabled ? 2 : 30;
      for (const s of fx.debuffs) score += t.statuses.some((a) => a.statusId === s) ? 1 : 12;
    } else {
      if (fx.damage > 0) score -= 500; // never shoot your own team
      const missing = 1 - t.currentHp / t.maxHp;
      score += Math.min(fx.heal, t.maxHp - t.currentHp) * 0.8;
      for (const s of fx.defensive) score += t.statuses.some((a) => a.statusId === s) ? 0 : 10 + missing * 45;
    }
  }
  score += fx.other * 5;
  if (fx.damage === 0 && fx.heal === 0 && fx.control.length + fx.debuffs.length + fx.defensive.length + fx.other === 0) score -= 20;
  return score + random() * noise;
}
