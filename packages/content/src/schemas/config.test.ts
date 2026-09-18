import { describe, expect, it } from "vitest";
import { resolutionOrderSchema } from "./config";
import resolutionOrderJson from "../config/resolution-order.json";

describe("resolutionOrderSchema", () => {
  it("accepts the shipped default resolution order (15 tiers, spec/01)", () => {
    const result = resolutionOrderSchema.parse(resolutionOrderJson);
    expect(result.tiers).toHaveLength(15);
  });

  it("rejects duplicate tier order values", () => {
    const malformed = {
      tiers: [
        { id: "a", order: 1, displayName: "A" },
        { id: "b", order: 1, displayName: "B" },
      ],
    };
    expect(() => resolutionOrderSchema.parse(malformed)).toThrow();
  });

  it("rejects duplicate tier ids", () => {
    const malformed = {
      tiers: [
        { id: "a", order: 1, displayName: "A" },
        { id: "a", order: 2, displayName: "B" },
      ],
    };
    expect(() => resolutionOrderSchema.parse(malformed)).toThrow();
  });
});
