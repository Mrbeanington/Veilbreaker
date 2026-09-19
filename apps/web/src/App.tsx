import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHARACTER_LIBRARY, GAME_TITLE } from "@veilbreak/content";
import { exportBackup, listReplays, saveReplay } from "@veilbreak/persistence";
import { SettingsProvider } from "./settings/SettingsContext";
import { useProfile } from "./profile/ProfileContext";
import { Icon, type IconName } from "./components/Icon";
import { CharacterBrowser } from "./components/CharacterBrowser";
import { InstallBanner, InstallScreen } from "./components/InstallScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { MatchScreen, type MatchOutcome } from "./screens/MatchScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { TeamsScreen } from "./screens/TeamsScreen";
import { LegendsScreen } from "./screens/LegendsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MissionsScreen } from "./screens/MissionsScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { TrialsScreen } from "./screens/TrialsScreen";
import { finishMatch } from "./game/finishMatch";
import type { LegendTrial, ProgressReport } from "./game/progression";
import { installPlan } from "./platform/install";
import { requestPersistence } from "./platform/protection";
import { useInstallPrompt } from "./platform/useInstallPrompt";
import { writeAutosave } from "./platform/files";

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

type Mode = "hotseat" | "bot";
type PlayFlow =
  | { name: "home" }
  | { name: "setup"; mode: Mode }
  | { name: "trials" }
  | { name: "trial-setup"; trial: LegendTrial }
  | { name: "match"; mode: Mode | "trial"; teamAIds: string[]; teamBIds: string[]; seed: number; trial?: LegendTrial }
  | { name: "result"; outcome: MatchOutcome; mode: Mode | "trial"; teamAIds: string[]; teamBIds: string[]; trial?: LegendTrial; revealed: string[]; report: ProgressReport };

function PlaySection({ onOpenReplays }: { onOpenReplays: () => void }) {
  const { profile, update, store } = useProfile();
  const [flow, setFlow] = useState<PlayFlow>({ name: "home" });

  function onMatchFinished(current: Extract<PlayFlow, { name: "match" }>, outcome: MatchOutcome) {
    const done = finishMatch(
      profile,
      { mode: current.mode, trialId: current.trial?.id, teamAIds: current.teamAIds, teamBIds: current.teamBIds, seed: current.seed },
      outcome,
      Date.now(),
    );
    // A finished match is a milestone: save it (and rotate the backups) immediately.
    update(() => done.profile, { milestone: true });
    if (done.replay) void saveReplay(store, done.replay).catch(() => undefined);
    const revealed = done.report.revealed.map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id);
    setFlow({ name: "result", outcome, mode: current.mode, teamAIds: current.teamAIds, teamBIds: current.teamBIds, trial: current.trial, revealed, report: done.report });
  }

  switch (flow.name) {
    case "home":
      return (
        <PlayScreen
          onStart={(mode) => (mode === "trials" ? setFlow({ name: "trials" }) : mode === "replays" ? onOpenReplays() : setFlow({ name: "setup", mode }))}
        />
      );
    case "setup":
      return (
        <SetupScreen
          mode={flow.mode}
          onBack={() => setFlow({ name: "home" })}
          onReady={(teamAIds, teamBIds) => setFlow({ name: "match", mode: flow.mode, teamAIds, teamBIds, seed: Date.now() })}
        />
      );
    case "trials":
      return <TrialsScreen onBack={() => setFlow({ name: "home" })} onStart={(trial) => setFlow({ name: "trial-setup", trial })} />;
    case "trial-setup":
      return (
        <SetupScreen
          mode="bot"
          title="Choose your team for the trial"
          opponentIds={flow.trial.enemyTeam}
          onBack={() => setFlow({ name: "trials" })}
          onReady={(teamAIds, teamBIds) => setFlow({ name: "match", mode: "trial", teamAIds, teamBIds, seed: Date.now(), trial: flow.trial })}
        />
      );
    case "match":
      return (
        <MatchScreen
          mode={flow.mode === "hotseat" ? "hotseat" : "bot"}
          botLevel={flow.mode === "trial" ? "LEGEND_BOSS" : undefined}
          teamAIds={flow.teamAIds}
          teamBIds={flow.teamBIds}
          seed={flow.seed}
          onMatchOver={(outcome) => onMatchFinished(flow, outcome)}
        />
      );
    case "result":
      return (
        <ResultScreen
          outcome={flow.outcome}
          revealed={flow.revealed}
          report={flow.report}
          onHome={() => setFlow({ name: "home" })}
          onPlayAgain={() =>
            setFlow({ name: "match", mode: flow.mode, teamAIds: flow.teamAIds, teamBIds: flow.teamBIds, seed: Date.now(), trial: flow.trial })
          }
        />
      );
  }
}

