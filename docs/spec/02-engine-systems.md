# 02 — Engine Systems

## Data-driven character engine (critical)
Do NOT write 120 separate battle systems. Build reusable components:
**Ability, Effect, Trigger, Condition, Status, Transformation, Resource, Summon, TargetRule, RandomOutcome.**

A character definition composes these components. Custom scripting is permitted only when a mechanic genuinely cannot be expressed with them, and must be logged in DECISIONS.md. Expansion characters must add interactions without requiring a new battle engine.

## Required core models (TypeScript)
Character, Ability, Effect, Status, Transformation, Summon, BattleState. Also define: CharacterDefinition (versioned), Cost, TargetRule, Trigger, Condition, RandomOutcome, Resource (custom counters such as Souls, Bases, Tails, Tide, Feedback, Fouls, Verse stage), BattleEvent (log), PlayerAction, EnergyRules, ResolutionOrder, BalanceVersion.

## Status system
Statuses are modular definitions, not character-specific hacks.

Initial library: Stun, Silence, Invulnerable, Untargetable, Damage Reduction, Shield, Counter, Reflect, Bleed, Burn, Poison, Infection, Curse, Fear, Petrification, Anti-Heal, Healing Reduction, Healing Amplification, Energy Lock, Energy Cost Increase, Cooldown Increase, Cooldown Reduction, Mark, Taunt, Stealth, Exposed, Death Prevention, Resurrection Lock, Soul Consecration, Ability Lock, Damage Amplification, Weakness.

Every status definition needs: unique ID, display name, icon, source, target, duration, stack rules, max stacks, dispellable flag, hidden flag, trigger timing, visual treatment, and tooltip.

## Transformation engine (first-class system)
Possible triggers:
- HP thresholds; damage received; damage inflicted
- number of turns; deaths; kills; healing
- specific ability sequences; resources accumulated; status effects; random outcomes
- team composition; enemy composition; secret conditions

A transformation can change: portrait, name, HP/max HP, abilities, passive, tags, energy costs, cooldowns, animations, sound cue, and battle background effect.

Examples:
- Patient Zero → The Infected → The Outbreak
- Nine-Tailed Trickster: 1 Tail → accumulating tails → Nine-Tail Ascension
- Fenris: Chained → Partially Unbound → Unbound
- Firebird: Living → Ash → Reborn Firebird
- Icarion: Mortal → Winged → Burning Ascension

Not every character transforms. Transformation should stay special.

## Summon system
Summons need not occupy normal character slots. Support: attached summons, temporary fourth units, minions, absorption counters, pets, thralls, totems, objects, and relics. Examples: Malachar's Thralls, Koschei's Death Relics.

## Death, resurrection, and death-adjacent rules
The engine needs explicit models for:
- death
- simultaneous death (including a both-teams-wiped draw rule)
- death prevention (Aurelia: cannot fall below 1 HP)
- death triggers
- erasure that bypasses death triggers (Shiro)
- resurrection and resurrection lock
- consecration (Father Bell)
- soul collection (Malachar)
- turn rewind (The Nameless One: needs full state snapshots)

## Healing classes
Distinguish conventional healing, life transfer (Malachar's Borrowed Life), and HP-setting effects, because anti-heal and "cannot be healed" rules check the class (see OQ-04).

## Knowledge levels
- **PUBLIC:** ability descriptions, basic stats, normal mechanics.
- **DISCOVERABLE:** transformation conditions, unusual counters, advanced interactions. These are documented in a player's Codex after they encounter them.
- **TRUE SECRETS:** hidden unlock chains, rare transformations, easter eggs, certain interactions.

Every mechanic carries a `knowledgeLevel` field. Competitive rule: a hidden mechanic may never secretly change a ranked outcome without reasonable discoverability, so it must emit a battle-log event when it fires.

## Replays and determinism
A replay reconstructs teams, initial RNG seed, turn actions, resolution, damage, healing, statuses, transformations, deaths, and winner. Store the seed plus actions plus balance version; everything else is re-derivable, and the event log is stored for verification. Replays must be small enough to share as a file and, for short matches, as a compressed URL fragment. Because all balance versions ship in the build (or are embedded in the replay), old replays still resolve after updates.

## Balance versioning
Character definitions and balance values are versioned. Every match records its BalanceVersion, and historic replays resolve against their original version.
