# 05 — UI / UX

## Visual identity
Original dark-fantasy competitive interface. Desktop-first, but responsive and mobile-compatible. Never trace or closely reproduce existing arena-game screens.

## Main navigation
PLAY · CHARACTERS · TEAMS · RANKED · CODEX · MISSIONS · LEGENDS · PROFILE · SETTINGS

PLAY offers: Vs. AI, PvE/Trials, Local Hotseat, Friend Match (by code), and Replays. RANKED is the local ladder against bots. PROFILE includes Transfer to another device (QR/code/link), Receive transfer (scanner/paste), Back up (share sheet), optional Auto-save to file, JSON export/import, and a "Progress protection" status.

## Character selection
Supports search, role filter, origin filter, rarity filter, favorites, mastery, recently played, locked/unlocked, and team presets. Secret characters should create mystery (silhouettes, cryptic symbols, or absent entirely).

## Legend Chamber
- Dedicated screen with **12 positions**, and not a conventional grid (e.g., a circular hall, constellation, or ascending dais).
- Locked Legends appear as symbols or silhouettes. The Nameless One occupies the ultimate position.
- The chamber visually evolves as Legends are unlocked.

## Match screen (clarity first)
Shows: three allies, three enemies, HP, status icons, abilities, cooldowns, energy, turn timer, selected targets, selected actions, battle log, and cancel/confirm action. Animations are fast and satisfying, never slow, and there is an animation-speed option. Custom resources (Bases, Souls, Tails, Tide, Feedback, Fouls, Verse stage) get clear dedicated indicators.

## Ability tooltip format
```
TITAN HAMMER
40 DAMAGE
Cost: 1 Might
Cooldown: 1
If Asterion was damaged last turn, this deals 10 additional damage.
```
The primary information (name and headline number) is visually dominant. Tooltip text is generated from ability data wherever possible, so balance edits update it automatically.

## Codex
Per character: portrait, name, title, origin category, rarity, role, HP, ability icons, abilities, known counters, known synergies, transformations, lore, unlock hints, mastery, and discovered secrets. Entries respect knowledge levels: DISCOVERABLE entries unlock after the player personally encounters them. Unknown Secrets appear as silhouettes, cryptic symbols, or not at all.

## Install and save UX
- A first-launch install screen with per-platform instructions (see spec/06). It's friendly and skippable, never nagging.
- Transfer and restore screens use plain language ("Scan this with your new device"), show a clear save summary before overwriting, and confirm success.
- Players should never see the words IndexedDB, JSON, or PWA in normal UI.

## Friend-match code UX
Codes need one-click copy, a share button (the Web Share API where available), a paste field with instant validation, and clear status ("Waiting for your friend's commitment", "Verified ✓", "Desync detected"). Explain commit-reveal in one friendly sentence ("Your moves are locked in secretly until both of you have chosen").

## Accessibility
Keyboard navigation; colorblind-friendly status distinctions (icons plus text, never color alone); reduced motion; adjustable sound; readable tooltips; scalable interface; clear timers.

## Sound
Build event hooks only; no copyrighted audio. Per-character events: selection, attack, defense, transformation, death, Legend reveal. Music must be original or properly licensed.
