import { useSettings } from "../settings/SettingsContext";
import { useProfile } from "../profile/ProfileContext";
import { soundBus } from "../sound/soundBus";
import type { Settings } from "@veilbreak/persistence";

// spec/05 "Accessibility": animation speed, reduced motion, a scalable
// interface, high contrast, sound, and the turn timer. Statuses always show an
// icon plus text, and every control here is a labelled native control.
export function SettingsScreen() {
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

      <div className="panel">
        <div className="section-title">Play</div>
        {check("turnTimer", "Turn timer", "A clear countdown while choosing actions.")}
        {select("botLevel", "Bot skill", [["BEGINNER", "Beginner"], ["INTERMEDIATE", "Intermediate"], ["ADVANCED", "Advanced"], ["EXPERT", "Expert"]], "Higher levels think longer and plan ahead.")}
        {check("showAllCharacters", "Reveal every character", "Spoilers: skips the mystery of secret fighters and Legends. Handy for testing.")}
      </div>
    </div>
  );
}
