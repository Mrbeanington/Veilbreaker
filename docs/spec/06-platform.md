# 06 — Platform (client-only)

Everything in this file runs in the browser. See the hard platform constraint in CLAUDE.md.

## Trust model
- **Solo play (vs. AI, PvE, trials, local ranked):** the local engine is the authority. Players can technically edit their own save data; this is accepted. Cheating only affects the cheater's own experience.
- **Friend matches:** there is no server to trust, so integrity comes from three things:
  1. Both clients run the same deterministic engine and verify each other's results.
  2. Commit-reveal hides simultaneous actions and prevents seed manipulation.
  3. Balance-version and content-hash checks ensure both clients run identical rules.
- There are no global leaderboards, no aggregate cross-player analytics, and no server-side unlock validation. Do not build features that pretend otherwise.

## Persistence and profile
Goal: players should almost never need to think about saving. The intended player experience is:
1. Open the game, get prompted to install it, tap Install.
2. Play. Everything saves automatically on that device.
3. Getting a new device? Tap "Transfer," scan a QR code, done.

### Automatic saving
- IndexedDB stores the profile, unlocks, mastery, missions, achievements, discovered Codex entries, teams, settings, match history, and replays. localStorage holds only small settings.
- Saves happen automatically after every match, unlock, and settings change, with atomic writes (never a half-written save).
- The profile is created automatically on first launch, with no login. Multiple local profiles on one browser are optional.
- The save schema is versioned with forward migrations and tested for every version bump.
- Keep a rolling on-device backup: the last 3 save snapshots, so a corrupted write can be recovered from.

### Install as an app (PWA): the primary save-safety strategy
- A web app manifest (name from `GAME_TITLE`, icons, standalone display) plus a service worker that caches the full game for offline play.
- **Install prompt early:** on first launch, before the first real session, show a friendly screen explaining that installing keeps progress safe and makes the game work offline.
  - Chrome/Edge/Android: use the native install prompt (`beforeinstallprompt`).
  - iPhone/iPad: show short illustrated steps (Share → Add to Home Screen), because iOS has no programmatic prompt.
  - Firefox desktop: skip the install pitch and emphasize backups.
  - "Not now" is always allowed. Re-ask gently later (e.g., after the first Legend unlock), never nag.
- Call `navigator.storage.persist()` at startup and again after install. Show the result in Settings as "Progress protection: Strong / Standard".
- **iOS storage separation:** a home-screen app on iOS does not share storage with Safari tabs. If the game detects it is running in a Safari tab *with existing progress* and the player installs, offer "Move my progress into the app." This reuses the transfer-code flow on the same device: copy the code in Safari, paste it in the app.
- Warn in Settings that deleting the app (especially on iPhone) deletes its save, and suggest a transfer or backup first.

### Device transfer: QR code or link (primary way to move devices)
- **Transfer payload:** progress only (profile, unlocks, mastery, missions, achievements, discoveries, teams, settings). Replays, match history, and rolling backups are excluded. Encode it compactly (binary schema → deflate → base64url) with a version tag and checksum.
- **Size budget:** the transfer payload must fit in a single QR code (≤ 2,500 bytes after compression, leaving headroom below QR capacity). If a future save exceeds this, split the payload into an animated multi-frame QR sequence. Test the budget against a fully unlocked, maxed-out profile.
- **Sending device:** "Transfer to another device" shows a QR code, a copyable text code, and a shareable link (`/#transfer=<code>`; the fragment is never sent to the host).
- **Receiving device**, three equivalent ways:
  - scan the QR code with an **in-app camera scanner** (bundled decoder; never a remote service)
  - paste the text code
  - open the link
  - *Note: on iOS, links and the system camera open Safari rather than the installed app, so iOS players should use the in-app scanner or paste.*
- Before overwriting, show a summary of the incoming save ("Level 23 · 7 Legends · last played Sept 12") next to the current one, and ask for confirmation. Keep the replaced save as a rolling backup.
- Transfer codes are untrusted input: validate the schema, checksum, and size, and apply migrations for older versions.

### Share-sheet backup (easy file backup)
"Back up" uses the Web Share API with a file where available (iOS, Android), so players can AirDrop it, message it to themselves, or save it to Files/Drive in two taps. Where sharing files isn't supported, fall back to a normal download. Restoring is done through a file picker. The full backup file includes everything (replays and history too).

### Auto-save to a chosen file (optional extra; Chrome/Edge desktop only)
The player picks a file once (e.g., inside their Dropbox/OneDrive folder) via the File System Access API. The game stores the file handle and rewrites the file after each save, and the player's own cloud client syncs it. After a relaunch, the browser may require one click to re-grant permission. Feature-detect this, hide it on unsupported browsers, and never make it required.

### Universal fallback
Plain JSON export/import with a checksum works on every browser and is always available in Profile.

## Progression
Substantial unlock goals: account level, character mastery, missions, faction challenges, secret achievements, local-ranked accomplishments, Legend trials, and PvE encounters. Nothing is purchasable.

## Legend unlocks
Legends represent accomplishments, for example:
- mastering a class
- winning difficult challenge chains
- completing faction trials
- defeating a Legend boss
- achieving character-specific feats
- solving secret conditions

THE NAMELESS ONE requires all other 11 Legends plus completion of his boss encounter.

