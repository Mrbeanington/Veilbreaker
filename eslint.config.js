// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.vite/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Node-run tooling scripts and config files, not browser code.
    files: ["scripts/**/*.mjs", "*.config.{js,ts,mjs}", "apps/*/*.config.{js,ts,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
  {
    // apps/web/sw-template.js runs in the ServiceWorker global scope, not a
    // browser window or Node — its own globals (phase-05-local-playable.md's
    // PWA foundation, ADR-012).
    files: ["apps/web/sw-template.js"],
    languageOptions: {
      globals: {
        self: "readonly",
        caches: "readonly",
        fetch: "readonly",
      },
    },
  },
  {
    // CLAUDE.md rule 4: packages/engine has no I/O, no Math.random, no Date.now.
    // All randomness must flow through the seeded RNG stored in battle state,
    // so replays and friend-match verification stay deterministic.
    files: ["packages/engine/src/**/*.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message:
            "packages/engine must be deterministic (CLAUDE.md rule 4): use the seeded RNG from BattleState instead of Math.random.",
        },
        {
          object: "Date",
          property: "now",
          message:
            "packages/engine must be deterministic (CLAUDE.md rule 4): do not read the wall clock.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "packages/engine must be deterministic (CLAUDE.md rule 4): `new Date()` reads the wall clock; pass an explicit value or remove it.",
        },
      ],
    },
  },
);
