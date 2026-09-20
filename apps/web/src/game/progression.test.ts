import { describe, expect, it } from "vitest";
import { CHARACTER_LIBRARY, type BattleEvent } from "@veilbreak/content";
import { createDefaultProfile, levelForXp, type Profile } from "@veilbreak/persistence";
import {
  ACHIEVEMENTS,
  LEGEND_ORDER,
  LEGEND_TRIALS,
  MISSIONS,
  NAMELESS_ID,
  XP,
  applyMatchProgress,
  buildIdTable,
  legendUnlocked,
  namelessGateOpen,
  namelessUnlocked,
  trialAvailable,
  type ProgressMatch,
} from "./progression";
import { finishMatch } from "./finishMatch";
import { playRealMatch } from "./testing";
import { characterVisibility, isPickable } from "./knowledge";

const fresh = (): Profile => createDefaultProfile();
const ev = (type: string, extra: Partial<BattleEvent> = {}): BattleEvent => ({
  turn: 1,
  tierId: "standard-attacks-support",
  turnRelativeSequence: 0,
  type,
  payload: {},
  knowledgeLevel: "PUBLIC",
  ...extra,
});

const match = (over: Partial<ProgressMatch> = {}): ProgressMatch => ({
  teamAIds: ["tortuga-rex", "hydra", "malachar"],
  teamBIds: ["shiro", "koschei", "father-bell"],
  winnerPlayerId: "playerA",
  humanTeams: ["A"],
  eventLog: [],
  mode: "bot",
  turns: 20,
  finalCharacters: {},
  ...over,
});

describe("XP and account level", () => {
  it("a win, draw and loss award different xp, and new fighters add a bonus", () => {
    const win = applyMatchProgress(fresh(), match(), undefined, 1000);
    const loss = applyMatchProgress(fresh(), match({ winnerPlayerId: "playerB" }), undefined, 1000);
    const draw = applyMatchProgress(fresh(), match({ winnerPlayerId: null }), undefined, 1000);
    // 6 fighters met for the first time in each.
    expect(win.report.xpGained).toBeGreaterThanOrEqual(XP.win + 6 * XP.newFighter);
    expect(loss.report.xpGained).toBeLessThan(win.report.xpGained);
    expect(draw.report.xpGained).toBeLessThan(win.report.xpGained);
    expect(win.profile.xp).toBe(win.report.xpGained);
  });

  it("reports a level-up", () => {
    const p = { ...fresh(), xp: 95 };
    const r = applyMatchProgress(p, match(), undefined, 1);
    expect(r.report.levelBefore).toBe(1);
    expect(r.report.levelAfter).toBe(levelForXp(r.profile.xp));
    expect(r.report.levelAfter).toBeGreaterThan(1);
  });

  it("records match history (newest first, capped) and the last played time", () => {
    let p = fresh();
    for (let i = 0; i < 55; i += 1) p = applyMatchProgress(p, match(), `r-${i}`, 1000 + i).profile;
    expect(p.history).toHaveLength(50);
    expect(p.history[0]?.replayId).toBe("r-54");
    expect(p.lastPlayedAt).toBe(1054);
    expect(p.matchesPlayed).toBe(55);
  });
});

