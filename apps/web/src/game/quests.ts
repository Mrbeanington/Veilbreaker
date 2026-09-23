import { CHARACTER_LIBRARY, ABILITY_LIBRARY, PLAYABLE_CHARACTERS, type CharacterDefinition } from "@veilbreak/content";
import { levelForXp, type Profile } from "@veilbreak/persistence";
import { isStarter, originOf, rolesOf } from "./knowledge";
import type { MissionDef, ProgressMatch } from "./progression";

// ADR-038: unlock quests. Nothing beyond the starter roster opens by meeting a
// fighter any more. Every other fighter has a short quest (one to three steps) built from
// the game's own data, and Legends also need an account level. Meeting a fighter only
// reveals its Codex entry. Quests are ordinary missions (same progress, same XP), so the
// progression code, the save file and the transfer code needed no new machinery.
//
// Everything here is a pure function of the roster, so the quests are the same on every
// device and the tests can check that each one is possible to finish.

export const NAMELESS_ID = "the-nameless-one";

/** spec/03 "The Twelve Legends", in chamber order. All twelve are built. */
export const LEGEND_ORDER = [
  "zeiron",
  "shiro",
  "morrigan",
  "aurelia",
  "madame-fortuna",
  "behemoth",
  "minotaur-king",
  "black-knight",
  "orpheon",
  "calypsa",
  "emperor-zero",
  NAMELESS_ID,
] as const;

// ------------------------------------------------------------------ tuning

/** Account level needed to start each tier of Rare fighters, simplest kits first. */
export const RARE_TIER_LEVELS = [1, 2, 3, 4, 5, 7, 9] as const;
/** Steps in a quest, per Rare tier. */
export const RARE_TIER_STEPS = [1, 1, 2, 2, 2, 3, 3] as const;
/** Secrets show their quest only once met, from these levels (in name order, two at a time). */
export const SECRET_FIRST_LEVEL = 3;
/** The first Legend's trial opens at this level; each following one a level later. */
export const FIRST_LEGEND_LEVEL = 4;
/** Below these levels the bots do not field Secrets or Legends against you. */
export const SECRET_OPPONENT_LEVEL = SECRET_FIRST_LEVEL;
export const LEGEND_OPPONENT_LEVEL = FIRST_LEGEND_LEVEL;

type QuestKind = "rare" | "secret" | "legend";

export interface Quest {
  characterId: string;
  kind: QuestKind;
  /** Account level at which the quest starts to count. */
  level: number;
  steps: MissionDef[];
}

const won = (m: ProgressMatch): boolean => m.winnerPlayerId !== null;
const plus = (previous: number, condition: boolean): number => previous + (condition ? 1 : 0);
const winners = (m: ProgressMatch): readonly string[] => (m.winnerPlayerId === "playerA" ? m.teamAIds : m.winnerPlayerId === "playerB" ? m.teamBIds : []);
const losers = (m: ProgressMatch): readonly string[] => (m.winnerPlayerId === "playerA" ? m.teamBIds : m.winnerPlayerId === "playerB" ? m.teamAIds : []);
const isLegend = (id: string): boolean => CHARACTER_LIBRARY[id]?.rarity === "LEGENDARY";
const roleLabel = (role: string): string => role.charAt(0) + role.slice(1).toLowerCase();

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 1_000_003;
  return h;
}

// ------------------------------------------------------------------ what a quest may ask for

const STARTERS = PLAYABLE_CHARACTERS.filter(isStarter).sort((a, b) => a.id.localeCompare(b.id));
/** Roles a starter team can actually field, so a role step is always possible. */
const STARTER_ROLES = new Set(STARTERS.flatMap((c) => rolesOf(c)));
const startersByOrigin = new Map<string, CharacterDefinition[]>();
for (const c of STARTERS) startersByOrigin.set(originOf(c.id), [...(startersByOrigin.get(originOf(c.id)) ?? []), c]);

export const STARTER_IDS: readonly string[] = STARTERS.map((c) => c.id);

type StepKind = "with" | "role" | "swift" | "flawless" | "origin" | "giant" | "mixed";
const STEP_KINDS: readonly StepKind[] = ["with", "role", "swift", "flawless", "origin", "giant", "mixed"];

interface StepSpec {
  title: string;
  description: string;
  goal: number;
  advance: MissionDef["advance"];
}

