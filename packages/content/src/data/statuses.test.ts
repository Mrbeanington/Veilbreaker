import { describe, expect, it } from "vitest";
import { statusDefinitionSchema } from "../schemas/status";
import { STATUS_LIBRARY } from "./statuses";

describe("STATUS_LIBRARY", () => {
  it("contains the full spec/02 initial library (32 statuses)", () => {
    expect(Object.keys(STATUS_LIBRARY)).toHaveLength(32);
  });

  it("every entry is a valid, self-consistent StatusDefinition", () => {
    for (const [id, def] of Object.entries(STATUS_LIBRARY)) {
      expect(() => statusDefinitionSchema.parse(def)).not.toThrow();
      expect(def.id).toBe(id);
    }
  });

  it("has no duplicate ids", () => {
    const ids = Object.values(STATUS_LIBRARY).map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tags exactly the DoT statuses with tickBehavior: damageOverTime", () => {
    const dots = Object.values(STATUS_LIBRARY).filter((d) => d.tickBehavior === "damageOverTime");
    expect(dots.map((d) => d.id).sort()).toEqual(["status.bleed", "status.burn", "status.poison"]);
  });
});
