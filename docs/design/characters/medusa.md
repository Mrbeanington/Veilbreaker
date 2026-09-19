# Medusa
**Data:** `medusa.ts` · RARE · MYTHOLOGY/CONTROLLER/MAGE · 110 HP

## Identity / win condition
**Petrification**: Petrifying Gaze turns an enemy to stone for a turn: it cannot act (Stun), and for 2 turns takes 20 less damage (Damage Reduction: stone is hard). **Gorgon's Glare** stones every enemy at once for a turn, costs her 30 health (affliction, aimed at herself: HP sacrifice) and has a 6-turn cooldown. Snake Bite is 10 damage and poison; Constricting Coils weakens.

## Counterplay
She has 110 HP and no defence of her own. Both gazes are on long cooldowns (4 and 6) and need Spirit, so **Mister Whiskers**'s energy theft and **Father Bell**'s silence stop them. The Glare bleeds her: three of them would kill her. Petrified allies are still armoured, so stunning them is only a tempo win, not a damage win.

## Readability
"Stone: cannot act, hard to hurt" is the whole status. The self-cost is stated on the Glare.

## Deviations
`status.petrification` has no engine hook of its own (like Fear and Curse it is a marker); the behaviour is composed from Stun and Damage Reduction. No secret script. Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
