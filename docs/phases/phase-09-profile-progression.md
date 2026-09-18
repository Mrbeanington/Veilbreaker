# Phase 09 — Local profile, persistence, progression, unlocks
**Read first:** spec/06 (trust model, persistence, progression, Legend unlocks, secrets, data model)

## Deliverables
**Saving (see spec/06, "Persistence and profile," for the full spec)**
- `packages/persistence`:
  - IndexedDB wrapper, with automatic atomic saves after every match, unlock, and settings change
  - versioned save schema with zod validation and a migration runner
  - rolling backups (last 3 snapshots)
  - `navigator.storage.persist()` at startup and after install
- An automatic local profile on first launch; no login.
- **Install flow:**
  - first-launch install screen (native prompt on Chromium, illustrated steps on iOS, backup emphasis on Firefox)
  - a gentle later re-ask
  - "Progress protection" status in Settings
  - the iOS "Move my progress into the app" flow
  - a delete-the-app warning
- **Device transfer:** compact progress-only payload, QR code + text code + link on the sender; in-app camera scanner (bundled decoder), paste, or link on the receiver; save-summary comparison and confirmation before overwrite.
- **Share-sheet backup** (Web Share with files, download fallback) and file-picker restore.
- **Optional:** auto-save to a chosen file (File System Access API, Chromium desktop only, feature-detected).
- Plain JSON export/import as the universal fallback.

**Progression**
- Account level, mastery, missions, and faction challenges.
- Legend trials (PvE).
- Secret achievements evaluated by pure functions over match event logs, shown with cryptic hints.
- The Nameless One gate (11 Legends + boss).
- Match history and replay storage, with a replay viewer (file import, plus URL fragment for short matches).

## Acceptance criteria
- Tests:
  - every migration path
  - export → import round-trip equality
  - transfer-code round-trip, including decoding a rendered QR image
  - a maxed-out profile within the QR size budget
  - recovery from a simulated corrupted write via rolling backups
  - corrupted, oversized, and malicious files and codes rejected safely
  - unlock evaluation from event logs
  - the Nameless One gate
- Playwright: fresh profile → play a match → reload → progress intact; transfer from context A to context B reproduces the profile.
- Progress survives a reload. Everything works offline.

Finish with the end-of-phase report.