/** `#transfer=<code>` and `#replay=<code>` links (the fragment never leaves the device). */
function readHash(): { transfer?: string; replay?: string } {
  if (typeof location === "undefined") return {};
  const hash = location.hash;
  return { transfer: /^#transfer=([A-Za-z0-9_.-]+)/.exec(hash)?.[1], replay: /^#replay=([A-Za-z0-9_.-]+)/.exec(hash)?.[1] };
}

export function AppShell() {
  const { profile, update, ready, store } = useProfile();
  const initial = useMemo(readHash, []);
  const [section, setSection] = useState<SectionId>(initial.transfer || initial.replay ? "profile" : "play");
  const mainRef = useRef<HTMLElement>(null);

  const { env, platform, canPrompt, promptInstall } = useInstallPrompt(() => {
    update((p) => ({ ...p, install: { ...p.install, installed: true, firstLaunchHandled: true } }));
    void requestPersistence(); // again after install (spec/06)
  });
  const plan = ready ? installPlan(profile, env, platform, Date.now()) : "none";

  useEffect(() => {
    document.title = GAME_TITLE;
  }, []);

  useEffect(() => {
    // Take the fragment out of the address bar once it has been read.
    if ((initial.transfer || initial.replay) && typeof history !== "undefined") history.replaceState(null, "", location.pathname + location.search);
  }, [initial]);

  // Optional auto-save to a chosen file: rewritten shortly after each save.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void listReplays(store).then((replays) => writeAutosave(store, exportBackup(profile, replays)));
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile, ready, store]);

  const go = useCallback((next: SectionId) => {
    setSection(next);
    // Move focus to the new page so keyboard and screen-reader users land on it.
    requestAnimationFrame(() => mainRef.current?.focus());
  }, []);

  const asked = (change: { installed?: boolean } = {}) =>
    update((p) => ({ ...p, install: { ...p.install, ...change, firstLaunchHandled: true, asks: p.install.asks + 1, lastAskAt: Date.now() } }));

  async function install() {
    const outcome = await promptInstall();
    if (outcome === "accepted") update((p) => ({ ...p, install: { ...p.install, installed: true, firstLaunchHandled: true } }));
    else asked();
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
        {plan === "screen" ? (
          <InstallScreen
            platform={platform}
            canPrompt={canPrompt}
            hasProgress={profile.matchesPlayed > 0}
            onInstall={() => void install()}
            onNotNow={() => asked()}
            onOpenBackup={() => {
              asked();
              go("profile");
            }}
          />
        ) : (
          <>
            {plan === "banner" && <InstallBanner canPrompt={canPrompt} onInstall={() => void install()} onNotNow={() => asked()} />}
            {section === "play" && <PlaySection onOpenReplays={() => go("profile")} />}
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
            {section === "missions" && <MissionsScreen />}
            {section === "legends" && <LegendsScreen />}
            {section === "profile" && <ProfileScreen initialTransferCode={initial.transfer} initialReplayCode={initial.replay} />}
            {section === "settings" && <SettingsScreen />}
          </>
        )}
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
