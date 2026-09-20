import { describe, expect, it } from "vitest";
import { CHARACTER_LIBRARY, PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { BOT_LEVELS } from "@veilbreak/ai";
import { isStarter } from "./knowledge";
import { TUTORIAL_BOT_LEVEL, TUTORIAL_FOE, TUTORIAL_TEAM, TUTORIAL_TIP_IDS, tutorialTip, type TutorialContext } from "./tutorial";

const ctx = (over: Partial<TutorialContext> = {}): TutorialContext => ({ turn: 1, choosingTarget: false, ready: 3, decided: 0, ...over });

describe("tutorial match setup", () => {
  it("gives the player three starters, so nothing needs to be unlocked first", () => {
    expect(TUTORIAL_TEAM).toHaveLength(3);
    for (const id of TUTORIAL_TEAM) expect(isStarter(CHARACTER_LIBRARY[id]!), id).toBe(true);
  });
  it("faces three real, playable, different starters on an easy bot", () => {
    expect(new Set(TUTORIAL_FOE).size).toBe(3);
    for (const id of TUTORIAL_FOE) expect(PLAYABLE_CHARACTERS.some((c) => c.id === id), id).toBe(true);
    expect(TUTORIAL_FOE.some((id) => TUTORIAL_TEAM.includes(id))).toBe(false);
    expect(BOT_LEVELS).toContain(TUTORIAL_BOT_LEVEL);
    expect(TUTORIAL_BOT_LEVEL).toBe("BEGINNER");
  });
  it("brings a tank, an attacker and a healer", () => {
    const tags = TUTORIAL_TEAM.flatMap((id) => CHARACTER_LIBRARY[id]!.tags);
    for (const role of ["TANK", "HEALER"]) expect(tags).toContain(role);
    expect(tags.some((t) => t === "ATTACKER" || t === "BRUISER")).toBe(true);
  });
});

describe("tutorial tips", () => {
  it("walks through the first turn in order", () => {
    expect(tutorialTip(ctx()).id).toBe("ability");
    expect(tutorialTip(ctx({ choosingTarget: true })).id).toBe("target");
    expect(tutorialTip(ctx({ decided: 1 })).id).toBe("next");
    expect(tutorialTip(ctx({ decided: 3 })).id).toBe("lock");
  });
  it("explains the log after the first turn, then cooldowns and statuses", () => {
    expect(tutorialTip(ctx({ turn: 2 })).id).toBe("log");
    expect(tutorialTip(ctx({ turn: 2, decided: 1 })).id).toBe("extras");
    expect(tutorialTip(ctx({ turn: 2, decided: 3 })).id).toBe("lock");
  });
  it("ends on the goal, and still asks for a confirm when everyone has an action", () => {
    expect(tutorialTip(ctx({ turn: 5 })).id).toBe("goal");
    expect(tutorialTip(ctx({ turn: 5, decided: 3 })).id).toBe("lock");
  });
  it("keeps every tip short enough to read at a glance", () => {
    for (const id of TUTORIAL_TIP_IDS) {
      const tip = [ctx(), ctx({ choosingTarget: true }), ctx({ decided: 1 }), ctx({ decided: 3 }), ctx({ turn: 2 }), ctx({ turn: 2, decided: 1 }), ctx({ turn: 4 })].map(tutorialTip).find((t) => t.id === id)!;
      expect(tip.title.length).toBeLessThan(40);
      expect(tip.text.length).toBeLessThan(320);
    }
  });
  it("copes with a turn where nobody can act", () => {
    expect(tutorialTip(ctx({ ready: 0, decided: 0 })).id).toBe("ability");
  });
});
