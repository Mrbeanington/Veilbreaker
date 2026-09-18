# 07 — Testing and Balance

## Required automated tests
- **Combat basics:** damage, healing, shields, invulnerability, stuns, cooldowns, energy.
- **Death:** death, simultaneous death, resurrection, anti-resurrection.
- **Systems:** transformations, summons, target redirection, randomness, RNG manipulation, ability locking.
- **Character mechanics:**
  - Legend interactions
  - Malachar / Father Bell interaction
  - Koschei Death Seals
  - Patient Zero evolution
  - Moonshot bases
  - Referee Fouls
  - Orpheon sequence
  - Nameless One rewind
- **Replays:** determinism (same seed + actions + version = identical event log).
- **Balance data:** schema validation for every character, status, and balance file.
- **Client-only platform:**
  - save-schema migrations (every version to latest)
  - export/import round-trips
  - transfer-code round-trip (encode → QR image → decode → import)
  - a maxed-out profile fits the QR size budget
  - the multi-frame QR fallback, if implemented
  - rolling-backup recovery from a simulated corrupted write
  - the overwrite-confirmation flow
  - Web Share and File System Access feature-detection fallbacks
  - manifest and service-worker installability (a Lighthouse PWA check)
  - corrupted and malicious save/code rejection
  - commit-reveal (a wrong reveal is rejected)
  - seed derivation (neither player controls it)
  - state-hash desync detection
  - replay determinism across Chromium, Firefox, and WebKit (via Playwright)
  - an **offline test**: after first load with the network disabled, a full vs-AI match and save/load succeed, and the build makes zero external network requests

**The Nameless One rewind requires especially extensive state-restoration tests.** Cover restoration of every state field (HP, energy, cooldowns, statuses, summons, custom resources, RNG position, transformation stage, death flags, log), interaction with other death-prevention effects, simultaneous death, the once-per-battle limit, and replay determinism across a rewind.

## Balance simulation
Automated bot-vs-bot simulations over large batches of randomized teams, run via a Node CLI during development and in a Web Worker from dev mode. Measure:
- individual character win rates
- team win rates
- first-turn advantage
- average match duration
- Legend performance
- counter effectiveness

Do not force every character to 50%; situational characters are fine.

Hunt for and eliminate:
- dominant strategies
- unbeatable combinations
- infinite loops
- resource locks
- permanent stun chains
- unavoidable one-turn kills
- resurrection loops
- rewind loops

The engine also needs hard safety rails: a max turn count (with a draw/tiebreak rule), a max effects-per-turn guard, and a max-recursion guard on triggers.
