# Phase 04 — First five prototypes
**Read first:** spec/03 (these five characters, plus Father Bell's description for Malachar's counter hooks), spec/04 (all)

## Characters
Tortuga Rex · Mister Whiskers · Patient Zero · Mason "Moonshot" Maddox · Malachar

## Deliverables
- Pure data definitions in `packages/content/characters/<id>.ts|json`: HP, tags, rarity, origin, 4 abilities, passive, transformations, and knowledgeLevel per mechanic. Numbers follow the damage language.
- Design notes per character (`docs/design/characters/<id>.md`): identity, win condition, counterplay, known counters and synergies, and a 5-second readability check for each ability.
- Required mechanics:
  - Tortuga: Shellquake conditional on prior defensive setup.
  - Whiskers: Nine Lives plus at least one Cheater rule-break with explicit counterplay; the hidden hook toward Whiskers, Devourer of Worlds (definition may be stubbed).
  - Patient Zero: Infection spreading → The Infected → The Outbreak.
  - Moonshot: base track, Strikes, Home Run payoff.
  - Malachar: Souls, Thrall, Borrowed Life as lifeTransfer, Corpse Command, You Belong To Me, and the Death King transformation. Consecration must block souls, resurrection, thralls, and corpse use (tested with a minimal test-fixture Bell effect).
- A complete **CharacterVisualBible** and **CharacterArtSpec** for all five, including transformed states (The Infected, The Outbreak, The Death King, and Whiskers, Devourer of Worlds), secret silhouette prompts where applicable, and prompts composed from the bible via the prompt composer.
- Tooltip text generated from data.
- Any custom scripts registered in DECISIONS.md (the goal is zero or near zero).

## Acceptance criteria
Every definition passes schema validation. Each signature mechanic has scenario tests (scripted multi-turn battles). The coverage matrix is generated.

Finish with the end-of-phase report.
