import {
  ANTI_HEAL,
  COUNTER,
  DAMAGE_AMPLIFICATION,
  DAMAGE_REDUCTION,
  DEATH_PREVENTION,
  HEALING_AMPLIFICATION,
  HEALING_REDUCTION,
  INVULNERABLE,
  REFLECT,
  SHIELD,
  UNHEALABLE,
  WEAKNESS,
  type CharacterRuntimeState,
  type DamageType,
  type HealingClass,
  type SummonRuntimeState,
} from "@veilbreak/content";
import { getEffectiveMagnitude, hasStatus, removeStatusFromCharacter, setStatusMagnitude } from "./statuses";
import { findAbsorbingSummon } from "./summons";
import type { AppliedEvent } from "./types";

export interface DamageResolution {
  characters: Record<string, CharacterRuntimeState>;
  summons: Record<string, SummonRuntimeState>;
  events: AppliedEvent[];
}

export interface CharacterMapResult {
  characters: Record<string, CharacterRuntimeState>;
  events: AppliedEvent[];
}

function getOrThrow(
  characters: Record<string, CharacterRuntimeState>,
  characterId: string,
  callerName: string,
): CharacterRuntimeState {
  const character = characters[characterId];
  if (!character) {
    throw new Error(`${callerName}: unreachable — unknown character "${characterId}"`);
  }
  return character;
}

function addStat(
  characters: Record<string, CharacterRuntimeState>,
  characterId: string,
  key: "damageDealt" | "damageReceived" | "healingDone",
  amount: number,
): Record<string, CharacterRuntimeState> {
  const character = characters[characterId];
  if (!character || amount <= 0) return characters;
  return { ...characters, [characterId]: { ...character, stats: { ...character.stats, [key]: character.stats[key] + amount } } };
}

/**
 * spec/02 death, resurrection, and death-adjacent rules + phase-03-advanced
 * -systems.md "death prevention (floor at 1 HP)": Aurelia's kind of passive
 * — the killing blow is clamped to 1 HP instead, and the status is consumed
 * (one save per application, not a standing immunity).
 */
function applyHp(
  characters: Record<string, CharacterRuntimeState>,
  targetId: string,
  amount: number,
): { characters: Record<string, CharacterRuntimeState>; events: AppliedEvent[] } {
  const target = getOrThrow(characters, targetId, "applyHp");
  const rawNewHp = Math.max(0, target.currentHp - amount);
  if (rawNewHp > 0 || !hasStatus(target, DEATH_PREVENTION.id)) {
    return { characters: { ...characters, [targetId]: { ...target, currentHp: rawNewHp } }, events: [] };
  }
  const saved = removeStatusFromCharacter({ ...target, currentHp: 1 }, DEATH_PREVENTION.id);
  return {
    characters: { ...characters, [targetId]: saved },
    events: [{ type: "deathPrevented", targetId, payload: { wouldHaveTakenHpTo: rawNewHp } }],
  };
}

/**
 * spec/01 "Damage language" + phase-02-combat-primitives.md "damage
 * pipeline": invulnerable → reflect/counter → amplification/weakness →
 * damage reduction → shield → HP. See the DamageType doc comment in
 * @veilbreak/content for exactly which stages each damage type skips.
 * Summon-unaware — see `resolveDamage` below for the absorption check that
 * wraps this.
 */