function specFor(kind: StepKind, target: CharacterDefinition, weight: number, level: number): StepSpec {
  const n = weight;
  switch (kind) {
    case "role": {
      const role = rolesOf(target).find((r) => STARTER_ROLES.has(r));
      if (!role) return specFor("with", target, weight, level);
      return {
        title: `${roleLabel(role)} practice`,
        description: `Win ${n + 1} matches with a ${roleLabel(role)} on your team.`,
        goal: n + 1,
        advance: (p, _pr, m) => plus(p, won(m) && winners(m).some((id) => CHARACTER_LIBRARY[id] && rolesOf(CHARACTER_LIBRARY[id]).includes(role))),
      };
    }
    case "origin": {
      const origin = originOf(target.id);
      if ((startersByOrigin.get(origin)?.length ?? 0) < 2) return specFor("with", target, weight, level);
      return {
        title: `${origin} allies`,
        description: `Win ${n} match${n === 1 ? "" : "es"} with two ${origin} fighters on your team.`,
        goal: n,
        advance: (p, _pr, m) => plus(p, won(m) && winners(m).filter((id) => originOf(id) === origin).length >= 2),
      };
    }
    case "swift":
      return {
        title: "Quick work",
        description: `Win ${n} match${n === 1 ? "" : "es"} in 14 turns or fewer.`,
        goal: n,
        advance: (p, _pr, m) => plus(p, won(m) && m.turns <= 14),
      };
    case "flawless":
      return {
        title: "No one left behind",
        description: `Win ${n} match${n === 1 ? "" : "es"} without losing a fighter.`,
        goal: n,
        advance: (p, _pr, m) => plus(p, won(m) && winners(m).length >= 3 && winners(m).every((id) => m.finalCharacters[id]?.alive === true)),
      };
    case "giant":
      // Bots only field Legends from the first Legend level, so a lower quest could never finish.
      if (level < LEGEND_OPPONENT_LEVEL) return specFor("mixed", target, weight, level);
      return {
        title: "Giant slayer",
        description: `Win ${n} match${n === 1 ? "" : "es"} against a team with a Legend.`,
        goal: n,
        advance: (p, _pr, m) => plus(p, won(m) && losers(m).some(isLegend)),
      };
    case "mixed":
      return {
        title: "Well balanced",
        description: `Win ${n} match${n === 1 ? "" : "es"} with a team of three different roles.`,
        goal: n,
        advance: (p, _pr, m) => {
          const roles = new Set(winners(m).flatMap((id) => (CHARACTER_LIBRARY[id] ? rolesOf(CHARACTER_LIBRARY[id]).slice(0, 1) : [])));
          return plus(p, won(m) && winners(m).length >= 3 && roles.size >= 3);
        },
      };
    case "with":
    default: {
      const sameOrigin = startersByOrigin.get(originOf(target.id)) ?? [];
      const pool = sameOrigin.length > 0 ? sameOrigin : STARTERS;
      const partner = pool[hash(target.id) % pool.length]!;
      return {
        title: `Fight beside ${partner.displayName}`,
        description: `Win ${n + 1} matches with ${partner.displayName} on your team.`,
        goal: n + 1,
        advance: (p, _pr, m) => plus(p, won(m) && winners(m).includes(partner.id)),
      };
    }
  }
}

function buildQuest(target: CharacterDefinition, kind: QuestKind, level: number, stepCount: number, weight: number): Quest {
  const steps: MissionDef[] = [];
  for (let i = 0; i < stepCount; i += 1) {
    // Start from a kind picked by the fighter's id, and move on if a fallback made it a repeat of an earlier step.
    let spec = specFor(STEP_KINDS[(hash(target.id) + i * 3) % STEP_KINDS.length]!, target, weight, level);
    for (let offset = 1; offset < STEP_KINDS.length && steps.some((s) => s.title === spec.title); offset += 1) {
      spec = specFor(STEP_KINDS[(hash(target.id) + i * 3 + offset) % STEP_KINDS.length]!, target, weight, level);
    }
    steps.push({
      id: `quest.${target.id}.${i + 1}`,
      title: spec.title,
      description: spec.description,
      goal: spec.goal,
      xp: 20 + 20 * weight,
      advance: spec.advance,
      unlocks: target.id,
      // Steps count from the level the quest opens, and a Secret's steps only once it has been met.
      available: (profile) => profile.unlocks.model >= 2 && levelForXp(profile.xp) >= level && (kind !== "secret" || profile.discovered.characters.includes(target.id)),
    });
  }
  return { characterId: target.id, kind, level, steps };
}

// ------------------------------------------------------------------ the quest table

/** How much there is to learn in a kit: total energy cost of its abilities, plus moving parts. Simpler kits unlock first. */
function complexity(c: CharacterDefinition): number {
  const cost = c.abilityIds.reduce((sum, id) => {
    const a = ABILITY_LIBRARY[id];
    return sum + (a ? a.cost.might + a.cost.focus + a.cost.spirit + a.cost.chaos + a.cost.neutral : 0);
  }, 0);
  return cost + 2 * c.transformationIds.length + 2 * c.resources.length;
}

