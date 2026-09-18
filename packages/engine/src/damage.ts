import {
  ANTI_HEAL,
  COUNTER,
  DAMAGE_AMPLIFICATION,
  DAMAGE_REDUCTION,
  HEALING_AMPLIFICATION,
  HEALING_REDUCTION,
  INVULNERABLE,
  REFLECT,
  SHIELD,
  WEAKNESS,
  type CharacterRuntimeState,
  type DamageType,
  type HealingClass,
} from "@veilbreak/content";
import { getEffectiveMagnitude, hasStatus, setStatusMagnitude } from "./statuses";
import type { AppliedEvent } from "./types";

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

/**
 * spec/01 "Damage language" + phase-02-combat-primitives.md "damage
 * pipeline": invulnerable → reflect/counter → amplification/weakness →
 * damage reduction → shield → HP. See the DamageType doc comment in
 * @veilbreak/content for exactly which stages each damage type skips.
 */
export function resolveDamage(
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
      const reflectedHp = Math.max(0, source.currentHp - rawAmount);
      nextCharacters = { ...nextCharacters, [sourceId]: { ...source, currentHp: reflectedHp } };
      events.push({ type: "damageReflected", sourceId: targetId, targetId: sourceId, payload: { amount: rawAmount } });
    }
    events.push({ type: "damageAvoided", sourceId, targetId, payload: { reason: "reflect", damageType } });
    return { characters: nextCharacters, events };
  }
  if (damageType !== "affliction" && hasStatus(target, COUNTER.id)) {
    const counterAmount = getEffectiveMagnitude(target, COUNTER.id);
    const source = nextCharacters[sourceId];
    if (source?.alive && counterAmount > 0) {
      const counteredHp = Math.max(0, source.currentHp - counterAmount);
      nextCharacters = { ...nextCharacters, [sourceId]: { ...source, currentHp: counteredHp } };
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
  const finalTarget = getOrThrow(nextCharacters, targetId, "resolveDamage");
  const newHp = Math.max(0, finalTarget.currentHp - amount);
  nextCharacters = { ...nextCharacters, [targetId]: { ...finalTarget, currentHp: newHp } };
  events.push({ type: "damageDealt", sourceId, targetId, payload: { amount, damageType } });

  return { characters: nextCharacters, events };
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

  if (healingClass === "heal" && hasStatus(target, ANTI_HEAL.id)) {
    return {
      characters,
      events: [{ type: "healBlocked", sourceId, targetId, payload: { reason: "anti-heal", amount: rawAmount } }],
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

  const nextCharacters = { ...characters, [targetId]: { ...target, currentHp } };
  return {
    characters: nextCharacters,
    events: [{ type: "healed", sourceId, targetId, payload: { amount, healingClass } }],
  };
}
