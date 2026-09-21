import { FeedbackPanel } from "../playtest/FeedbackPanel";
import { useSettings } from "../settings/SettingsContext";
import { useProfile } from "../profile/ProfileContext";
import { soundBus } from "../sound/soundBus";
import type { Settings } from "@veilbreak/persistence";
import { DELETE_WARNING, type Platform } from "../platform/install";
import { protectionLabel } from "../platform/protection";

// spec/05 "Accessibility": animation speed, reduced motion, a scalable
// interface, high contrast, sound, and the turn timer. Statuses always show an
// icon plus text, and every control here is a labelled native control.
export interface InstallInfo {
  platform: Platform;
  /** True when the browser is holding a native install prompt we can show. */
  canPrompt: boolean;
  /** Already running as an installed app. */
  installed: boolean;
  onInstall: () => void;
}

// spec/06: install is offered at first launch and later, but a player who said
// "Not now" must always be able to come back to it, so it lives here too,
// together with the "Progress protection" status.
function InstallPanel({ install }: { install: InstallInfo }) {
  const { persistent, protection } = useProfile();
  return (
    <div className="panel" id="install">
      <div className="section-title">Install the game</div>
      {install.installed ? (
        <p>You are using the installed app. Your progress is saved on this device and the game works without an internet connection.</p>
      ) : install.canPrompt ? (
        <>
          <p>Installing keeps your progress safer and lets you play offline.</p>
          <button type="button" className="btn primary" onClick={install.onInstall}>
            Install the game
          </button>
        </>
      ) : install.platform === "ios" ? (
        <ol className="steps">
          <li>Tap the <strong>Share</strong> button in Safari (the square with an arrow).</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
          <li>Open the game from your home screen. Moving your progress? Use Profile, then &ldquo;Move to another device&rdquo; first.</li>
        </ol>
      ) : install.platform === "firefox-desktop" ? (
        <p>Firefox cannot install games, so back-ups matter most here. Make one from Profile, or turn on auto-saving to a file.</p>
      ) : (
        <p>
          Your browser has not offered an install button right now. Look for an install icon at the right end of the address bar, or open the browser menu and choose <strong>Install</strong> or{" "}
          <strong>Add to Home Screen</strong>. (Some browsers only offer it on the published game, not on a development copy.)
        </p>
      )}
      <p>
        <strong>Progress protection:</strong> {persistent ? protectionLabel(protection) : "Your browser is not saving anything for this page. Make a backup from Profile."}
      </p>
      <p className="hp-text">{DELETE_WARNING}</p>
    </div>
  );
}

export function SettingsScreen({ install }: { install?: InstallInfo }) {
  const { settings, updateSettings } = useSettings();
  const { persistent } = useProfile();

  const select = <K extends keyof Settings>(key: K, label: string, options: [Settings[K], string][], hint?: string) => (
    <div className="setting-row">
      <label htmlFor={`setting-${key}`}>{label}</label>
      <select id={`setting-${key}`} value={String(settings[key])} onChange={(e) => updateSettings({ [key]: e.target.value } as Partial<Settings>)}>
        {options.map(([value, text]) => (
          <option key={String(value)} value={String(value)}>
            {text}
          </option>
        ))}
      </select>
      {hint && <p className="hp-text">{hint}</p>}
    </div>
  );

  const check = (key: "turnTimer" | "highContrast" | "soundEnabled" | "showAllCharacters", label: string, hint?: string) => (
    <div className="setting-row">
      <label>
        <input type="checkbox" checked={settings[key]} onChange={(e) => updateSettings({ [key]: e.target.checked } as Partial<Settings>)} /> {label}
      </label>
      {hint && <p className="hp-text">{hint}</p>}
    </div>
  );

  return (
    <div>
      <h2 className="title small">Settings</h2>
      {install && <InstallPanel install={install} />}
      {!persistent && <p className="warn-text">Your browser is not letting the game save anything, so settings last only until you close this page.</p>}

      <div className="panel">
        <div className="section-title">Display</div>
        {select("uiScale", "Interface size", [["small", "Small"], ["normal", "Normal"], ["large", "Large"], ["xlarge", "Extra large"]])}
        {check("highContrast", "High contrast", "Stronger borders and brighter text.")}
      </div>

      <div className="panel">
        <div className="section-title">Motion</div>
        {select("animationSpeed", "Animation speed", [["instant", "Instant"], ["normal", "Normal"], ["slow", "Slow"]])}
        {select("reducedMotion", "Reduced motion", [["system", "Follow my system"], ["on", "Always reduce"], ["off", "Never reduce"]], "Removes movement and transitions.")}
      </div>

      <div className="panel">
        <div className="section-title">Sound</div>
        {check("soundEnabled", "Sound effects", "Off by default. The game ships without audio; this switch is ready for when it does.")}
        <div className="setting-row">
          <label htmlFor="setting-soundVolume">Volume</label>
          <input
            id="setting-soundVolume"
            type="range"
            min={0}
            max={100}
            value={settings.soundVolume}
            disabled={!settings.soundEnabled}
            onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
            onPointerUp={() => soundBus.emit("confirm")}
          />{" "}
          <output htmlFor="setting-soundVolume">{settings.soundVolume}%</output>
        </div>
      </div>

      <FeedbackPanel />

      <div className="panel">
        <div className="section-title">Play</div>
        {check("turnTimer", "Turn timer", "A clear countdown while choosing actions.")}
        {select("botLevel", "Bot skill", [["BEGINNER", "Beginner"], ["INTERMEDIATE", "Intermediate"], ["ADVANCED", "Advanced"], ["EXPERT", "Expert"]], "Higher levels think longer and plan ahead.")}
        {check("showAllCharacters", "Reveal every character", "Spoilers: skips the mystery of secret fighters and Legends. Handy for testing.")}
      </div>
    </div>
  );
}
