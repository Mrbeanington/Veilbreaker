import { useEffect } from "react";
import { GAME_TITLE } from "@veilbreak/content";

export function App() {
  useEffect(() => {
    document.title = GAME_TITLE;
  }, []);

  return (
    <main>
      <h1>{GAME_TITLE}</h1>
      <p>Phase 00 scaffold — no gameplay yet. See docs/PROGRESS.md for the current phase.</p>
    </main>
  );
}
