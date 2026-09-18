import { describe, expect, it } from "vitest";
import { characterDefinitionSchema } from "./character";

const validCharacter = {
  id: "tortuga-rex",
  version: 1,
  displayName: "Tortuga Rex",
  rarity: "CORE",
  tags: ["TANK", "DEFENDER"],
  baseHp: 140,
  abilityIds: ["ability.tortuga-rex.shell-bash"],
};

describe("characterDefinitionSchema", () => {
  it("accepts a well-formed character", () => {
    const result = characterDefinitionSchema.parse(validCharacter);
    expect(result.id).toBe("tortuga-rex");
    expect(result.knowledgeLevel).toBe("PUBLIC");
    expect(result.isCheater).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { baseHp: _baseHp, ...malformed } = validCharacter;
    expect(() => characterDefinitionSchema.parse(malformed)).toThrow();
  });

  it("rejects a non-kebab-case id", () => {
    expect(() =>
      characterDefinitionSchema.parse({ ...validCharacter, id: "Tortuga_Rex" }),
    ).toThrow();
  });

  it("rejects an empty tags array", () => {
    expect(() => characterDefinitionSchema.parse({ ...validCharacter, tags: [] })).toThrow();
  });

  it("rejects a Cheater with no documented rule-break and counterplay (CLAUDE.md non-negotiable #8)", () => {
    expect(() =>
      characterDefinitionSchema.parse({ ...validCharacter, isCheater: true }),
    ).toThrow(/cheaterRuleBreak/);
  });

  it("accepts a Cheater that documents its rule-break and counterplay", () => {
    const result = characterDefinitionSchema.parse({
      ...validCharacter,
      isCheater: true,
      cheaterRuleBreak: "may change targets after actions are selected",
      counterplay: "the retarget is logged and only usable once every 3 turns",
    });
    expect(result.isCheater).toBe(true);
  });
});
