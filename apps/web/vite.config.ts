import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base (CLAUDE.md "client-only"): the build output must work when
// served from any static host, including a subpath or a local file, with no
// server-side rewriting.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    // Vite's default modulepreload polyfill calls fetch() (same-origin, to
    // prefetch a CSS/JS chunk) as a fallback for browsers without native
    // `<link rel="modulepreload">` support. That fetch is harmless (it never
    // leaves the static host), but scripts/verify-client-only.mjs can't
    // distinguish "same-origin fetch" from "fetch to a third party" through
    // static analysis, and this app doesn't need the prefetch optimization
    // yet. Disabling it keeps the guard's "no fetch/XHR/WebSocket in our
    // code" rule literal instead of growing a same-origin-detection carve-out.
    modulePreload: false,
    rollupOptions: {
      output: {
        // Isolates third-party library code (React) into its own chunk, so
        // scripts/verify-client-only.mjs can hold the app's own code to the
        // full client-only standard while treating vendor internals as
        // separately-audited (see that script's VENDOR_CHUNK_PATTERN
        // comment) rather than pattern-matching strings inside a framework
        // we don't control, like React-DOM's SVG/MathML namespace URIs.
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
  // These are internal workspace packages consumed as raw TypeScript source
  // (ADR-003, docs/DECISIONS.md), not pre-built npm dependencies. Excluding
  // them from Vite's dependency pre-bundling means dev-server edits inside
  // packages/* are picked up on every request instead of only after a
  // pre-bundle cache invalidation.
  optimizeDeps: {
    exclude: ["@veilbreak/content", "@veilbreak/engine", "@veilbreak/ai", "@veilbreak/persistence"],
  },
});
