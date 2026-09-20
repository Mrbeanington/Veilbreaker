import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@fontsource/cinzel/latin-600.css";
import "./styles.css";
import { registerServiceWorker } from "./registerServiceWorker";
import { activateBalance } from "@veilbreak/content";

activateBalance();

const container = document.getElementById("root");
if (!container) {
  throw new Error("#root element not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();
