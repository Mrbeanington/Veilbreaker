// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createUpdateWatcher } from "./registerServiceWorker";
import { UpdateBanner } from "./components/UpdateBanner";

afterEach(cleanup);

function fake(controller: unknown) {
  const containerHandlers: Record<string, () => void> = {};
  const container = { controller, addEventListener: (t: "controllerchange", f: () => void) => (containerHandlers[t] = f) };
  const regHandlers: Record<string, () => void> = {};
  const workerHandlers: Record<string, () => void> = {};
  const worker = { state: "installing", postMessage: vi.fn(), addEventListener: (_t: "statechange", f: () => void) => (workerHandlers.statechange = f) };
  const reg = { waiting: null as typeof worker | null, installing: null as typeof worker | null, addEventListener: (t: "updatefound", f: () => void) => (regHandlers[t] = f) };
  const reload = vi.fn();
  const watcher = createUpdateWatcher(container, reload);
  return { containerHandlers, regHandlers, workerHandlers, worker, reg, reload, watcher };
}

describe("update watcher", () => {
  it("becomes ready when a newer build finishes installing while an older one is running", () => {
    const f = fake({});
    f.watcher.track(f.reg);
    expect(f.watcher.ready).toBe(false);
    f.reg.installing = f.worker;
    f.regHandlers.updatefound!();
    f.worker.state = "installed";
    f.workerHandlers.statechange!();
    expect(f.watcher.ready).toBe(true);
  });

  it("stays quiet on the very first install, which replaces nothing", () => {
    const f = fake(null);
    f.watcher.track(f.reg);
    f.reg.installing = f.worker;
    f.regHandlers.updatefound!();
    f.worker.state = "installed";
    f.workerHandlers.statechange!();
    expect(f.watcher.ready).toBe(false);
  });

  it("notices a build that was already waiting when the page opened", () => {
    const f = fake({});
    f.reg.waiting = f.worker;
    f.watcher.track(f.reg);
    expect(f.watcher.ready).toBe(true);
  });

  it("asks the waiting worker to take over, and reloads only after it does", () => {
    const f = fake({});
    f.reg.waiting = f.worker;
    f.watcher.track(f.reg);
    f.containerHandlers.controllerchange!();
    expect(f.reload).not.toHaveBeenCalled();
    f.watcher.apply();
    expect(f.worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    f.containerHandlers.controllerchange!();
    expect(f.reload).toHaveBeenCalledOnce();
  });
});

describe("update banner", () => {
  it("shows nothing until an update is ready, then offers a reload button", async () => {
    const f = fake({});
    render(<UpdateBanner watcher={f.watcher} />);
    expect(screen.queryByRole("status")).toBeNull();
    f.reg.waiting = f.worker;
    f.watcher.track(f.reg);
    expect(await screen.findByRole("status", { name: "Update available" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reload to update" }));
    expect(f.worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("renders nothing where there is no service worker", () => {
    render(<UpdateBanner watcher={null} />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