describe("missions and faction challenges", () => {
  it("First victory completes once and pays out once", () => {
    const first = applyMatchProgress(fresh(), match(), undefined, 1);
    expect(first.report.missionsCompleted).toContain("mission.first-victory");
    expect(first.profile.missions.completed).toContain("mission.first-victory");
    const second = applyMatchProgress(first.profile, match(), undefined, 2);
    expect(second.report.missionsCompleted).not.toContain("mission.first-victory");
  });

  it("a bot's victory is not a win for the profile", () => {
    const r = applyMatchProgress(fresh(), match({ winnerPlayerId: "playerB" }), undefined, 1);
    expect(r.profile.missions.completed).not.toContain("mission.first-victory");
    expect(r.profile.missions.progress["mission.regular"]).toBe(1); // but it still counts as a match played
  });

  it("counter missions accumulate across matches", () => {
    let p = fresh();
    for (let i = 0; i < 5; i += 1) p = applyMatchProgress(p, match(), undefined, i).profile;
    expect(p.missions.completed).toContain("mission.winning-streak");
  });

  it("Legend slayer needs a Legend on the losing team", () => {
    const vsLegend = applyMatchProgress(fresh(), match({ teamBIds: ["zeiron", "koschei", "father-bell"] }), undefined, 1);
    expect(vsLegend.profile.missions.completed).toContain("mission.legend-slayer");
    const noLegend = applyMatchProgress(fresh(), match({ teamBIds: ["koschei", "father-bell", "plague-doctor"] }), undefined, 1);
    expect(noLegend.profile.missions.completed).not.toContain("mission.legend-slayer");
  });

  it("Swift needs a win in 12 turns or fewer", () => {
    expect(applyMatchProgress(fresh(), match({ turns: 12 }), undefined, 1).profile.missions.completed).toContain("mission.swift");
    expect(applyMatchProgress(fresh(), match({ turns: 13 }), undefined, 1).profile.missions.completed).not.toContain("mission.swift");
  });

  it("faction chains exist per origin and advance when two or more teammates share it", () => {
    const factions = MISSIONS.filter((m) => m.faction);
    expect(factions.length).toBeGreaterThan(3);
    const med = factions.find((m) => m.faction === "Ancient Mediterranean" && m.goal === 1)!;
    // Hydra + Zeiron (both Mediterranean) on the winning team.
    const r = applyMatchProgress(fresh(), match({ teamAIds: ["hydra", "zeiron", "koschei"] }), undefined, 1);
    expect(r.profile.missions.completed).toContain(med.id);
    const single = applyMatchProgress(fresh(), match({ teamAIds: ["hydra", "koschei", "malachar"] }), undefined, 1);
    expect(single.profile.missions.completed).not.toContain(med.id);
  });

  it("every mission id is unique and has a positive goal and reward", () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    for (const m of MISSIONS) {
      expect(m.goal).toBeGreaterThan(0);
      expect(m.xp).toBeGreaterThan(0);
    }
  });
});

describe("secret achievements are pure functions of the match log", () => {
  const earned = (m: ProgressMatch) => ACHIEVEMENTS.filter((a) => a.earned(m)).map((a) => a.id);

  it("Hollow victory: win after two teammates fell", () => {
    const log = [ev("death", { targetId: "hydra" }), ev("death", { targetId: "malachar" })];
    expect(earned(match({ eventLog: log }))).toContain("achievement.hollow-victory");
    expect(earned(match({ eventLog: log.slice(0, 1) }))).not.toContain("achievement.hollow-victory");
    expect(earned(match({ eventLog: [ev("death", { targetId: "shiro" }), ev("death", { targetId: "koschei" })] }))).not.toContain("achievement.hollow-victory");
  });

  it("Clean hands: win without a direct blow (damage over time does not count)", () => {
    const dot = ev("damageDealt", { sourceId: "koschei", targetId: "koschei", payload: { amount: 5 } });
    expect(earned(match({ eventLog: [dot] }))).toContain("achievement.clean-hands");
    const blow = ev("damageDealt", { sourceId: "hydra", targetId: "shiro", payload: { amount: 30 } });
    expect(earned(match({ eventLog: [blow] }))).not.toContain("achievement.clean-hands");
    expect(earned(match({ winnerPlayerId: null }))).not.toContain("achievement.clean-hands");
  });

  it("Again and again: the same fighter resurrected twice", () => {
    const back = ev("resurrected", { targetId: "malachar" });
    expect(earned(match({ eventLog: [back, back] }))).toContain("achievement.again-and-again");
    expect(earned(match({ eventLog: [back] }))).not.toContain("achievement.again-and-again");
    expect(earned(match({ eventLog: [back, ev("resurrected", { targetId: "hydra" })] }))).not.toContain("achievement.again-and-again");
  });

  it("Full repertoire: one fighter uses every ability in a match", () => {
    const hydra = CHARACTER_LIBRARY.hydra!;
    const uses = hydra.abilityIds.map((abilityId) => ev("abilityUsed", { sourceId: "hydra", payload: { abilityId } }));
    expect(earned(match({ eventLog: uses }))).toContain("achievement.full-repertoire");
    expect(earned(match({ eventLog: uses.slice(1) }))).not.toContain("achievement.full-repertoire");
  });

  it("By a thread: a survivor on exactly 1 HP", () => {
    expect(earned(match({ finalCharacters: { hydra: { hp: 1, alive: true } } }))).toContain("achievement.by-a-thread");
    expect(earned(match({ finalCharacters: { hydra: { hp: 2, alive: true } } }))).not.toContain("achievement.by-a-thread");
    expect(earned(match({ finalCharacters: { shiro: { hp: 1, alive: true } } }))).not.toContain("achievement.by-a-thread"); // the loser's
  });

  it("Outbreak: an obscure transformation is reached", () => {
    const log = [ev("transformed", { sourceId: "patient-zero", payload: { transformationId: "transformation.patient-zero.to-the-outbreak" } })];
    expect(earned(match({ eventLog: log }))).toContain("achievement.outbreak");
    expect(earned(match({ eventLog: [ev("transformed", { payload: { transformationId: "transformation.patient-zero.to-the-infected" } })] }))).not.toContain("achievement.outbreak");
  });

  it("Giant killer: beat a Legend without one of your own", () => {
    expect(earned(match({ teamBIds: ["zeiron", "koschei", "father-bell"] }))).toContain("achievement.giant-killer");
    expect(earned(match({ teamAIds: ["shiro", "hydra", "malachar"], teamBIds: ["zeiron", "koschei", "father-bell"] }))).not.toContain("achievement.giant-killer");
  });

  it("Unwritten: witness a rewind", () => {
    expect(earned(match({ eventLog: [ev("turnRewound")] }))).toContain("achievement.unwritten");
  });

  it("are awarded once, pay xp, and never revealed by the profile until earned", () => {
    const log = [ev("turnRewound")];
    const first = applyMatchProgress(fresh(), match({ eventLog: log }), undefined, 1);
    expect(first.report.achievements).toContain("achievement.unwritten");
    expect(first.profile.achievements).toContain("achievement.unwritten");
    const again = applyMatchProgress(first.profile, match({ eventLog: log }), undefined, 2);
    expect(again.report.achievements).not.toContain("achievement.unwritten");
    for (const a of ACHIEVEMENTS) expect(a.hint).not.toContain(a.title.toLowerCase()); // cryptic, not a spoiler
  });
});

