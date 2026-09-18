# 01 — Core Rules

## Primary vision
- 3v3. Players assemble teams from a large roster.
- Each character has a small number of easy-to-understand abilities (default 4).
- Abilities spend **shared team energy** and may have cooldowns.
- Effects use simple numbers: damage, healing, defense, invulnerability, stuns, damage-over-time (DoT), and so on.
- Characters interact in surprising ways, and team composition is extremely important.
- Some characters transform or evolve mid-battle. Some counter specific powerful characters. Some deliberately break normal combat rules (Cheaters).
- Hidden characters must be discovered. Legendary characters require major accomplishments to unlock.
- Ranked PvP should produce enormous team variety.
- Easy to understand, difficult to master.

## Design commandment
**SIMPLE ABILITIES. DEEP INTERACTIONS.** An ability should be understandable in about 5 seconds.

Good examples:
- "Deal 40 damage."
- "Deal 30 damage. Deal 10 additional damage if the target attacked last turn."
- "Reduce damage taken by 20 for 2 turns."
- "Stun one enemy for 1 turn."
- "Heal an ally for 30."

Bad example: several paragraphs of exceptions and calculations.

## Match format
- Default is 3v3; each player selects three characters.
- HP is about 100 by default. Tanks have 120–160. Extreme outliers may exceed this (Behemoth has about 220 but cannot be healed).
- A player wins when all three opposing characters are defeated.
- The engine must be format-agnostic so the same system can later run 1v1, 2v2, 4v4, PvE, and boss encounters. Team size is configuration, not a constant.

## Damage language
| Value | Meaning |
|---|---|
| 10 | chip |
| 20 | light |
| 30 | normal attack |
| 40 | heavy |
| 50 | very heavy |
| 60+ | exceptional; requires meaningful cost, setup, or drawback |

Healing follows similar values. Defense blocks or reduces 10/20/30/40. Prefer fixed numbers over percentages.

## Turn system
Simultaneous planning (see OPEN-QUESTIONS OQ-01). During planning, each player secretly selects legal actions. When both lock in or the timer expires, actions resolve by priority.

### Resolution stack (default; lives in `ResolutionOrder` config)
1. Pre-turn effects
2. Transformation triggers
3. Instant defensive reactions
4. Priority abilities
5. Control effects
6. Standard attacks/support
7. Delayed effects
8. Damage-over-time
9. Healing-over-time
10. Death checks
11. Death-triggered effects
12. Post-turn effects
13. Cooldown reduction
14. Resource generation
15. Next turn

The order is not hard-coded. A single centralized resolver reads the config. Within a tier, ordering must be deterministic (see OQ-02).

## Energy
- Four families: **MIGHT, FOCUS, SPIRIT, CHAOS**, plus **NEUTRAL** costs, which any energy can satisfy.
- Example costs: 40-damage strike = 1 Might; powerful resurrection = 2 Spirit + 1 Chaos + 1 Neutral; Legendary attack = 2 Might + 2 Chaos + 1 Neutral.
- Generation lives in an `EnergyRules` config, never in character data. Rate, distribution, cap, and carryover are all configurable.
- Design target: scarcity. Players should usually want to do more than they can afford.

## Randomness (controlled)
- Good: "Deal randomly 20, 30 or 40", "Steal one random enemy energy", "Roll 1–6 with defined outcomes". Avoid huge arbitrary ranges.
- The engine must support: weighted outcomes, seeded RNG, match-authoritative RNG (seeded by the engine; in friend matches the seed is agreed via commit-reveal, see spec/06), RNG manipulation, guaranteed max/min outcomes, rerolls, and probability modification. This lets Madame Fortuna and others manipulate randomness legitimately.

## Archetype tags (characters may have several)
ATTACKER, TANK, DEFENDER, HEALER, SUPPORT, CONTROLLER, ANTI-HEALER, SUMMONER, NECROMANCER, ASSASSIN, BRUISER, EVOLUTION, CHEATER, RANDOM, CURSE, UNDEAD, BEAST, MAGE, WARRIOR, MUSIC, ATHLETE, FOLKLORE, MYTHOLOGY, SECRET, LEGENDARY.
Tags are data (an extensible enum), since abilities may check them in conditions.

## Cheaters
A Cheater is not automatically stronger. A Cheater intentionally violates **one** standard combat rule, and **every Cheater must have counterplay.** Example rule-breaks:
- change targets after actions are selected
- manipulate cooldowns
- steal energy
- change random outcomes
- temporarily copy abilities
- punish repeated abilities
- reverse debuffs
- lock an ability
- manipulate the action queue
- change ability costs