function buildQuests(): Record<string, Quest> {
  const out: Record<string, Quest> = {};
  const byName = (a: CharacterDefinition, b: CharacterDefinition) => a.displayName.localeCompare(b.displayName);

  // ADR-058: a Core fighter that didn't make the curated starter list is not a Rare fighter,
  // but it still needs a quest exactly like one — folded into the same complexity-tiered pool
  // rather than given its own rule, so e.g. Mister Whiskers (a transforming Core) lands wherever
  // his actual complexity score puts him, same as any other fighter.
  const rares = PLAYABLE_CHARACTERS.filter((c) => (c.rarity === "RARE" || c.rarity === "CORE") && !isStarter(c)).sort((a, b) => complexity(a) - complexity(b) || byName(a, b));
  const perTier = Math.ceil(rares.length / RARE_TIER_LEVELS.length);
  rares.forEach((c, i) => {
    const tier = Math.min(RARE_TIER_LEVELS.length - 1, Math.floor(i / perTier));
    out[c.id] = buildQuest(c, "rare", RARE_TIER_LEVELS[tier]!, RARE_TIER_STEPS[tier]!, 1 + Math.floor(tier / 3));
  });

  const secrets = PLAYABLE_CHARACTERS.filter((c) => c.rarity === "SECRET").sort(byName);
  secrets.forEach((c, i) => {
    out[c.id] = buildQuest(c, "secret", SECRET_FIRST_LEVEL + Math.floor(i / 2), i < secrets.length / 2 ? 2 : 3, 2);
  });

  LEGEND_ORDER.filter((id) => id !== NAMELESS_ID).forEach((id, i) => {
    const c = CHARACTER_LIBRARY[id];
    if (c) out[id] = buildQuest(c, "legend", FIRST_LEGEND_LEVEL + i, 3, 3);
  });
  return out;
}

export const QUESTS: Readonly<Record<string, Quest>> = buildQuests();
export const QUEST_MISSIONS: MissionDef[] = Object.values(QUESTS).flatMap((q) => q.steps);

// ------------------------------------------------------------------ reading a profile

export interface QuestStatus {
  quest: Quest;
  stepsDone: number;
  levelOk: boolean;
  /** Level reached and, for a Secret, the fighter met: the steps are counting. */
  open: boolean;
  complete: boolean;
}

export function questStatus(profile: Profile, characterId: string): QuestStatus | undefined {
  const quest = QUESTS[characterId];
  if (!quest) return undefined;
  const done = new Set(profile.missions.completed);
  const stepsDone = quest.steps.filter((s) => done.has(s.id)).length;
  const levelOk = levelForXp(profile.xp) >= quest.level;
  const met = quest.kind !== "secret" || profile.discovered.characters.includes(characterId);
  return { quest, stepsDone, levelOk, open: levelOk && met, complete: stepsDone === quest.steps.length };
}

/** A Legend's trial opens once its level is reached and its quest is done. Old saves (unlock model 1) keep every trial open. */
export function legendTrialOpen(profile: Profile, legendId: string): boolean {
  if (profile.unlocks.model < 2) return true;
  const status = questStatus(profile, legendId);
  return !status || (status.levelOk && status.complete);
}

/** The fighters the bots may put against you: Secrets and Legends only appear once you have reached their levels. */
export function opponentPool<T extends { id: string; rarity: string }>(profile: Profile, all: readonly T[]): T[] {
  if (profile.unlocks.model < 2) return [...all];
  const level = levelForXp(profile.xp);
  return all.filter((c) => (c.rarity === "SECRET" ? level >= SECRET_OPPONENT_LEVEL : c.rarity === "LEGENDARY" ? level >= LEGEND_OPPONENT_LEVEL : true));
}

/** One short line for a locked fighter: what to do next. */
export function lockedHint(character: CharacterDefinition, profile: Profile): string {
  if (character.rarity === "LEGENDARY") {
    const status = questStatus(profile, character.id);
    if (!status) return "Unlocked by a boss encounter once every other Legend is yours.";
    if (!status.levelOk) return `Reach level ${status.quest.level}, finish its quest, then win its trial.`;
    if (!status.complete) return `Quest: ${status.stepsDone} of ${status.quest.steps.length} steps. Then win its trial.`;
    return "Quest done. Win its trial to unlock it.";
  }
  const status = questStatus(profile, character.id);
  if (!status) return "Available from the start.";
  if (!status.open) return character.rarity === "SECRET" && !profile.discovered.characters.includes(character.id) ? "Meet it in a match to learn its quest." : `Reach level ${status.quest.level} to start its quest.`;
  return `Quest: ${status.stepsDone} of ${status.quest.steps.length} steps done. See Missions.`;
}

/** The Codex line under "How to unlock". */
export function unlockHint(character: CharacterDefinition, profile: Profile): string {
  if (profile.unlocks.model < 2 && character.rarity !== "LEGENDARY") return "Available to you.";
  if (isStarter(character)) return "Available from the start.";
  return lockedHint(character, profile);
}
