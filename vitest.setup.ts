import { beforeAll, expect } from "vitest";
import { activateBalance } from "./packages/content/src/index";

// The app and its bot worker call `activateBalance()` at startup (ADR-035), so app tests run under the
// newest published balance. Package tests (engine scenarios, roster checks) keep the released
// release-1 numbers their expectations were written against; `baseLibraries()` is always release-1.
beforeAll(() => {
  const path = (expect.getState().testPath ?? "").replaceAll("\\", "/");
  if (path.includes("/apps/web/")) activateBalance();
});
