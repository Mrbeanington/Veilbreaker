import { useEffect, useState } from "react";
import { GAME_TITLE } from "@veilbreak/content";
import { SettingsProvider } from "./settings/SettingsContext";
import { HomeScreen } from "./screens/HomeScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { MatchScreen, type MatchOutcome } from "./screens/MatchScreen";
import { ResultScreen } from "./screens/ResultScreen";

type Screen =
  | { name: "home" }
  | { name: "setup"; mode: "hotseat" | "bot" }
  | { name: "match"; mode: "hotseat" | "bot"; teamAIds: string[]; teamBIds: string[]; seed: number }
  | { name: "result"; outcome: MatchOutcome; mode: "hotseat" | "bot"; teamAIds: string[]; teamBIds: string[] };

function AppShell() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  useEffect(() => {
    document.title = GAME_TITLE;
  }, []);

  switch (screen.name) {
    case "home":
      return <HomeScreen onStart={(mode) => setScreen({ name: "setup", mode })} />;

    case "setup":
      return (
        <SetupScreen
          mode={screen.mode}
          onBack={() => setScreen({ name: "home" })}
          onReady={(teamAIds, teamBIds) =>
            setScreen({ name: "match", mode: screen.mode, teamAIds, teamBIds, seed: Date.now() })
          }
        />
      );

    case "match":
      return (
        <MatchScreen
          mode={screen.mode}
          teamAIds={screen.teamAIds}
          teamBIds={screen.teamBIds}
          seed={screen.seed}
          onMatchOver={(outcome) => setScreen({ name: "result", outcome, mode: screen.mode, teamAIds: screen.teamAIds, teamBIds: screen.teamBIds })}
        />
      );

    case "result":
      return (
        <ResultScreen
          outcome={screen.outcome}
          onHome={() => setScreen({ name: "home" })}
          onPlayAgain={() =>
            setScreen({ name: "match", mode: screen.mode, teamAIds: screen.teamAIds, teamBIds: screen.teamBIds, seed: Date.now() })
          }
        />
      );
  }
}

export function App() {
  return (
    <SettingsProvider>
      <main className="app-shell">
        <AppShell />
      </main>
    </SettingsProvider>
  );
}
