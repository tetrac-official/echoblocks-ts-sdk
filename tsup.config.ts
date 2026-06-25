import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // The Solana / Anchor runtime stays external — consumers install them as deps.
  external: ["@coral-xyz/anchor", "@solana/web3.js", "bs58", "dotenv"],
  target: "node18",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
