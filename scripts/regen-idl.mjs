#!/usr/bin/env node
// Regenerate src/idl/shadowspace.{ts,json} from the ShadowSpace program's anchor build.
//
// shadowspace.json  = the raw on-chain IDL (snake_case), copied verbatim.
// shadowspace.ts    = `type Shadowspace` (Anchor's camelCase target/types, what IdlAccounts maps)
//                     + `const IDL` = the raw snake IDL cast to that type. Anchor camelCases the IDL
//                     at runtime, so the snake value is the correct input to `new Program(IDL)`; the
//                     cast just gives callers the camelCase decoded-account types via Shadowspace.
//                     (A field-by-field camelCased const does NOT typecheck against target/types —
//                     Anchor's two codegen paths disagree on seed paths / error-name casing.)
//
// Usage (point it at the program repo):
//   SHADOWSPACE_DIR=/path/to/shadowspace-program node scripts/regen-idl.mjs
//   node scripts/regen-idl.mjs /path/to/shadowspace-program
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SDK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROG = process.env.SHADOWSPACE_DIR || process.argv[2];
if (!PROG) {
  console.error("Set SHADOWSPACE_DIR or pass the shadowspace-program dir as the first argument.");
  process.exit(1);
}

const rawJson = fs.readFileSync(path.join(PROG, "target/idl/shadowspace.json"), "utf8").trim();
const idl = JSON.parse(rawJson);
if (!idl.address) throw new Error("source IDL has no `address` — run `anchor build` first.");
if (!(idl.accounts || []).find((a) => a.name === "PostStats")) {
  throw new Error("source IDL has no PostStats account — wrong/old build?");
}

const typeSrc = fs.readFileSync(path.join(PROG, "target/types/shadowspace.ts"), "utf8");
const typeStart = typeSrc.indexOf("export type Shadowspace");
if (typeStart < 0) throw new Error("could not find `export type Shadowspace` in target/types");
const typeBody = typeSrc.slice(typeStart).trimEnd();

const header = `/**
 * TypeScript IDL for the EchoBlocks / ShadowSpace program.
 *
 * Source: anchor build of the deployed program — the id is the IDL \`address\` below (kept in sync
 * with Anchor.toml by \`anchor keys sync\`). \`type Shadowspace\` is Anchor's target/types (camelCase,
 * what \`IdlAccounts\` maps); \`IDL\` is the raw snake_case on-chain IDL (the form \`new Program(IDL)\`
 * wants — Anchor camelCases it at runtime), cast to that type.
 * DO NOT hand-edit — regenerate with: node scripts/regen-idl.mjs <shadowspace-program dir>.
 */
`;

const out =
  `${header}\n${typeBody}\n\n` +
  `// Raw on-chain IDL (snake_case). Anchor camelCases it at runtime, so this is the correct value to\n` +
  `// pass to \`new Program(IDL)\`; the cast exposes the camelCase decoded-account types via Shadowspace.\n` +
  `export const IDL = ${rawJson} as unknown as Shadowspace;\n`;

fs.writeFileSync(path.join(SDK, "src/idl/shadowspace.ts"), out);
fs.writeFileSync(path.join(SDK, "src/idl/shadowspace.json"), rawJson + "\n");

console.log(`regenerated src/idl/shadowspace.{ts,json} @ ${idl.address}`);
