import { describe, expect, it } from "vitest";
import { PLAYABLE_CHARACTERS, CHARACTER_LIBRARY, type BattleEvent } from "@veilbreak/content";
import { resolveTurn } from "@veilbreak/engine";
import { createRandom, decideActions } from "@veilbreak/ai";
import { createDefaultProfile, type Profile } from "@veilbreak/persistence";
import { applyMatchToProfile } from "./discovery";
import { NO_FILTERS, filterCharacters, filterOptions } from "./filters";
import { characterVisibility, knownCounters, knownSynergies, masteryLevel, originOf, passiveOf, passiveRevealed } from "./knowledge";
import { matchDeps, startMatch } from "./setup";
import { createSoundBus, soundEventsFor } from "../sound/soundBus";

const fresh = (): Profile => createDefaultProfile();
const event = (type: string, extra: Partial<BattleEvent> = {}): BattleEvent => ({
  turn: 1,
  tierId: "standard-attacks-support",
  turnRelativeSequence: 0,
  type,
  payload: {},
  knowledgeLevel: "PUBLIC",
  ...extra,
});
const def = (id: string) => CHARACTER_LIBRARY[id]!;

describe("knowledge levels and secrets", () => {
  it("core fighters are visible from the start; secrets and Legends are silhouettes", () => {
    const p = fresh();
    expect(characterVisibility(def("tortuga-rex"), p)).toBe("full");
    expect(characterVisibility(def("koschei"), p)).toBe("silhouette");
    expect(characterVisibility(def("zeiron"), p)).toBe("silhouette");
    expect(characterVisibility(def("the-nameless-one"), p)).toBe("silhouette");
  });

  it("meeting a character reveals it; the spoiler setting reveals everyone", () => {
    const met = { ...fresh(), discovered: { ...fresh().discovered, characters: ["koschei"] } };
    expect(characterVisibility(def("koschei"), met)).toBe("full");
    const spoilers = { ...fresh(), settings: { ...fresh().settings, showAllCharacters: true } };
    expect(characterVisibility(def("zeiron"), spoilers)).toBe("full");
  });

  it("a silhouette never leaks its name or role through search and filters", () => {
    const p = fresh();
    const byName = filterCharacters(PLAYABLE_CHARACTERS, { ...NO_FILTERS, search: "koschei" }, p);
    expect(byName).toEqual([]);
    const controllers = filterCharacters(PLAYABLE_CHARACTERS, { ...NO_FILTERS, role: "CONTROLLER" }, p).map((c) => c.id);
    expect(controllers).not.toContain("koschei");
    const visibleOrigins = new Set(PLAYABLE_CHARACTERS.filter((c) => characterVisibility(c, p) === "full").map((c) => originOf(c.id)));
    expect(new Set(filterOptions(PLAYABLE_CHARACTERS, p).origins)).toEqual(visibleOrigins);
  });

  it("filters combine: search, role, rarity, favorites, mastery, recently played, lock", () => {
    const p: Profile = { ...fresh(), favorites: ["hydra"], recent: ["tortuga-rex"], played: { hydra: 9 } };
    const ids = (f: Partial<typeof NO_FILTERS>) => filterCharacters(PLAYABLE_CHARACTERS, { ...NO_FILTERS, ...f }, p).map((c) => c.id);
    expect(ids({ search: "tort" })).toEqual(["tortuga-rex"]);
    expect(ids({ favoritesOnly: true })).toEqual(["hydra"]);
    expect(ids({ recentOnly: true })).toEqual(["tortuga-rex"]);
    expect(ids({ minMastery: 3 })).toEqual(["hydra"]);
    expect(ids({ lock: "locked" }).length).toBeGreaterThan(0);
    expect(ids({ lock: "unlocked" })).not.toContain("zeiron");
    expect(ids({ role: "TANK" })).toContain("tortuga-rex");
  });

  it("origin comes from art direction; mastery grows with play", () => {
    expect(originOf("zeiron")).toBe("Ancient Mediterranean");
    expect(masteryLevel({ ...fresh(), played: { hydra: 7 } }, "hydra")).toBe(2);
    expect(masteryLevel({ ...fresh(), played: { hydra: 400 } }, "hydra")).toBe(5);
  });
});

