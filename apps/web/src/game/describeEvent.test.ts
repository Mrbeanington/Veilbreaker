import { describe, expect, it } from "vitest";
import type { BattleEvent } from "@veilbreak/engine";
import { describeBattleEvent } from "./describeEvent";

function ev(type: string, extra: Partial<BattleEvent> = {}): BattleEvent {
  return { turn: 1, tierId: "standard-attacks-support", turnRelativeSequence: 0, type, knowledgeLevel: "PUBLIC", payload: {}, ...extra };
}

describe("describeBattleEvent — conditionResolved (ADR-056)", () => {
  it("names the condition in the third person, using the event's own source as the name for a self-targeted condition", () => {
    const text = describeBattleEvent(
      ev("conditionResolved", {
        sourceId: "hydra",
        targetId: "the-scarecrow",
        payload: { isTrue: false, abilityId: "ability.hydra.serpent-bite", condition: { type: "resourceAtLeast", target: "self", resourceId: "resource.heads", amount: 5 } },
      }),
    );
    expect(text).toBe("Condition not met: Hydra's Heads is at least 5.");
  });

  it("says 'Condition met' for the true branch", () => {
    const text = describeBattleEvent(
      ev("conditionResolved", {
        sourceId: "tortuga-rex",
        payload: { isTrue: true, condition: { type: "hasStatus", target: "self", statusId: "status.damage-reduction" } },
      }),
    );
    expect(text).toBe("Condition met: Tortuga Rex has Damage Reduction.");
  });

  it("is silently dropped if a payload is somehow missing its condition, rather than crashing the log", () => {
    expect(describeBattleEvent(ev("conditionResolved", { sourceId: "hydra", payload: { isTrue: true } }))).toBeNull();
  });
});