describe("Legend unlocks and the Nameless One gate", () => {
  const trial = (id: string) => LEGEND_TRIALS.find((t) => t.legendId === id)!;
  const trialMatch = (legendId: string, over: Partial<ProgressMatch> = {}) =>
    match({ mode: "trial", trialId: trial(legendId).id, teamBIds: [...trial(legendId).enemyTeam], ...over });

  it("winning a Legend trial unlocks that Legend and reports it", () => {
    // An older save (unlock model 1) has every trial open; the new gating has its own tests in quests.test.ts.
    const older: Profile = { ...fresh(), unlocks: { ...fresh().unlocks, model: 1 } };
    const r = applyMatchProgress(older, trialMatch("zeiron"), undefined, 1);
    expect(r.profile.unlocks.legends).toContain("zeiron");
    expect(r.profile.trialsWon).toContain("trial.zeiron");
    expect(r.report.legendUnlocked).toBe("zeiron");
    expect(r.report.xpGained).toBeGreaterThanOrEqual(XP.trialWin);
    expect(legendUnlocked(r.profile, "zeiron")).toBe(true);
  });

  it("losing or drawing a trial unlocks nothing", () => {
    for (const winnerPlayerId of ["playerB", null]) {
      const r = applyMatchProgress(fresh(), trialMatch("zeiron", { winnerPlayerId }), undefined, 1);
      expect(r.profile.unlocks.legends).toEqual([]);
    }
  });

  it("a normal match, even one against a Legend, never unlocks it", () => {
    const r = applyMatchProgress(fresh(), match({ teamBIds: ["zeiron", "koschei", "father-bell"] }), undefined, 1);
    expect(r.profile.unlocks.legends).toEqual([]);
  });

  it("unlocked Legends become pickable; merely meeting one does not", () => {
    const zeiron = CHARACTER_LIBRARY.zeiron!;
    const met = { ...fresh(), discovered: { ...fresh().discovered, characters: ["zeiron"] } };
    expect(characterVisibility(zeiron, met)).toBe("full");
    expect(isPickable(zeiron, met)).toBe(false);
    expect(isPickable(zeiron, { ...met, unlocks: { legends: ["zeiron"], namelessBossDefeated: false, fighters: [], model: 2 } })).toBe(true);
  });

  it("all six built Legends have a trial, and trial teams start with their Legend", () => {
    for (const id of ["zeiron", "shiro", "behemoth", "black-knight", "emperor-zero", NAMELESS_ID]) {
      expect(trial(id).enemyTeam[0]).toBe(id);
      expect(trial(id).enemyTeam).toHaveLength(3);
      for (const member of trial(id).enemyTeam) expect(CHARACTER_LIBRARY[member]).toBeDefined();
    }
  });

  describe("The Nameless One gate (11 Legends + boss)", () => {
    const others = LEGEND_ORDER.filter((id) => id !== NAMELESS_ID);
    const withLegends = (legends: string[], namelessBossDefeated = false): Profile => ({ ...fresh(), unlocks: { legends, namelessBossDefeated, fighters: [], model: 2 } });

    it("the boss encounter is sealed until all eleven other Legends are unlocked", () => {
      expect(others).toHaveLength(11);
      expect(trialAvailable(fresh(), trial(NAMELESS_ID))).toBe(false);
      expect(namelessGateOpen(withLegends(others.slice(0, 10)))).toBe(false);
      expect(namelessGateOpen(withLegends(others))).toBe(true);
      expect(trialAvailable(withLegends(others), trial(NAMELESS_ID))).toBe(true);
    });

    it("beating the boss with the gate open unlocks him", () => {
      const before = withLegends(others);
      expect(namelessUnlocked(before)).toBe(false);
      const r = applyMatchProgress(before, match({ mode: "trial", trialId: trial(NAMELESS_ID).id, teamBIds: [...trial(NAMELESS_ID).enemyTeam] }), undefined, 1);
      expect(r.profile.unlocks.namelessBossDefeated).toBe(true);
      expect(r.report.legendUnlocked).toBe(NAMELESS_ID);
      expect(namelessUnlocked(r.profile)).toBe(true);
      expect(legendUnlocked(r.profile, NAMELESS_ID)).toBe(true);
    });

    it("the boss cannot be won early, and ten Legends plus the boss flag is still not enough", () => {
      const early = applyMatchProgress(fresh(), match({ mode: "trial", trialId: trial(NAMELESS_ID).id, teamBIds: [...trial(NAMELESS_ID).enemyTeam] }), undefined, 1);
      expect(early.profile.unlocks.legends).toEqual([]);
      expect(early.profile.unlocks.namelessBossDefeated).toBe(false);
      const forged = withLegends([...others.slice(0, 10), NAMELESS_ID], true);
      expect(namelessUnlocked(forged)).toBe(false);
      expect(legendUnlocked(forged, NAMELESS_ID)).toBe(false);
    });
  });
});

