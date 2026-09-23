import { describe, expect, it } from "vitest";
import { describeCondition, generateAbilityTooltip } from "./tooltip";
import { FORTRESS_SHELL, SHELL_BASH, SHELLQUAKE } from "./data/characters/tortuga-rex";
import { BORROWED_LIFE } from "./data/characters/malachar";
import { SERPENT_BITE } from "./data/characters/hydra";

describe("generateAbilityTooltip", () => {
  it("states cost, cooldown, and the effect in plain English", () => {
    expect(generateAbilityTooltip(SHELL_BASH)).toBe("Cost: 2 Focus. Cooldown: 0 turn(s). Deal 30 normal damage.");
  });

  it("describes an applied status with its magnitude and duration", () => {
    expect(generateAbilityTooltip(FORTRESS_SHELL)).toBe(
      "Cost: 1 Might, 1 Focus. Cooldown: 2 turn(s). Apply Damage Reduction (30) for 2 turn(s).",
    );
  });

  it("describes a conditional effect's both branches, naming the actual condition", () => {
    const tooltip = generateAbilityTooltip(SHELLQUAKE);
    expect(tooltip).toContain("If you have Damage Reduction:");
    expect(tooltip).toContain("Deal 40 normal damage.");
    expect(tooltip).toContain("Otherwise:");
    expect(tooltip).toContain("Deal 10 normal damage.");
  });

  it("names each branch of a nested conditional by its own condition, not a generic label", () => {
    const tooltip = generateAbilityTooltip(SERPENT_BITE);
    expect(tooltip).toContain("If your Heads is at least 5: Deal 40 normal damage.");
    expect(tooltip).toContain("Otherwise: If your Heads is at least 3: Deal 25 normal damage.");
    expect(tooltip).toContain("Otherwise: Deal 12 normal damage.");
    expect(tooltip).not.toContain("a condition holds");
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

describe("describeCondition — names option (ADR-056: the battle log's third-person phrasing)", () => {
  it("defaults to second person, unchanged, for the tooltip's own use", () => {
    expect(describeCondition({ type: "hasStatus", target: "self", statusId: "status.damage-reduction" })).toBe("you have Damage Reduction");
  });

  it("swaps in a real name for a TargetRef given in `names`, everywhere that TargetRef appears", () => {
    const clause = describeCondition({ type: "resourceAtLeast", target: "self", resourceId: "resource.heads", amount: 5 }, { self: "Hydra" });
    expect(clause).toBe("Hydra's Heads is at least 5");
  });

  it("uses singular 'has' (not 'have') once a real name replaces 'you'", () => {
    const clause = describeCondition({ type: "hasStatus", target: "self", statusId: "status.damage-reduction" }, { self: "Tortuga Rex" });
    expect(clause).toBe("Tortuga Rex has Damage Reduction");
  });

  it("leaves an un-named TargetRef on the generic default even when other refs are named", () => {
    const clause = describeCondition({ type: "hasStatus", target: "enemy", statusId: "status.stun" }, { self: "Hydra" });
    expect(clause).toBe("an enemy has Stun");
  });
});