function resolveDamageToCharacter(
  characters: Record<string, CharacterRuntimeState>,
  sourceId: string,
  targetId: string,
  rawAmount: number,
  damageType: DamageType,
): CharacterMapResult {
  const target = characters[targetId];
  if (!target || !target.alive) {
    return { characters, events: [] };
  }

  const events: AppliedEvent[] = [];
  let nextCharacters = characters;

  // 1. Invulnerable — blocks normal and piercing damage entirely.
  if (damageType !== "affliction" && hasStatus(target, INVULNERABLE.id)) {
    events.push({
      type: "damageBlocked",
      sourceId,
      targetId,
      payload: { reason: "invulnerable", amount: rawAmount, damageType },
    });
    return { characters: nextCharacters, events };
  }

  // 2. Reflect / Counter — normal and piercing only; affliction is unavoidable.
  if (damageType !== "affliction" && hasStatus(target, REFLECT.id)) {
    const source = nextCharacters[sourceId];
    if (source?.alive) {
      const reflected = applyHp(nextCharacters, sourceId, rawAmount);
      nextCharacters = addStat(
        addStat(reflected.characters, sourceId, "damageReceived", rawAmount),
        targetId,
        "damageDealt",
        rawAmount,
      );
      events.push(...reflected.events);
      events.push({ type: "damageReflected", sourceId: targetId, targetId: sourceId, payload: { amount: rawAmount } });
    }
    events.push({ type: "damageAvoided", sourceId, targetId, payload: { reason: "reflect", damageType } });
    return { characters: nextCharacters, events };
  }
  if (damageType !== "affliction" && hasStatus(target, COUNTER.id)) {
    const counterAmount = getEffectiveMagnitude(target, COUNTER.id);
    const source = nextCharacters[sourceId];
    if (source?.alive && counterAmount > 0) {
      const countered = applyHp(nextCharacters, sourceId, counterAmount);
      nextCharacters = addStat(
        addStat(countered.characters, sourceId, "damageReceived", counterAmount),
        targetId,
        "damageDealt",
        counterAmount,
      );
      events.push(...countered.events);
      events.push({ type: "counterDamage", sourceId: targetId, targetId: sourceId, payload: { amount: counterAmount } });
    }
    // The target still takes their own damage below — Counter adds to it,
    // it doesn't replace it (unlike Reflect, which fully redirects).
  }

  let amount = rawAmount;

  // 3. Amplification / Weakness — every damage type, including affliction.
  const currentTarget = getOrThrow(nextCharacters, targetId, "resolveDamage");
  const amplification = getEffectiveMagnitude(currentTarget, DAMAGE_AMPLIFICATION.id);
  const sourceForWeakness = nextCharacters[sourceId];
  const weakness = sourceForWeakness ? getEffectiveMagnitude(sourceForWeakness, WEAKNESS.id) : 0;
  amount = Math.max(0, amount + amplification - weakness);

  // 4. Damage reduction — normal only.
  if (damageType === "normal") {
    const reduction = getEffectiveMagnitude(getOrThrow(nextCharacters, targetId, "resolveDamage"), DAMAGE_REDUCTION.id);
    amount = Math.max(0, amount - reduction);
  }

  // 5. Shield — normal only.
  if (damageType === "normal") {
    const beforeShield = getOrThrow(nextCharacters, targetId, "resolveDamage");
    const shieldTotal = getEffectiveMagnitude(beforeShield, SHIELD.id);
    if (shieldTotal > 0) {
      const absorbed = Math.min(amount, shieldTotal);
      amount -= absorbed;
      const afterShield = setStatusMagnitude(beforeShield, SHIELD.id, shieldTotal - absorbed);
      nextCharacters = { ...nextCharacters, [targetId]: afterShield };
      if (absorbed > 0) {
        events.push({
          type: "damageAbsorbedByShield",
          sourceId,
          targetId,
          payload: { absorbed, remainingShield: shieldTotal - absorbed },
        });
      }
    }
  }

  // 6. HP.
  const applied = applyHp(nextCharacters, targetId, amount);
  nextCharacters = addStat(addStat(applied.characters, targetId, "damageReceived", amount), sourceId, "damageDealt", amount);
  events.push(...applied.events);
  events.push({ type: "damageDealt", sourceId, targetId, payload: { amount, damageType } });

  return { characters: nextCharacters, events };
}

/**
 * phase-03-advanced-systems.md "Summons": an attached (non-slot) summon
 * absorbs damage meant for its owner before the owner's own defensive
 * statuses ever see it — see docs/DECISIONS.md for why this runs first.
 * Overflow beyond the summon's remaining HP continues into the normal
 * pipeline against the owner.
 */
