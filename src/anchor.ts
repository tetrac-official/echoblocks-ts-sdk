// Interop shim for `@coral-xyz/anchor`.
//
// Anchor ships as CommonJS. Under Node's native ESM loader its named exports
// (BN, Program, AnchorProvider) are NOT statically detectable, so
// `import { BN } from "@coral-xyz/anchor"` throws "does not provide an export
// named 'BN'" at runtime — even in the bundled ESM output. We side-step that by
// importing the default (the CJS `module.exports` object) and re-exporting the
// runtime values with their proper types. Type-only re-exports are erased at
// compile time and need no shim. Import anchor through THIS module everywhere.

import * as anchorNs from "@coral-xyz/anchor";
import type * as Anchor from "@coral-xyz/anchor";

// Resolve the real module.exports object across runtimes:
//   • Node ESM       → `anchorNs.default` is the CJS module.exports (has BN, Program…)
//   • esbuild CJS out → `__toESM` keeps `__esModule` modules as-is, so `.default` is
//                       absent and `anchorNs` itself is module.exports.
// The `.default ?? namespace` fallback picks the right one in both cases.
type AnchorModule = typeof Anchor;
const ns = anchorNs as unknown as AnchorModule & { default?: AnchorModule };
const anchor: AnchorModule = ns.default ?? ns;

// ── Runtime values ──
export const BN = anchor.BN;
export const Program = anchor.Program;
export const AnchorProvider = anchor.AnchorProvider;

// ── Types (erased) ──
export type BN = Anchor.BN;
export type Program<T extends Anchor.Idl = Anchor.Idl> = Anchor.Program<T>;
export type AnchorProvider = Anchor.AnchorProvider;
export type Wallet = Anchor.Wallet;
export type Idl = Anchor.Idl;
export type IdlAccounts<T extends Anchor.Idl> = Anchor.IdlAccounts<T>;