## Secret achievements
Hidden achievements with cryptic hints; do not reveal all descriptions. Examples:
- win after two teammates die
- win without dealing direct damage
- cause a character to resurrect multiple times
- complete an unusual ability sequence
- defeat a specific character with an unexpected counter
- reach an obscure transformation
- finish a match with exactly 1 HP

Conditions are evaluated by a pure function over the match event log. They are never set directly by UI code, which keeps the logic testable and consistent.

## Play modes
- **Vs. AI** at all bot levels.
- **PvE:** Legend trials, faction challenge chains, and boss encounters.
- **Local hotseat:** two players on one device. Simultaneous planning uses a "pass the device" screen that hides the first player's selections.
- **Local ranked** (see below).
- **Friend match by code** (asynchronous, see below).
- **Live peer-to-peer:** a stretch goal, optional (see below).

## Local ranked
A single-player ranked ladder against tiered bots, with a hidden rating (Glicko-2 or Elo), visible divisions, placement matches, seasons (calendar-based or tied to the balance version), match history, streaks, character/team usage stats, and a local personal-best "leaderboard". Opponent bots scale with division and use varied, meta-aware teams. A pick/ban framework applies against bots at high divisions.

## Friend match by code (core multiplayer)
Asynchronous and serverless. Players exchange short text codes or links through any channel (chat, email, a text message).
- **Match setup:** the codes carry the balance version, the content hash, both teams, and each player's seed contribution. The seed is derived from both contributions using commit-reveal, so neither player controls the RNG.
- **Each turn:**
  - Each player sends a *commitment* (a SHA-256 hash of their actions plus a random salt, via the Web Crypto API).
  - Once both commitments are exchanged, each player sends their *reveal*.
  - Each client verifies the reveals against the commitments and resolves the turn locally.
  - Per-turn salts are mixed into the RNG stream, so future rolls can't be precomputed from the initial seed.
- **Verification:** each client computes a state hash after each turn and includes it in its next message. Any mismatch is flagged as a desync or tampering.
- **Codes:** compact encoding (binary → base64url, optionally compressed) that fits in a URL fragment. Fragments are never sent to the host server.
- **Unlock rules:** the host picks either "own unlocks only" or "everything unlocked." Because saves are local, "own unlocks only" is honor-based, and the UI says so.

## Live peer-to-peer (optional stretch)
WebRTC data channels with **manual signaling** (players copy/paste an offer and an answer code), using the same commit-reveal protocol as code matches.
- Without a STUN server this is only guaranteed on the same local network.
- Any public STUN/TURN usage must be optional, off by default, and never required for core functionality.
- If it proves unreliable, it stays out of scope. Code matches remain the supported multiplayer path.

## AI
Bot levels: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, LEGEND BOSS. Bots understand target priority, energy conservation, kill opportunities, defensive timing, transformations, counter relationships, and team synergy. Legend bosses may intentionally bend PvE rules. Bots run in a Web Worker with a time budget so the UI never freezes.

## Data model (client-side)
The old server entity list maps onto bundled content and IndexedDB stores.
- **Bundled, read-only content:**
  - CharacterDefinitions (versioned)
  - Abilities, Effects, Statuses
  - Missions, Achievements/Secrets definitions
  - Seasons, BalanceVersions
  - ArtAssets manifest, CharacterArtSpecs
- **IndexedDB, player data:**
  - Profile, UserCharacters, Unlocks, Mastery
  - Teams, MatchHistory, Replays
  - LocalRanking, AchievementProgress, MissionProgress
  - DiscoveredSecrets, Settings

Must scale to 500+ characters: lazy-load character data and art per region chunk if bundle size demands it.

## Balance tools (developer mode)
An in-app **dev mode**, hidden behind a build flag or URL flag and excluded from production builds by default, that edits HP, damage, healing, energy cost, cooldown, duration, status values, transformation requirements, and RNG weights **without editing source code**.
- Edits create a draft BalanceVersion in IndexedDB, show a diff, validate against schemas, and can run a quick simulation in a Worker.
- Drafts are exported as a JSON file that the developer commits to `packages/content` to publish.
- Every shipped balance version stays in the build, so old replays still resolve.

## Analytics (local only)
- **Player-facing:** personal stats from their own match history (win rates by character, team, and opponent; favorite abilities; transformation counts).
- **Developer-facing:** simulation reports (spec/07). These are the aggregate-balance source of truth, since cross-player data does not exist. They flag outliers and produce recommendations. Never auto-nerf.
- No telemetry leaves the device. There are no analytics SDKs.

## Security (client-only)
- Treat every imported code, save file, and replay as untrusted input: schema-validate it, enforce size limits, and never `eval` it or inject it as HTML.
- Sanitize and escape all player-entered text (team names, profile names) before rendering.
- Set a strict Content-Security-Policy suited to static hosting (no inline eval, no remote script sources).
- Ship no secrets or API keys (there should be none to ship).
- Keep dev mode out of production bundles unless explicitly enabled.
- Make the commit-reveal and state-hash verification in friend matches robust to malformed and malicious messages.

## Future content
Expansion themes: SLAVIC NIGHT, GODS & MONSTERS, YOKAI MOON, SATURDAY NIGHT, THINGS THAT SHOULDN'T EXIST, NEW WORLD NIGHTMARES, AGE OF SAIL, CRYPTIDS, UNDERWORLD, CELESTIAL WAR, SPORTS & SPECTACLE, MACHINES, DEEP OCEAN, FORGOTTEN KINGDOMS. Expansions ship as new static content (a new build or a lazily loaded content chunk) and must not require a new battle engine.
