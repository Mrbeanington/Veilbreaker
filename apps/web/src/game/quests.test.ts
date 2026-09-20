import { describe, expect, it } from "vitest";
import { CHARACTER_LIBRARY, PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { createDefaultProfile, levelForXp, type Profile } from "@veilbreak/persistence";
import { applyMatchProgress, LEGEND_TRIALS, trialAvailable, type ProgressMatch } from "./progression";
import { isUnlocked, isStarter, rolesOf } from "./knowledge";
import {
  FIRST_LEGEND_LEVEL,
  LEGEND_ORDER,
  NAMELESS_ID,
  QUESTS,
  QUEST_MISSIONS,
  STARTER_IDS,
  legendTrialOpen,
  lockedHint,
  opponentPool,
  questStatus,
  unlockHint,
} from "./quests";

// ADR-038: unlock quests.

const fresh = (): Profile => createDefaultProfile();
const atLevel = (level: number, p: Profile = fresh()): Profile => ({ ...p, xp: (100 * level * (level - 1)) / 2 });
const withDiscovered = (p: Profile, ...ids: string[]): Profile => ({ ...p, discovered: { ...p.discovered, characters: [...p.discovered.characters, ...ids] } });

const match = (teamAIds: string[], over: Partial<ProgressMatch> = {}): ProgressMatch => ({
  teamAIds,
  teamBIds: ["zeiron", "koschei", "the-gambler"],
  winnerPlayerId: "playerA",
  humanTeams: ["A"],
  eventLog: [],
  mode: "bot",
  turns: 10,
  finalCharacters: Object.fromEntries(teamAIds.map((id) => [id, { hp: 50, alive: true }])),
  ...over,
});

// Every team of three starters that could plausibly be played: the search space for "is this step possible?".
const STARTERS = [...STARTER_IDS];
const TEAMS: string[][] = [];
for (let i = 0; i < STARTERS.length; i += 1) for (let j = i + 1; j < STARTERS.length; j += 1) for (let k = j + 1; k < STARTERS.length; k += 1) TEAMS.push([STARTERS[i]!, STARTERS[j]!, STARTERS[k]!]);

function satisfyingTeam(step: (typeof QUEST_MISSIONS)[number]): string[] | undefined {
  const p = fresh();
  return TEAMS.find((team) => step.advance(0, p, match(team)) > 0);
}

describe("the starter roster", () => {
  it("is about two dozen fighters: every Core fighter plus a healer", () => {
    expect(STARTER_IDS.length).toBeGreaterThanOrEqual(22);
    expect(STARTER_IDS.length).toBeLessThanOrEqual(26);
    for (const c of PLAYABLE_CHARACTERS.filter((x) => x.rarity === "CORE")) expect(STARTER_IDS).toContain(c.id);
    expect(STARTER_IDS).toContain("the-moon-rabbit");
  });

  it("can field every main role, so a new player can build a real team", () => {
    const roles = new Set(STARTER_IDS.flatMap((id) => rolesOf(CHARACTER_LIBRARY[id]!)));
    for (const role of ["ATTACKER", "TANK", "DEFENDER", "CONTROLLER", "ASSASSIN", "BRUISER", "SUPPORT", "HEALER", "ANTI-HEALER"]) expect(roles.has(role), role).toBe(true);
  });

  it("are the only fighters open on a new account, apart from Legends' trials", () => {
    const p = fresh();
    for (const c of PLAYABLE_CHARACTERS) expect(isUnlocked(c, p), c.id).toBe(isStarter(c));
  });
});

describe("the quest table", () => {
  it("gives every other fighter a quest, and no starter or the Nameless One one", () => {
    for (const c of PLAYABLE_CHARACTERS) {
      const expected = !isStarter(c) && c.id !== NAMELESS_ID;
      expect(Boolean(QUESTS[c.id]), c.id).toBe(expected);
    }
  });

  it("has one to three steps, unique ids and sensible goals", () => {
    const ids = new Set<string>();
    for (const quest of Object.values(QUESTS)) {
      expect(quest.steps.length).toBeGreaterThanOrEqual(1);
      expect(quest.steps.length).toBeLessThanOrEqual(3);
      for (const step of quest.steps) {
        expect(ids.has(step.id), step.id).toBe(false);
        ids.add(step.id);
        expect(step.goal).toBeGreaterThanOrEqual(1);
        expect(step.goal).toBeLessThanOrEqual(5);
        expect(step.unlocks).toBe(quest.characterId);
        expect(step.description.length).toBeGreaterThan(10);
      }
    }
  });

  it("does not repeat the same kind of step inside one quest", () => {
    for (const quest of Object.values(QUESTS)) {
      const titles = quest.steps.map((s) => s.title);
      expect(new Set(titles).size, quest.characterId).toBe(titles.length);
    }
  });

  it("opens the simplest Rare fighters first and the Legends one level at a time", () => {
    const rares = Object.values(QUESTS).filter((q) => q.kind === "rare");
    expect(Math.min(...rares.map((q) => q.level))).toBe(1);
    const legends = LEGEND_ORDER.filter((id) => id !== NAMELESS_ID).map((id) => QUESTS[id]!.level);
    expect(legends).toEqual(legends.map((_, i) => FIRST_LEGEND_LEVEL + i));
    // Secrets never open before the first Legend's level would matter, and none is available at level 1.
    expect(Object.values(QUESTS).filter((q) => q.kind === "secret").every((q) => q.level >= 3)).toBe(true);
  });

  it("is possible to finish: every step can be advanced by a team of starters", () => {
    const impossible = QUEST_MISSIONS.filter((step) => !satisfyingTeam(step)).map((s) => `${s.id}: ${s.description}`);
    expect(impossible).toEqual([]);
  });
});

describe("finishing a quest", () => {
  const rare = Object.values(QUESTS).find((q) => q.kind === "rare" && q.level === 1)!;
  const play = (p: Profile, step: (typeof rare.steps)[number]) => {
    const team = satisfyingTeam(step)!;
    let profile = p;
    let unlocked: string[] = [];
    for (let i = 0; i < step.goal; i += 1) {
      const r = applyMatchProgress(profile, match(team), undefined, i + 1);
      profile = r.profile;
      unlocked = [...unlocked, ...r.report.fightersUnlocked];
    }
    return { profile, unlocked };
  };

  it("unlocks the fighter only once every step is done, and says so in the match report", () => {
    let profile = fresh();
    expect(isUnlocked(CHARACTER_LIBRARY[rare.characterId]!, profile)).toBe(false);
    let unlocked: string[] = [];
    for (const step of rare.steps) {
      const before = isUnlocked(CHARACTER_LIBRARY[rare.characterId]!, profile);
      expect(before).toBe(false);
      const out = play(profile, step);
      profile = out.profile;
      unlocked = [...unlocked, ...out.unlocked];
    }
    expect(isUnlocked(CHARACTER_LIBRARY[rare.characterId]!, profile)).toBe(true);
    expect(profile.unlocks.fighters).toContain(rare.characterId);
    expect(unlocked).toContain(rare.characterId);
    expect(questStatus(profile, rare.characterId)?.complete).toBe(true);
  });

  it("does not count matches before the quest's level is reached", () => {
    const locked = Object.values(QUESTS).find((q) => q.kind === "rare" && q.level >= 3)!;
    const step = locked.steps[0]!;
    const team = satisfyingTeam(step)!;
    const r = applyMatchProgress(atLevel(1), match(team), undefined, 1);
    expect(r.profile.missions.progress[step.id] ?? 0).toBe(0);
    const later = applyMatchProgress(atLevel(locked.level), match(team), undefined, 1);
    expect(later.profile.missions.progress[step.id] ?? 0).toBeGreaterThan(0);
  });

  it("does not count a Secret's steps until it has been met, and meeting it alone unlocks nothing", () => {
    const secret = Object.values(QUESTS).find((q) => q.kind === "secret")!;
    const step = secret.steps[0]!;
    const team = satisfyingTeam(step)!;
    const p = atLevel(secret.level);
    expect(applyMatchProgress(p, match(team), undefined, 1).profile.missions.progress[step.id] ?? 0).toBe(0);
    const met = withDiscovered(p, secret.characterId);
    expect(isUnlocked(CHARACTER_LIBRARY[secret.characterId]!, met)).toBe(false);
    expect(applyMatchProgress(met, match(team), undefined, 1).profile.missions.progress[step.id] ?? 0).toBeGreaterThan(0);
  });

  it("a match against a fighter reveals it in the Codex but never unlocks it", () => {
    const r = applyMatchProgress(atLevel(9), match(STARTERS.slice(0, 3), { teamBIds: ["koschei", "zeiron", "the-gambler"] }), undefined, 1);
    expect(r.profile.discovered.characters).toContain("koschei");
    expect(isUnlocked(CHARACTER_LIBRARY.koschei!, r.profile)).toBe(false);
    expect(isUnlocked(CHARACTER_LIBRARY.zeiron!, r.profile)).toBe(false);
  });

  it("losing never advances a quest", () => {
    const step = rare.steps[0]!;
    const team = satisfyingTeam(step)!;
    const r = applyMatchProgress(fresh(), match(team, { winnerPlayerId: "playerB" }), undefined, 1);
    expect(r.profile.missions.progress[step.id] ?? 0).toBe(0);
  });
});

describe("Legend trials", () => {
  const trial = LEGEND_TRIALS.find((t) => t.legendId === "zeiron")!;

  it("stay closed on a new account, and need both the level and the quest", () => {
    expect(trialAvailable(fresh(), trial)).toBe(false);
    const levelOnly = atLevel(FIRST_LEGEND_LEVEL);
    expect(legendTrialOpen(levelOnly, "zeiron")).toBe(false);
    const done: Profile = { ...levelOnly, missions: { progress: {}, completed: QUESTS.zeiron!.steps.map((s) => s.id) } };
    expect(legendTrialOpen(done, "zeiron")).toBe(true);
    const questOnly: Profile = { ...fresh(), missions: done.missions };
    expect(legendTrialOpen(questOnly, "zeiron")).toBe(false);
  });

  it("older saves keep every trial open", () => {
    const older: Profile = { ...fresh(), unlocks: { ...fresh().unlocks, model: 1 } };
    for (const t of LEGEND_TRIALS.filter((x) => x.legendId !== NAMELESS_ID)) expect(trialAvailable(older, t)).toBe(true);
    expect(isUnlocked(CHARACTER_LIBRARY["hydra"]!, older)).toBe(true);
    expect(isUnlocked(CHARACTER_LIBRARY.zeiron!, older)).toBe(false); // a Legend is still won, not granted
  });

  it("keep the Nameless One sealed behind the other eleven", () => {
    expect(trialAvailable({ ...atLevel(30), unlocks: { ...fresh().unlocks, legends: [...LEGEND_ORDER].filter((id) => id !== NAMELESS_ID).slice(0, 10) } }, LEGEND_TRIALS.find((t) => t.legendId === NAMELESS_ID)!)).toBe(false);
  });
});

describe("what the bots field against you", () => {
  const all = PLAYABLE_CHARACTERS;
  it("leaves out Secrets and Legends until you are ready for them", () => {
    const low = opponentPool(fresh(), all);
    expect(low.some((c) => c.rarity === "SECRET" || c.rarity === "LEGENDARY")).toBe(false);
    expect(opponentPool(atLevel(3), all).some((c) => c.rarity === "SECRET")).toBe(true);
    expect(opponentPool(atLevel(3), all).some((c) => c.rarity === "LEGENDARY")).toBe(false);
    expect(opponentPool(atLevel(FIRST_LEGEND_LEVEL), all).some((c) => c.rarity === "LEGENDARY")).toBe(true);
    expect(levelForXp(atLevel(4).xp)).toBe(4);
  });
  it("is unchanged for an older save", () => {
    const older: Profile = { ...fresh(), unlocks: { ...fresh().unlocks, model: 1 } };
    expect(opponentPool(older, all)).toHaveLength(all.length);
  });
});

describe("hints", () => {
  it("say what to do next for a locked fighter", () => {
    const rare = Object.values(QUESTS).find((q) => q.kind === "rare" && q.level === 1)!;
    const c = CHARACTER_LIBRARY[rare.characterId]!;
    expect(lockedHint(c, fresh())).toMatch(/Quest: 0 of \d steps/);
    expect(unlockHint(CHARACTER_LIBRARY["hydra"]!, fresh())).toBe("Available from the start.");
    expect(lockedHint(CHARACTER_LIBRARY.zeiron!, fresh())).toMatch(/Reach level 4/);
    const secret = CHARACTER_LIBRARY.koschei!;
    expect(lockedHint(secret, fresh())).toMatch(/Meet it in a match/);
  });
});
