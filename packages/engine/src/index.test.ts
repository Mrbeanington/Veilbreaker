import { describe, expect, it } from "vitest";
import { createBattle, createRng, nextUint32 } from "./index";

describe("packages/engine public API", () => {
  it("exposes createBattle and the RNG helpers from the barrel", () => {
    expect(typeof createBattle).toBe("function");
    const draw = nextUint32(createRng(1));
    expect(typeof draw.value).toBe("number");
  });
});
