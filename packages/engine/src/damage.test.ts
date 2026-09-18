import { describe, expect, it } from "vitest";
import { STATUS_LIBRARY, type CharacterRuntimeState } from "@veilbreak/content";
import { resolveDamage, resolveHeal } from "./damage";
import { applyStatusToCharacter, getEffectiveMagnitude } from "./statuses";

const INVULNERABLE = STATUS_LIBRARY["status.invulnerable"]!;
const REFLECT = STATUS_LIBRARY["status.reflect"]!;
const COUNTER = STATUS_LIBRARY["status.counter"]!;
const DAMAGE_REDUCTION = STATUS_LIBRARY["status.damage-reduction"]!;
const SHIELD = STATUS_LIBRARY["status.shield"]!;
const DAMAGE_AMPLIFICATION = STATUS_LIBRARY["status.damage-amplification"]!;
const WEAKNESS = STATUS_LIBRARY["status.weakness"]!;
const ANTI_HEAL = STATUS_LIBRARY["status.anti-heal"]!;
const HEALING_REDUCTION = STATUS_LIBRARY["status.healing-reduction"]!;
const HEALING_AMPLIFICATION = STATUS_LIBRARY["status.healing-amplification"]!;

function char(id: string, hp = 100): CharacterRuntimeState {
  return { characterId: id, currentHp: hp, maxHp: 100, alive: true, cooldowns: {}, statuses: [] };
}

function withStatus(c: CharacterRuntimeState, def: (typeof STATUS_LIBRARY)[string], magnitude = 0): CharacterRuntimeState {
  return applyStatusToCharacter(c, def, { magnitude });
}

function pool(...chars: CharacterRuntimeState[]): Record<string, CharacterRuntimeState> {
  return Object.fromEntries(chars.map((c) => [c.characterId, c]));
}

describe("resolveDamage — invulnerable", () => {
  it("blocks normal damage entirely", () => {
    const characters = pool(char("source"), withStatus(char("target"), INVULNERABLE));
    const { characters: after, events } = resolveDamage(characters, "source", "target", 30, "normal");
    expect(after.target?.currentHp).toBe(100);
    expect(events[0]?.type).toBe("damageBlocked");
  });

  it("blocks piercing damage too", () => {
    const characters = pool(char("source"), withStatus(char("target"), INVULNERABLE));
    const { characters: after } = resolveDamage(characters, "source", "target", 30, "piercing");
    expect(after.target?.currentHp).toBe(100);
  });

  it("does not block affliction damage", () => {
    const characters = pool(char("source"), withStatus(char("target"), INVULNERABLE));
    const { characters: after } = resolveDamage(characters, "source", "target", 30, "affliction");
    expect(after.target?.currentHp).toBe(70);
  });
});

describe("resolveDamage — reflect and counter", () => {
  it("reflect redirects normal damage: target takes none, source takes it all", () => {
    const characters = pool(char("source"), withStatus(char("target"), REFLECT));
    const { characters: after } = resolveDamage(characters, "source", "target", 40, "normal");
    expect(after.target?.currentHp).toBe(100);
    expect(after.source?.currentHp).toBe(60);
  });

  it("counter deals extra damage back without preventing the target's own damage", () => {
    const characters = pool(char("source"), withStatus(char("target"), COUNTER, 15));
    const { characters: after } = resolveDamage(characters, "source", "target", 40, "normal");
    expect(after.target?.currentHp).toBe(60); // still takes the 40
    expect(after.source?.currentHp).toBe(85); // and deals 15 back
  });

  it("affliction damage bypasses reflect and counter", () => {
    const characters = pool(char("source"), withStatus(char("target"), REFLECT));
    const { characters: after } = resolveDamage(characters, "source", "target", 40, "affliction");
    expect(after.target?.currentHp).toBe(60);
    expect(after.source?.currentHp).toBe(100);
  });
});

describe("resolveDamage — amplification and weakness", () => {
  it("damage amplification on the target increases damage taken", () => {
    const characters = pool(char("source"), withStatus(char("target"), DAMAGE_AMPLIFICATION, 10));
    const { characters: after } = resolveDamage(characters, "source", "target", 30, "normal");
    expect(after.target?.currentHp).toBe(60); // 100 - (30 + 10)
  });

  it("weakness on the source decreases damage dealt", () => {
    const characters = pool(withStatus(char("source"), WEAKNESS, 10), char("target"));
    const { characters: after } = resolveDamage(characters, "source", "target", 30, "normal");
    expect(after.target?.currentHp).toBe(80); // 100 - (30 - 10)
  });

  it("amplification/weakness still apply to affliction damage", () => {
    const characters = pool(char("source"), withStatus(char("target"), DAMAGE_AMPLIFICATION, 10));
    const { characters: after } = resolveDamage(characters, "source", "target", 30, "affliction");
    expect(after.target?.currentHp).toBe(60);
  });

  it("net damage never goes negative", () => {
    const characters = pool(withStatus(char("source"), WEAKNESS, 999), char("target"));
    const { characters: after } = resolveDamage(characters, "source", "target", 30, "normal");
    expect(after.target?.currentHp).toBe(100);
  });
});