describe("unlocks from a real, engine-played match log", () => {
  it("finishing a real match updates every part of the profile consistently", () => {
    const outcome = playRealMatch(["tortuga-rex", "hydra", "malachar"], ["shiro", "koschei", "father-bell"], 11);
    const done = finishMatch(fresh(), { mode: "bot", teamAIds: ["tortuga-rex", "hydra", "malachar"], teamBIds: ["shiro", "koschei", "father-bell"], seed: 11 }, outcome, 5000);
    expect(done.profile.matchesPlayed).toBe(1);
    expect(done.profile.discovered.characters).toHaveLength(6);
    expect(done.profile.discovered.abilities.length).toBeGreaterThan(3);
    expect(done.profile.history[0]?.replayId).toBe(done.replay?.id);
    expect(done.profile.history[0]?.turns).toBe(outcome.turns);
    expect(done.profile.xp).toBe(done.report.xpGained);
    expect(done.replay?.turns.length).toBe(outcome.turnLog?.length);
    expect(done.profile.played.hydra).toBe(1);
    expect(done.profile.played.shiro).toBeUndefined();
  });
});

describe("transfer id table", () => {
  it("is deterministic and covers characters, missions, achievements and trials", () => {
    const table = buildIdTable();
    expect(buildIdTable()).toEqual(table);
    expect(new Set(table).size).toBe(table.length);
    for (const id of ["hydra", "mission.first-victory", "achievement.unwritten", "trial.zeiron", "ability.hydra.serpent-bite"]) expect(table).toContain(id);
  });
});
