import { statusDefinitionSchema, type StatusDefinition } from "../schemas/status";
import type { TargetRule } from "../schemas/common";

// spec/02 "Status system": the full initial status library, as data (CLAUDE.md
// rule 3 — characters are compositions of reusable components, never
// character-specific hacks). Every entry here gets the engine's generic
// treatment for free: apply, stack (per stackRule/maxStacks), duration
// countdown, expiry, and dispel (packages/engine/src/statuses.ts).
//
// A status also gets a *mechanical hook* — something that actually checks
// for it during resolution — only where a phase's deliverables name a
// concrete behavior: the damage pipeline (invulnerable, reflect, counter,
// damage reduction, shield, damage amplification, weakness), the heal
// handler (anti-heal, healing reduction, healing amplification), action
// legality (stun, silence), targeting (taunt, untargetable), the
// cooldown-reduction tier (cooldown increase/reduction), DoT/HoT ticking
// (bleed, burn, poison, infection), and — for Death Prevention, Ability
// Lock, Energy Lock, Energy Cost Increase, and Resurrection Lock — a direct
// check in damage.ts/actions.ts/effects.ts. Soul Consecration's hook is two
// small checks elsewhere (a `hasStatus` condition gating Malachar's Souls
// passive, and effects.ts's resurrect handler) rather than anything in this
// file. See docs/DECISIONS.md for the full list and rationale.
//
// The rest are real, valid StatusDefinitions — nameable, applicable,
// stackable, dispellable, and visible in the battle log like any other
// status — but their unique mechanic has no engine hook yet, either because
// spec names the status without defining a concrete mechanic at all (Curse,
// Fear, Petrification, Mark, Stealth, Exposed), or because no character kit
// has needed one yet.

function status(
  overrides: Partial<StatusDefinition> & Pick<StatusDefinition, "id" | "displayName" | "tooltip">,
): StatusDefinition {
  const defaultTarget: TargetRule = {
    side: "enemy",
    scope: "single",
    count: 1,
    includeSelf: false,
    filterTags: [],
  };
  return statusDefinitionSchema.parse({
    icon: `icon/status/${overrides.id.replace(/^status\./, "")}.svg`,
    source: "ability",
    defaultTarget,
    duration: { turns: 2, permanent: false },
    stackRule: "refresh",
    maxStacks: 1,
    dispellable: true,
    visualTreatment: "TBD — placeholder pending Phase 14 art specs",
    ...overrides,
  });
}

const selfTarget: TargetRule = { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] };
const allyTarget: TargetRule = { side: "ally", scope: "single", count: 1, includeSelf: true, filterTags: [] };

// ---- Statuses with a real engine hook (see file header) --------------------

export const STUN = status({
  id: "status.stun",
  displayName: "Stun",
  duration: { turns: 1, permanent: false },
  tooltip: "Cannot take any action while stunned.",
});

export const SILENCE = status({
  id: "status.silence",
  displayName: "Silence",
  tooltip: "Cannot take any action while silenced.",
});

export const INVULNERABLE = status({
  id: "status.invulnerable",
  displayName: "Invulnerable",
  defaultTarget: selfTarget,
  duration: { turns: 1, permanent: false },
  tooltip: "Immune to normal and piercing damage. Affliction damage still applies.",
});

export const UNTARGETABLE = status({
  id: "status.untargetable",
  displayName: "Untargetable",
  defaultTarget: selfTarget,
  duration: { turns: 1, permanent: false },
  tooltip: "Cannot be selected as a target by enemies.",
});

export const DAMAGE_REDUCTION = status({
  id: "status.damage-reduction",
  displayName: "Damage Reduction",
  defaultTarget: allyTarget,
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Reduces incoming normal damage by a flat amount.",
});

export const SHIELD = status({
  id: "status.shield",
  displayName: "Shield",
  defaultTarget: allyTarget,
  duration: { turns: 3, permanent: false },
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Absorbs incoming damage up to the shield's remaining amount before HP is affected.",
});

export const COUNTER = status({
  id: "status.counter",
  displayName: "Counter",
  defaultTarget: selfTarget,
  tooltip: "The next attacker also takes damage back, in addition to the damage this character takes.",
});

export const REFLECT = status({
  id: "status.reflect",
  displayName: "Reflect",
  defaultTarget: selfTarget,
  tooltip: "Normal damage is redirected to the attacker instead of being taken.",
});

export const BLEED = status({
  id: "status.bleed",
  displayName: "Bleed",
  duration: { turns: 3, permanent: false },
  stackRule: "stackAndRefresh",
  maxStacks: 5,
  tickBehavior: "damageOverTime",
  tooltip: "Deals damage at the start of each turn, per stack.",
});

