# The Referee
**Data:** `the-referee.ts` · SECRET · ATHLETE/CONTROLLER · 100 HP

## Identity / win condition
He polices repetition. **Play the Whistle** (passive): whenever an enemy uses the same ability twice in a row (new `repeatedAbility` condition, ADR-015) they take a **Foul**. Fouls are a per-character pip resource (max 3) that lives on the offender. The third Foul is an **ejection**: Stun for two turns and the ledger is wiped. Penalty Flag hands out a Foul on demand; Red Card ejects at 2 Fouls (or adds one); Overrule shields him; Blow the Whistle is 20 damage.

## Counterplay
Fouls only come from repetition, so alternating two abilities never draws one (tested). The count is public. He has 100 HP and no defence besides a 2-turn shield. Ejection is only a stun, which expires. Anyone can dodge him by alternating: **Tortuga Rex** can alternate Fortress Shell and Shell Bash. **Father Bell**'s Hush keeps him from calling Penalty Flag or Red Card, and 100 HP makes him easy to burst down.

## Readability
"Don't repeat yourself." The Foul pips are visible and the ejection appears in the log as a Stun.

## Deviations
Ejection is modelled as a two-turn Stun rather than removal from the match, so it stays answerable (CLAUDE.md rule 8). The Foul pips sit on the offender, and the character card renders any tracked resource on a character generically, so the count is visible.
