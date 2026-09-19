# The Black Knight (Legend)
**Data:** `black-knight.ts` · LEGENDARY · WARRIOR/DEFENDER · 150 HP

## Identity / win condition
The anti-Legend. Against ordinary opponents he is a plain 150 HP bruiser: Cold Blade 30, Oathbreaker 20, Blackened Guard (Damage Reduction 20), Sword Planted (Taunt). Against anything tagged LEGENDARY he changes: Cold Blade deals 55, **Oathbreaker** silences the Legend for a turn, and **Slayer's Resolve** gives him Damage Reduction 10 whenever a Legend wounds him. This needed `hasTag` to work at last (tags now live on the runtime character, ADR-015).

## Balance levers
No help against non-Legend teams; 150 HP; his advantages depend entirely on the enemy draft, so drafting no Legend blanks him.

## Counterplay — concrete counters from the roster
- **Father Bell**: Hush silences him like anyone else (tested).
- **The Nine-Tailed Trickster**: Fox Fire's Burn ticks as unmitigated affliction damage straight through Blackened Guard (tested).
- Not drafting a Legend at all turns his passive and half his kit off.

## Readability
"He hits Legends hard." Everything else is a number.

## Deviations
Tested against **Zeiron** as the Legend (`batch3.scenario.test.ts`). The Legend tag is also visible to the player in the character select, so the relationship is discoverable from the tag rather than hidden.
