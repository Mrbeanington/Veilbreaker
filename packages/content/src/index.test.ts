import { describe, expect, it } from "vitest";
import { GAME_TITLE, defaultEnergyRules, defaultMatchFormat, defaultResolutionOrder } from "./index";

describe("content package barrel", () => {
  it("exposes exactly one GAME_TITLE constant", () => {
    expect(GAME_TITLE.length).toBeGreaterThan(0);
  });

  it("loads and validates the default configs at import time", () => {
    expect(defaultMatchFormat.teamSize).toBe(3);
    expect(defaultEnergyRules.poolCap).toBe(10);
    expect(defaultResolutionOrder.tiers).toHaveLength(15);
  });
});