describe("Codex entries unlock from the player's own match history", () => {
  const teamA = ["koschei", "tortuga-rex", "hydra"];
  const teamB = ["zeiron", "malachar", "father-bell"];

  it("meeting fighters, seeing abilities and passives, and transformations are recorded", () => {
    const log = [
      event("abilityUsed", { sourceId: "koschei", payload: { abilityId: "ability.koschei.iron-grip" } }),
      event("statusApplied", { sourceId: "koschei", targetId: "koschei", payload: { statusId: "status.death-prevention" } }),
      event("transformed", { sourceId: "patient-zero", payload: { transformationId: "transformation.patient-zero.to-the-infected" } }),
    ];
    const p = applyMatchToProfile(fresh(), { teamAIds: teamA, teamBIds: teamB, winnerPlayerId: "playerA", humanTeams: ["A"], eventLog: log });
    for (const id of [...teamA, ...teamB]) expect(p.discovered.characters).toContain(id);
    expect(p.discovered.abilities).toEqual(["ability.koschei.iron-grip"]);
    expect(p.discovered.passives).toContain("passive.koschei.death-hidden-away");
    // Passives whose effects never showed up in the log stay hidden.
    expect(p.discovered.passives).not.toContain("passive.malachar.the-dead-remember");
  });

  it("a discoverable passive and ability stay hidden until seen, then reveal", () => {
    const koschei = def("koschei");
    const passive = passiveOf(koschei)!;
    expect(passiveRevealed(passive, fresh())).toBe(false);
    const seen = applyMatchToProfile(fresh(), {
      teamAIds: teamA,
      teamBIds: teamB,
      winnerPlayerId: null,
      humanTeams: ["A"],
      eventLog: [event("resourceChanged", { sourceId: "koschei", targetId: "koschei", payload: { resourceId: "resource.death-seals" } })],
    });
    expect(passiveRevealed(passive, seen)).toBe(true);
  });

  it("counts mastery only for teams a human played, and records counters and synergies", () => {
    let p = fresh();
    for (let i = 0; i < 2; i += 1) {
      p = applyMatchToProfile(p, { teamAIds: teamA, teamBIds: teamB, winnerPlayerId: "playerB", humanTeams: ["A"], eventLog: [] });
    }
    expect(p.matchesPlayed).toBe(2);
    expect(p.played.koschei).toBe(2);
    expect(p.played.zeiron).toBeUndefined(); // the bot's team is not "played"
    expect(knownCounters(p, "koschei")).toContain("zeiron");
    expect(knownSynergies(p, "zeiron")).toContain("malachar");
    expect(knownSynergies(p, "koschei")).toEqual([]);
    expect(p.recent.slice(0, 3)).toEqual(expect.arrayContaining(teamA));
  });

  it("a draw records no counters", () => {
    const p = applyMatchToProfile(fresh(), { teamAIds: teamA, teamBIds: teamB, winnerPlayerId: null, humanTeams: ["A", "B"], eventLog: [] });
    expect(p.beat).toEqual({});
    expect(p.played.zeiron).toBe(1);
  });

  it("works on a real, engine-played match log", () => {
    const deps = matchDeps();
    let state = startMatch(["tortuga-rex", "hydra", "malachar"], ["shiro", "koschei", "father-bell"], 5);
    const random = createRandom(3);
    for (let i = 0; i < 60; i += 1) {
      const ctx = { deps, random };
      const r = resolveTurn(state, decideActions("INTERMEDIATE", state, "playerA", ctx), decideActions("INTERMEDIATE", state, "playerB", ctx), deps);
      if (!r.ok) throw new Error("illegal bot plan");
      state = r.state;
      if (r.events.some((e) => e.type.startsWith("matchEnded"))) break;
    }
    const p = applyMatchToProfile(fresh(), {
      teamAIds: state.teams[0].characterIds,
      teamBIds: state.teams[1].characterIds,
      winnerPlayerId: "playerA",
      humanTeams: ["A"],
      eventLog: state.eventLog,
    });
    expect(p.discovered.characters).toHaveLength(6);
    expect(p.discovered.abilities.length).toBeGreaterThan(3);
  });
});

describe("sound hooks", () => {
  it("are silent by default and only fire when enabled and subscribed", () => {
    const bus = createSoundBus();
    const heard: string[] = [];
    bus.subscribe((e) => heard.push(e.name));
    bus.emit("attack");
    expect(heard).toEqual([]);
    bus.configure({ enabled: true, volume: 50 });
    bus.emit("attack", "hydra");
    expect(heard).toEqual(["attack"]);
    bus.configure({ enabled: false, volume: 50 });
    bus.emit("death");
    expect(heard).toEqual(["attack"]);
  });

  it("scales volume and maps battle events to per-character hooks", () => {
    const bus = createSoundBus();
    let last = { volume: -1, characterId: "" };
    bus.subscribe((e) => (last = { volume: e.volume, characterId: e.characterId ?? "" }));
    bus.configure({ enabled: true, volume: 40 });
    bus.emit("selection", "hydra");
    expect(last).toEqual({ volume: 0.4, characterId: "hydra" });
    const names = soundEventsFor([
      event("damageDealt", { sourceId: "a", targetId: "b" }),
      event("statusApplied", { targetId: "b", payload: { statusId: "status.shield" } }),
      event("transformed", { sourceId: "a" }),
      event("death", { targetId: "b" }),
    ]).map((s) => s.name);
    expect(names).toEqual(["attack", "defense", "transformation", "death"]);
  });
});
