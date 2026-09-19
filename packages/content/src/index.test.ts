import { describe, expect, it } from "vitest";
import { GAME_TITLE, RESOURCE_LIBRARY, defaultEnergyRules, defaultMatchFormat, defaultResolutionOrder } from "./index";

describe("content package barrel", () => {
  it("exposes exactly one GAME_TITLE constant", () => {
    expect(GAME_TITLE.length).toBeGreaterThan(0);
  });

  it("loads and validates the default configs at import time", () => {
    expect(defaultMatchFormat.teamSize).toBe(3);
    expect(defaultEnergyRules.poolCap).toBe(10);
    expect(defaultResolutionOrder.tiers).toHaveLength(15);
  });

  it("RESOURCE_LIBRARY collects every character's custom resources", () => {
    expect(RESOURCE_LIBRARY["resource.souls"]?.displayName).toBe("Souls");
    expect(RESOURCE_LIBRARY["resource.bases"]?.displayName).toBe("Bases");
    expect(RESOURCE_LIBRARY["resource.nine-lives"]?.displayName).toBe("Lives Remaining");
    expect(RESOURCE_LIBRARY["resource.outbreak-progress"]?.displayName).toBe("Outbreak Progress");
  });
});