export const BURN = status({
  id: "status.burn",
  displayName: "Burn",
  duration: { turns: 3, permanent: false },
  stackRule: "stackAndRefresh",
  maxStacks: 5,
  tickBehavior: "damageOverTime",
  tooltip: "Deals damage at the start of each turn, per stack.",
});

export const POISON = status({
  id: "status.poison",
  displayName: "Poison",
  duration: { turns: 3, permanent: false },
  stackRule: "stackAndRefresh",
  maxStacks: 5,
  tickBehavior: "damageOverTime",
  tooltip: "Deals damage at the start of each turn, per stack.",
});

export const ANTI_HEAL = status({
  id: "status.anti-heal",
  displayName: "Anti-Heal",
  tooltip: "Blocks conventional healing entirely. Life transfer and HP-setting effects are unaffected.",
});

// phase-06: Behemoth's "cannot receive healing" (spec/03). Unlike Anti-Heal it is
// permanent and not dispellable, so a cleanse can't undo a Legend's defining
// drawback. Same scope as Anti-Heal per OQ-04: blocks the `heal` class only.
export const UNHEALABLE = status({
  id: "status.unhealable",
  displayName: "Unhealable",
  source: "passive",
  defaultTarget: selfTarget,
  duration: { turns: 0, permanent: true },
  dispellable: false,
  tooltip: "Cannot receive conventional healing. Life transfer and HP-setting effects are unaffected.",
});

export const HEALING_REDUCTION = status({
  id: "status.healing-reduction",
  displayName: "Healing Reduction",
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Reduces healing received, including life transfer, by a flat amount.",
});

export const HEALING_AMPLIFICATION = status({
  id: "status.healing-amplification",
  displayName: "Healing Amplification",
  defaultTarget: allyTarget,
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Increases healing received, including life transfer, by a flat amount.",
});

export const COOLDOWN_INCREASE = status({
  id: "status.cooldown-increase",
  displayName: "Cooldown Increase",
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Slows cooldown recovery on all of this character's abilities.",
});

export const COOLDOWN_REDUCTION = status({
  id: "status.cooldown-reduction",
  displayName: "Cooldown Reduction",
  defaultTarget: allyTarget,
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Speeds up cooldown recovery on all of this character's abilities.",
});

export const TAUNT = status({
  id: "status.taunt",
  displayName: "Taunt",
  defaultTarget: selfTarget,
  duration: { turns: 1, permanent: false },
  tooltip: "Enemies targeting a single foe must target this character instead.",
});

export const DAMAGE_AMPLIFICATION = status({
  id: "status.damage-amplification",
  displayName: "Damage Amplification",
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Increases normal and piercing damage taken by a flat amount.",
});

export const WEAKNESS = status({
  id: "status.weakness",
  displayName: "Weakness",
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "Reduces normal and piercing damage this character deals by a flat amount.",
});

// spec/06 named Infection as data-only through Phase 03 ("no concrete
// mechanic yet"); phase-04-first-five.md's Patient Zero is the real character
// kit that finally needs one. It turns out to need zero new engine code: DoT
// ticking (packages/engine/src/statuses.ts, computeTicks) already reads
// tickBehavior generically off whichever status has it, the same way
// Bleed/Burn/Poison do above. See docs/DECISIONS.md ADR-011 and OQ-29.
export const INFECTION = status({
  id: "status.infection",
  displayName: "Infection",
  duration: { turns: 4, permanent: false },
  stackRule: "stackAndRefresh",
  maxStacks: 5,
  tickBehavior: "damageOverTime",
  tooltip: "Deals damage at the start of each turn, per stack, and worsens the more it spreads.",
});

// ---- Data-only for now — see file header (spec/06 + parameter limits) -----

export const CURSE = status({
  id: "status.curse",
  displayName: "Curse",
  duration: { turns: 3, permanent: false },
  dispellable: false,
  tooltip: "TODO(phase-03): mechanic defined per character.",
});

export const FEAR = status({
  id: "status.fear",
  displayName: "Fear",
  duration: { turns: 1, permanent: false },
  tooltip: "TODO(phase-03): mechanic defined per character.",
});

export const PETRIFICATION = status({
  id: "status.petrification",
  displayName: "Petrification",
  duration: { turns: 1, permanent: false },
  dispellable: false,
  tooltip: "TODO(phase-03): mechanic defined per character.",
});

export const ENERGY_LOCK = status({
  id: "status.energy-lock",
  displayName: "Energy Lock",
  tooltip: "Abilities that require the locked energy family cannot be used.",
});

export const ENERGY_COST_INCREASE = status({
  id: "status.energy-cost-increase",
  displayName: "Energy Cost Increase",
  stackRule: "stack",
  maxStacks: 3,
  tooltip: "This character's ability costs are increased.",
});

export const MARK = status({
  id: "status.mark",
  displayName: "Mark",
  duration: { turns: 3, permanent: false },
  tooltip: "TODO(phase-03): mechanic defined per character.",
});