describe("resolveDamage — damage reduction vs. shield (phase-02 acceptance: their interaction)", () => {
  it("damage reduction lowers the amount before it ever reaches the shield", () => {
    // DR 10, Shield 15, incoming 30 normal damage.
    // DR first: 30 - 10 = 20. Shield then absorbs up to 15 of that 20,
    // leaving 5 to hit HP. Shield is left with 0 remaining (removed).
    let target = char("target");
    target = withStatus(target, DAMAGE_REDUCTION, 10);
    target = withStatus(target, SHIELD, 15);
    const characters = pool(char("source"), target);

    const { characters: after, events } = resolveDamage(characters, "source", "target", 30, "normal");
    expect(after.target?.currentHp).toBe(95); // 100 - 5
    expect(getEffectiveMagnitude(after.target!, SHIELD.id)).toBe(0);
    expect(events.some((e) => e.type === "damageAbsorbedByShield" && e.payload?.absorbed === 15)).toBe(true);
  });

  it("a shield with capacity left over than the hit survives, reduced by exactly the absorbed amount", () => {
    let target = char("target");
    target = withStatus(target, SHIELD, 50);
    const characters = pool(char("source"), target);

    const { characters: after } = resolveDamage(characters, "source", "target", 20, "normal");
    expect(after.target?.currentHp).toBe(100); // fully absorbed
    expect(getEffectiveMagnitude(after.target!, SHIELD.id)).toBe(30); // 50 - 20
  });

  it("piercing damage bypasses both damage reduction and shield", () => {
    let target = char("target");
    target = withStatus(target, DAMAGE_REDUCTION, 10);
    target = withStatus(target, SHIELD, 50);
    const characters = pool(char("source"), target);

    const { characters: after } = resolveDamage(characters, "source", "target", 30, "piercing");
    expect(after.target?.currentHp).toBe(70); // full 30, shield/DR both bypassed
    expect(getEffectiveMagnitude(after.target!, SHIELD.id)).toBe(50); // untouched
  });
});

describe("resolveHeal — healing classes and anti-heal (OQ-04)", () => {
  it("anti-heal blocks the 'heal' class entirely", () => {
    const characters = pool(withStatus(char("target", 50), ANTI_HEAL));
    const { characters: after, events } = resolveHeal(characters, "source", "target", 30, "heal");
    expect(after.target?.currentHp).toBe(50);
    expect(events[0]?.type).toBe("healBlocked");
  });

  it("anti-heal does not block lifeTransfer or setHp", () => {
    const characters = pool(withStatus(char("target", 50), ANTI_HEAL));
    const transferred = resolveHeal(characters, "source", "target", 30, "lifeTransfer");
    expect(transferred.characters.target?.currentHp).toBe(80);
    const set = resolveHeal(characters, "source", "target", 40, "setHp");
    expect(set.characters.target?.currentHp).toBe(40);
  });

  it("healing reduction lowers heal and lifeTransfer, but not setHp", () => {
    const characters = pool(withStatus(char("target", 50), HEALING_REDUCTION, 10));
    expect(resolveHeal(characters, "source", "target", 30, "heal").characters.target?.currentHp).toBe(70); // 50+(30-10)
    expect(resolveHeal(characters, "source", "target", 30, "lifeTransfer").characters.target?.currentHp).toBe(70);
    expect(resolveHeal(characters, "source", "target", 40, "setHp").characters.target?.currentHp).toBe(40);
  });

  it("healing amplification increases heal and lifeTransfer, but not setHp", () => {
    const characters = pool(withStatus(char("target", 50), HEALING_AMPLIFICATION, 10));
    expect(resolveHeal(characters, "source", "target", 30, "heal").characters.target?.currentHp).toBe(90); // 50+(30+10)
    expect(resolveHeal(characters, "source", "target", 40, "setHp").characters.target?.currentHp).toBe(40);
  });

  it("healing never exceeds max HP", () => {
    const characters = pool(char("target", 95));
    const { characters: after } = resolveHeal(characters, "source", "target", 30, "heal");
    expect(after.target?.currentHp).toBe(100);
  });
});
