import { describe, expect, it } from "vitest";
import { generateAbilityTooltip } from "./tooltip";
import { FORTRESS_SHELL, SHELL_BASH, SHELLQUAKE } from "./data/characters/tortuga-rex";
import { BORROWED_LIFE } from "./data/characters/malachar";

describe("generateAbilityTooltip", () => {
  it("states cost, cooldown, and the effect in plain English", () => {
    expect(generateAbilityTooltip(SHELL_BASH)).toBe("Cost: 2 Focus. Cooldown: 0 turn(s). Deal 30 normal damage.");
  });

  it("describes an applied status with its magnitude and duration", () => {
    expect(generateAbilityTooltip(FORTRESS_SHELL)).toBe(
      "Cost: 1 Might, 1 Focus. Cooldown: 2 turn(s). Apply Damage Reduction (30) for 2 turn(s).",
    );
  });

  it("describes a conditional effect's both branches", () => {
    const tooltip = generateAbilityTooltip(SHELLQUAKE);
    expect(tooltip).toContain("If a condition holds:");
    expect(tooltip).toContain("Deal 40 normal damage.");
    expect(tooltip).toContain("Otherwise:");
    expect(tooltip).toContain("Deal 10 normal damage.");
  });

  it("describes a multi-effect ability as a sequence of sentences", () => {
    const tooltip = generateAbilityTooltip(BORROWED_LIFE);
    expect(tooltip).toContain("Deal 30 normal damage.");
    expect(tooltip).toContain("Restore 20 HP (lifeTransfer).");
  });

  it("stays numerically honest when an ability's numbers change (no hand-written duplicate to drift)", () => {
    const bumped = { ...SHELL_BASH, effects: [{ ...SHELL_BASH.effects[0]!, amount: 999 }] };
    expect(generateAbilityTooltip(bumped)).toContain("999");
  });
});