export const STEALTH = status({
  id: "status.stealth",
  displayName: "Stealth",
  defaultTarget: selfTarget,
  duration: { turns: 1, permanent: false },
  tooltip: "TODO(phase-03): mechanic defined per character.",
});

export const EXPOSED = status({
  id: "status.exposed",
  displayName: "Exposed",
  tooltip: "TODO(phase-03): mechanic defined per character.",
});

export const DEATH_PREVENTION = status({
  id: "status.death-prevention",
  displayName: "Death Prevention",
  defaultTarget: selfTarget,
  duration: { turns: 0, permanent: true },
  dispellable: false,
  tooltip: "The next lethal hit instead leaves this character at 1 HP, then this is consumed.",
});

export const RESURRECTION_LOCK = status({
  id: "status.resurrection-lock",
  displayName: "Resurrection Lock",
  dispellable: false,
  tooltip: "This character cannot be resurrected while defeated.",
});

// phase-04-first-five.md "Consecration must block souls, resurrection,
// thralls, and corpse use": this file only needs to make it a real,
// applicable status — the four blocks themselves live where the thing
// they're blocking lives (a `hasStatus` check in whichever soul-collecting
// passive would otherwise award a Soul for this death, and a direct check
// in effects.ts's resurrect handler). See docs/DECISIONS.md ADR-011.
export const SOUL_CONSECRATION = status({
  id: "status.soul-consecration",
  displayName: "Soul Consecration",
  source: "passive",
  defaultTarget: selfTarget,
  duration: { turns: 0, permanent: true },
  dispellable: false,
  tooltip: "This death cannot generate Souls, be resurrected, be turned into a Thrall, or have its abilities commanded.",
});

export const ABILITY_LOCK = status({
  id: "status.ability-lock",
  displayName: "Ability Lock",
  tooltip: "The locked ability cannot be used.",
});

// phase-13 (The Oracle): a prophecy on an enemy. The next time it takes damage
// the wound is worse, exactly once; the status removes itself before dealing
// the extra damage, so it can never chain. Affliction damage cannot be dodged:
// fate is not a normal attack.
export const FORETOLD = status({
  id: "status.foretold",
  displayName: "Foretold",
  duration: { turns: 3, permanent: false },
  stackRule: "refresh",
  triggerTiming: [{ event: "onDamaged", relation: "self", effectTarget: "subject" }],
  effects: [
    { kind: "removeStatus", statusId: "status.foretold" },
    { kind: "damage", amount: 30, damageType: "affliction" },
  ],
  knowledgeLevel: "DISCOVERABLE",
  tooltip: "The next time this character takes damage, it takes 30 more, once.",
});

// phase-13 (Morrigan): a prophecy that only comes true for the wounded. At the
// end of its holder's turn, if the holder is below half health the prophecy is
// fulfilled (60 affliction damage) and consumed. A healthy holder keeps it until
// it expires; healing, a dispel or simply staying above half escapes it.
export const CROW_PROPHECY = status({
  id: "status.crow-prophecy",
  displayName: "Prophecy of Ruin",
  duration: { turns: 3, permanent: false },
  stackRule: "refresh",
  triggerTiming: [{ event: "onTurnEnd", relation: "self", effectTarget: "subject", condition: { type: "hpBelowPercent", target: "self", percent: 50 } }],
  effects: [
    { kind: "removeStatus", statusId: "status.crow-prophecy" },
    { kind: "damage", amount: 60, damageType: "affliction" },
  ],
  knowledgeLevel: "DISCOVERABLE",
  tooltip: "If this character ends a turn below half health, the prophecy comes true for 60 damage. Healing, a dispel or staying healthy escapes it.",
});

export const STATUS_LIBRARY: Record<string, StatusDefinition> = Object.fromEntries(
  [
    STUN,
    SILENCE,
    INVULNERABLE,
    UNTARGETABLE,
    DAMAGE_REDUCTION,
    SHIELD,
    COUNTER,
    REFLECT,
    BLEED,
    BURN,
    POISON,
    ANTI_HEAL,
    UNHEALABLE,
    HEALING_REDUCTION,
    HEALING_AMPLIFICATION,
    COOLDOWN_INCREASE,
    COOLDOWN_REDUCTION,
    TAUNT,
    DAMAGE_AMPLIFICATION,
    WEAKNESS,
    INFECTION,
    CURSE,
    FEAR,
    PETRIFICATION,
    ENERGY_LOCK,
    ENERGY_COST_INCREASE,
    MARK,
    STEALTH,
    EXPOSED,
    DEATH_PREVENTION,
    RESURRECTION_LOCK,
    SOUL_CONSECRATION,
    ABILITY_LOCK,
    FORETOLD,
    CROW_PROPHECY,
  ].map((def) => [def.id, def]),
);
