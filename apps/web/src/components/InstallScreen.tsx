import { DELETE_WARNING, type Platform } from "../platform/install";

interface InstallScreenProps {
  platform: Platform;
  canPrompt: boolean;
  /** True when this browser tab already holds progress worth carrying into an installed app (iOS). */
  hasProgress: boolean;
  onInstall: () => void;
  onNotNow: () => void;
  onOpenBackup: () => void;
}

// spec/06: shown once, before the first real session. Friendly, skippable,
// never nagging. Plain words: no "PWA", "IndexedDB" or "JSON" (spec/05).
export function InstallScreen({ platform, canPrompt, hasProgress, onInstall, onNotNow, onOpenBackup }: InstallScreenProps) {
  return (
    <div className="panel install-screen" role="dialog" aria-labelledby="install-title">
      <h2 id="install-title" className="title small">
        Keep your progress safe
      </h2>
      <p>Installing the game keeps your progress safe on this device and lets you play without an internet connection. It takes a few seconds and costs nothing.</p>

      {platform === "chromium" &&
        (canPrompt ? (
          <button type="button" className="btn primary" onClick={onInstall}>
            Install the game
          </button>
        ) : (
          <p className="hp-text">Your browser will offer to install the game from its menu or the address bar.</p>
        ))}

      {platform === "ios" && (
        <>
          <ol className="steps">
            <li>Tap the <strong>Share</strong> button in Safari (the square with an arrow).</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong>, then open the game from your home screen.</li>
          </ol>
          {hasProgress && (
            <p className="warn-text">
              You already have progress in this browser. An installed app keeps its own separate save, so before you install, open Profile and copy your transfer code, then paste it in the app under
              &ldquo;Move my progress into the app&rdquo;.
            </p>
          )}
        </>
      )}

      {platform === "firefox-desktop" && (
        <p>
          Firefox cannot install games, so <strong>back-ups matter most</strong> here. Make one every so often from Profile, or turn on auto-saving to a file.
        </p>
      )}

      {platform === "other" && <p className="hp-text">Look for &ldquo;Install&rdquo; or &ldquo;Add to Home Screen&rdquo; in your browser&rsquo;s menu.</p>}

      <p className="hp-text">{DELETE_WARNING}</p>

      <div className="button-row">
        {platform === "firefox-desktop" && (
          <button type="button" className="btn primary" onClick={onOpenBackup}>
            Go to back-ups
          </button>
        )}
        <button type="button" className="btn" onClick={onNotNow}>
          Not now
        </button>
      </div>
    </div>
  );
}

interface InstallBannerProps {
  canPrompt: boolean;
  onInstall: () => void;
  onNotNow: () => void;
}

/** The gentle later re-ask (for example after the first Legend unlock). */
export function InstallBanner({ canPrompt, onInstall, onNotNow }: InstallBannerProps) {
  return (
    <div className="banner" role="region" aria-label="Install the game">
      <span>Nice work on that Legend! Installing the game keeps your progress safe.</span>
      {canPrompt && (
        <button type="button" className="btn primary" onClick={onInstall}>
          Install
        </button>
      )}
      <button type="button" className="btn" onClick={onNotNow}>
        Not now
      </button>
    </div>
  );
}
