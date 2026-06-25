// Shared bootstrap for the live devnet test suite.
//
// Loads `.env.local` once, builds `EchoBlocksClient` instances against the real
// devnet deployment, and provides the small utilities the live tests need:
// unique on-chain ids, a balance guard, and a fully-provisioned "secondary actor"
// (funded by a transfer from the primary wallet) so cross-user paths — like,
// follow, vote-on-someone-else's-poll — can be exercised end to end.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { EchoBlocksClient, type FromEnvOptions } from "../src/index.js";
import { loadKeypair } from "../src/wallet.js";

// ── env ──────────────────────────────────────────────────────────────────────
const HERE = dirname(fileURLToPath(import.meta.url));
export const ENV_PATH = resolve(HERE, "..", ".env.local");

let envLoaded = false;
/** Load `.env.local` into `process.env` exactly once. */
export function loadEnv(): void {
  if (envLoaded) return;
  loadDotenv({ path: ENV_PATH });
  envLoaded = true;
}

// ── clients ──────────────────────────────────────────────────────────────────
/** A client built from `.env.local` (the funded primary signer). */
export function primaryClient(overrides: FromEnvOptions = {}): EchoBlocksClient {
  loadEnv();
  return EchoBlocksClient.fromEnv({ loadEnvFile: false, ...overrides });
}

/** A read-only client (no signer) from `.env.local`. */
export function readOnlyClient(): EchoBlocksClient {
  loadEnv();
  return EchoBlocksClient.fromEnv({ loadEnvFile: false, readOnly: true });
}

/** The raw primary keypair (for signing funding transfers directly). */
export function primaryKeypair(): Keypair {
  loadEnv();
  return loadKeypair(process.env.PRIVATE_KEY);
}

// ── unique ids ───────────────────────────────────────────────────────────────
// Monotonic, run-unique u64 ids so re-runs never collide with a previously
// initialized PDA (the program rejects re-init with AlreadyInitialized).
let idCounter = 0;
export function uid(): bigint {
  idCounter += 1;
  return BigInt(Date.now()) * 1000n + BigInt(idCounter);
}

// ── balance guard ────────────────────────────────────────────────────────────
/** Throw a clear, actionable error if the signer is underfunded for live writes. */
export async function assertFunded(client: EchoBlocksClient, minSol = 0.05): Promise<number> {
  const sol = await client.getBalance();
  if (sol < minSol) {
    throw new Error(
      `Signer ${client.walletPublicKey.toBase58()} has ${sol} SOL on ${client.cluster}; ` +
        `live write tests need at least ${minSol} SOL. Fund it (devnet faucet) and re-run.`,
    );
  }
  return sol;
}

// ── profile bootstrap ────────────────────────────────────────────────────────
/** Ensure the client's signer has a profile (idempotent: creates only if missing). */
export async function ensureProfile(
  client: EchoBlocksClient,
  username: string,
  displayName = "",
  bio = "",
): Promise<void> {
  const me = client.walletPublicKey;
  const existing = await client.getProfile(me);
  if (existing) return;
  await client.createProfile(username, displayName, bio);
}

// ── secondary actor (funded via transfer from primary) ───────────────────────
export interface SecondaryActor {
  client: EchoBlocksClient;
  keypair: Keypair;
  /** Return any remaining lamports to the primary wallet (best-effort). */
  sweep(): Promise<void>;
}

/**
 * Provision a fresh wallet funded by a transfer from the primary signer
 * (deterministic — no flaky airdrop). Does NOT create a profile, so callers can
 * exercise the create-profile path themselves (e.g. uniqueness tests). Returns
 * `null` if funding fails, so callers can skip.
 */
export async function fundFreshWallet(primary: EchoBlocksClient, sol = 0.02): Promise<SecondaryActor | null> {
  const payer = primaryKeypair();
  const wallet = Keypair.generate();
  const lamports = Math.floor(sol * LAMPORTS_PER_SOL);

  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: wallet.publicKey, lamports }),
    );
    await sendAndConfirmTransaction(primary.connection, tx, [payer], { commitment: "confirmed" });
  } catch (err) {
    console.warn(`  ⚠️  could not fund a fresh wallet, skipping dependent tests: ${(err as Error).message}`);
    return null;
  }

  const client = primaryClient({ keypair: wallet });

  const sweep = async (): Promise<void> => {
    try {
      const bal = await client.connection.getBalance(wallet.publicKey);
      const fee = 5000; // 1 signature
      if (bal > fee) {
        const tx = new Transaction().add(
          SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: payer.publicKey, lamports: bal - fee }),
        );
        await sendAndConfirmTransaction(primary.connection, tx, [wallet], { commitment: "confirmed" });
      }
    } catch {
      /* best-effort: leftover dust on the ephemeral key is acceptable */
    }
  };

  return { client, keypair: wallet, sweep };
}

/**
 * Provision a fresh, funded second wallet for cross-user tests — like
 * {@link fundFreshWallet} but also creates the wallet's profile. Returns `null`
 * if funding fails, so callers can skip.
 */
export async function provisionSecondary(primary: EchoBlocksClient, sol = 0.02): Promise<SecondaryActor | null> {
  const actor = await fundFreshWallet(primary, sol);
  if (!actor) return null;
  await ensureProfile(actor.client, `t${shortId(actor.keypair.publicKey)}`, "Secondary", "cross-user test actor");
  return actor;
}

/** A short, deterministic, username-safe tag derived from a pubkey (≤16 bytes). */
export function shortId(pk: PublicKey): string {
  return pk.toBase58().slice(0, 10).toLowerCase();
}
