import { describe, expect, it } from "vitest";
import { BOT_LEVELS } from "./index";

describe("packages/ai scaffold", () => {
  it("defines the bot levels from spec/06", () => {
    expect(BOT_LEVELS).toContain("LEGEND_BOSS");
  });
});