export function resolveDamage(
  characters: Record<string, CharacterRuntimeState>,
  summons: Record<string, SummonRuntimeState>,
  sourceId: string,
  targetId: string,
  rawAmount: number,
  damageType: DamageType,
): DamageResolution {
  if (damageType === "affliction") {
    const result = resolveDamageToCharacter(characters, sourceId, targetId, rawAmount, damageType);
    return { characters: result.characters, summons, events: result.events };
  }

  const absorbingSummon = findAbsorbingSummon(summons, targetId);
  if (!absorbingSummon) {
    const result = resolveDamageToCharacter(characters, sourceId, targetId, rawAmount, damageType);
    return { characters: result.characters, summons, events: result.events };
  }

  const absorbed = Math.min(rawAmount, absorbingSummon.currentHp);
  const remainingSummonHp = absorbingSummon.currentHp - absorbed;
  const summonAlive = remainingSummonHp > 0;
  const nextSummons = {
    ...summons,
    [absorbingSummon.instanceId]: { ...absorbingSummon, currentHp: remainingSummonHp, alive: summonAlive },
  };
  const events: AppliedEvent[] = [
    {
      type: "damageAbsorbedBySummon",
      sourceId,
      targetId,
      payload: { summonInstanceId: absorbingSummon.instanceId, absorbed, summonRemainingHp: remainingSummonHp },
    },
  ];
  if (!summonAlive) {
    events.push({ type: "summonDestroyed", targetId: absorbingSummon.instanceId, payload: { ownerCharacterId: targetId } });
  }

  const overflow = rawAmount - absorbed;
  if (overflow <= 0) {
    return { characters, summons: nextSummons, events };
  }
  const rest = resolveDamageToCharacter(characters, sourceId, targetId, overflow, damageType);
  return { characters: rest.characters, summons: nextSummons, events: [...events, ...rest.events] };
}

/**
 * spec/02 "Healing classes" + OQ-04: Anti-Heal blocks `heal` only;
 * lifeTransfer and setHp are unaffected by it. Healing Reduction/
 * Amplification affect both `heal` and `lifeTransfer`, never `setHp` — a
 * direct HP-set effect isn't "healing" in the mitigable sense.
 */
export function resolveHeal(
  characters: Record<string, CharacterRuntimeState>,
  sourceId: string,
  targetId: string,
  rawAmount: number,
  healingClass: HealingClass,
): CharacterMapResult {
  const target = characters[targetId];
  if (!target || !target.alive) {
    return { characters, events: [] };
  }

  if (healingClass === "heal" && (hasStatus(target, ANTI_HEAL.id) || hasStatus(target, UNHEALABLE.id))) {
    return {
      characters,
      events: [{ type: "healBlocked", sourceId, targetId, payload: { reason: hasStatus(target, UNHEALABLE.id) ? "unhealable" : "anti-heal", amount: rawAmount } }],
    };
  }

  let amount = rawAmount;
  if (healingClass === "heal" || healingClass === "lifeTransfer") {
    const reduction = getEffectiveMagnitude(target, HEALING_REDUCTION.id);
    const amplification = getEffectiveMagnitude(target, HEALING_AMPLIFICATION.id);
    amount = Math.max(0, amount - reduction + amplification);
  }

  const currentHp =
    healingClass === "setHp" ? Math.min(target.maxHp, Math.max(0, amount)) : Math.min(target.maxHp, target.currentHp + amount);
  const actuallyHealed = currentHp - target.currentHp;

  let nextCharacters: Record<string, CharacterRuntimeState> = { ...characters, [targetId]: { ...target, currentHp } };
  nextCharacters = addStat(nextCharacters, sourceId, "healingDone", Math.max(0, actuallyHealed));
  return {
    characters: nextCharacters,
    events: [{ type: "healed", sourceId, targetId, payload: { amount, healingClass } }],
  };
}
