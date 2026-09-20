/// <reference types="vite/client" />

/** Phase 12: true in dev and test builds, and in a production build made with VITE_DEV_MODE=1. Replaced by a literal at build time, so `false` removes the dev tools from the bundle. */
declare const __DEV_TOOLS__: boolean;
/** True only when the build itself asked for dev mode (VITE_DEV_MODE=1); otherwise dev builds also need `?dev=1` in the URL. */
declare const __DEV_TOOLS_FORCED__: boolean;
/** True only in the single-file build (`vite build --mode single`, ADR-040): the bot worker is inlined and no service worker is registered. */
declare const __SINGLE_FILE__: boolean;
