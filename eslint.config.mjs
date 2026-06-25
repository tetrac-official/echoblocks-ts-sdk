// Flat ESLint config (ESLint 9+). Type-aware linting for the SDK source.
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

// Node.js runtime globals used by the SDK (fetch/Response/AbortController are
// available in Node 18+). Declared so eslint doesn't flag them; the TS compiler
// is the real undefined-variable checker, so core `no-undef` is disabled below.
const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  fetch: "readonly",
  Response: "readonly",
  Request: "readonly",
  AbortController: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  Buffer: "readonly",
  structuredClone: "readonly",
};

export default [
  {
    ignores: ["dist/**", "node_modules/**", "src/idl/shadowspace.ts", "src/idl/shadowspace.json"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "examples/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2022,
      sourceType: "module",
      globals: nodeGlobals,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript handles undefined-variable detection; the core rule double-flags Node globals.
      "no-undef": "off",
      // TS allows value+type merges (e.g. `export const BN` + `export type BN`); the core rule doesn't.
      "no-redeclare": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "no-console": "off",
    },
  },
  prettier,
];
