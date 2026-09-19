import { useEffect, useRef, useState } from "react";
import { CHARACTER_LIBRARY, GAME_TITLE } from "@veilbreak/content";
import { SettingsProvider } from "./settings/SettingsContext";
import { useProfile } from "./profile/ProfileContext";
import { Icon, type IconName } from "./components/Icon";
import { CharacterBrowser } from "./components/CharacterBrowser";
import { PlayScreen } from "./screens/PlayScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { MatchScreen, type MatchOutcome } from "./screens/MatchScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { TeamsScreen } from "./screens/TeamsScreen";
import { LegendsScreen } from "./screens/LegendsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { applyMatchToProfile } from "./game/discovery";

// spec/05 "Main navigation".
export const SECTIONS = [
  { id: "play", label: "Play", icon: "play" },
  { id: "characters", label: "Characters", icon: "characters" },
  { id: "teams", label: "Teams", icon: "teams" },
  { id: "ranked", label: "Ranked", icon: "ranked" },
  { id: "codex", label: "Codex", icon: "codex" },
  { id: "missions", label: "Missions", icon: "missions" },
  { id: "legends", label: "Legends", icon: "legends" },
  { id: "profile", label: "Profile", icon: "profile" },
  { id: "settings", label: "Settings", icon: "settings" },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];
export type SectionId = (typeof SECTIONS)[number]["id"];

type PlayFlow =
  | { name: "home" }
  | { name: "setup"; mode: "hotseat" | "bot" }
  | { name: "match"; mode: "hotseat" | "bot"; teamAIds: string[]; teamBIds: string[]; seed: number }
  | { name: "result"; outcome: MatchOutcome; mode: "hotseat" | "bot"; teamAIds: string[]; teamBIds: string[]; revealed: string[] };

function PlaySection() {
  const { profile, update } = useProfile();
  const [flow, setFlow] = useState<PlayFlow>({ name: "home" });

  function finishMatch(current: Extract<PlayFlow, { name: "match" }>, outcome: MatchOutcome) {
    const summary = {
      teamAIds: current.teamAIds,
      teamBIds: current.teamBIds,
      winnerPlayerId: outcome.winnerPlayerId,
      humanTeams: current.mode === "bot" ? (["A"] as const) : (["A", "B"] as const),
      eventLog: outcome.eventLog ?? [],
    };
    const after = applyMatchToProfile(profile, summary);
    const revealed = after.discovered.characters
      .filter((id) => !profile.discovered.characters.includes(id))
      .map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id);
    update((p) => applyMatchToProfile(p, summary));
    setFlow({ name: "result", outcome, mode: current.mode, teamAIds: current.teamAIds, teamBIds: current.teamBIds, revealed });
  }

  switch (flow.name) {
    case "home":
      return <PlayScreen onStart={(mode) => setFlow({ name: "setup", mode })} />;
    case "setup":
      return (
        <SetupScreen
          mode={flow.mode}
          onBack={() => setFlow({ name: "home" })}
          onReady={(teamAIds, teamBIds) => setFlow({ name: "match", mode: flow.mode, teamAIds, teamBIds, seed: Date.now() })}
        />
      );
    case "match":
      return (
        <MatchScreen
          mode={flow.mode}
          teamAIds={flow.teamAIds}
          teamBIds={flow.teamBIds}
          seed={flow.seed}
          onMatchOver={(outcome) => finishMatch(flow, outcome)}
        />
      );
    case "result":
      return (
        <ResultScreen
          outcome={flow.outcome}
          revealed={flow.revealed}
          onHome={() => setFlow({ name: "home" })}
          onPlayAgain={() => setFlow({ name: "match", mode: flow.mode, teamAIds: flow.teamAIds, teamBIds: flow.teamBIds, seed: Date.now() })}
        />
      );
  }
}

export function AppShell() {
  const [section, setSection] = useState<SectionId>("play");
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = GAME_TITLE;
  }, []);

  function go(next: SectionId) {
    setSection(next);
    // Move focus to the new page so keyboard and screen-reader users land on it.
    requestAnimationFrame(() => mainRef.current?.focus());
  }

  return (
    <>
      <a className="skip-link" href="#content" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        Skip to content
      </a>
      <nav className="main-nav" aria-label="Main">
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button type="button" className={`nav-btn${section === s.id ? " active" : ""}`} aria-current={section === s.id ? "page" : undefined} onClick={() => go(s.id)}>
                <Icon name={s.icon} size={16} /> {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main id="content" className="app-shell" tabIndex={-1} ref={mainRef}>
        {section === "play" && <PlaySection />}
        {section === "characters" && (
          <div>
            <h2 className="title small">Characters</h2>
            <CharacterBrowser mode="roster" idPrefix="roster" />
          </div>
        )}
        {section === "teams" && <TeamsScreen />}
        {section === "ranked" && <PlaceholderScreen title="Ranked" text="A local ladder against bots of rising skill, with divisions and seasons." />}
        {section === "codex" && (
          <div>
            <h2 className="title small">Codex</h2>
            <CharacterBrowser mode="codex" idPrefix="codex" />
          </div>
        )}
        {section === "missions" && <PlaceholderScreen title="Missions" text="Goals that reward you for trying new fighters and teams." />}
        {section === "legends" && <LegendsScreen />}
        {section === "profile" && <PlaceholderScreen title="Profile" text="Your progress, back-ups, and moving to another device." />}
        {section === "settings" && <SettingsScreen />}
      </main>
    </>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  );
}
