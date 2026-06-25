// Wallet loading. The SDK never creates a wallet — it loads the signer from the
// `PRIVATE_KEY` env var (or an explicit value) and wraps it in an Anchor-compatible
// `Wallet`. No filesystem, no keygen.

import { Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import type { Wallet as AnchorWallet } from "./anchor.js";
import { ConfigError } from "./errors.js";

/** Build a Keypair from a 64-byte secret key or a 32-byte ed25519 seed. */
function keypairFromBytes(bytes: Uint8Array, source: string): Keypair {
  if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
  if (bytes.length === 32) return Keypair.fromSeed(bytes);
  throw new ConfigError(`${source} must decode to 32 (seed) or 64 (secret key) bytes, got ${bytes.length}.`);
}

/** True for a string that is purely hex digits (optionally `0x`-prefixed). */
function isHexSecret(raw: string): boolean {
  const body = raw.replace(/^0x/i, "");
  // 64 hex chars = 32-byte seed, 128 hex chars = 64-byte secret key.
  return (body.length === 64 || body.length === 128) && /^[0-9a-f]+$/i.test(body);
}

/**
 * Parse a secret key from one of three accepted formats:
 *   • base58 string (Phantom "Export Private Key", most web tooling)
 *   • hex string — 128 chars (64-byte secret) or 64 chars (32-byte seed), with an
 *     optional `0x` prefix (some Phantom/web3 exports and CLIs emit raw hex)
 *   • JSON byte array, e.g. `[12,34,...]` (solana-keygen / id.json)
 *
 * Returns a {@link Keypair}. Throws {@link ConfigError} on anything malformed.
 */
export function keypairFromSecret(secret: string): Keypair {
  const raw = secret.trim();
  if (!raw) throw new ConfigError("PRIVATE_KEY is empty.");

  // JSON byte-array form.
  if (raw.startsWith("[")) {
    let bytes: number[];
    try {
      bytes = JSON.parse(raw) as number[];
    } catch {
      throw new ConfigError("PRIVATE_KEY looks like a JSON array but could not be parsed.");
    }
    if (!Array.isArray(bytes) || bytes.some((b) => typeof b !== "number")) {
      throw new ConfigError("PRIVATE_KEY JSON array must contain only numbers.");
    }
    if (bytes.length !== 64 && bytes.length !== 32) {
      throw new ConfigError(`PRIVATE_KEY byte array must be 32 or 64 bytes, got ${bytes.length}.`);
    }
    return keypairFromBytes(Uint8Array.from(bytes), "PRIVATE_KEY byte array");
  }

  // Hex form (checked before base58: hex containing a "0" is not base58-decodable,
  // and the fixed 64/128 length disambiguates it from any real base58 secret).
  if (isHexSecret(raw)) {
    const bytes = Buffer.from(raw.replace(/^0x/i, ""), "hex");
    return keypairFromBytes(Uint8Array.from(bytes), "PRIVATE_KEY hex");
  }

  // base58 form.
  let decoded: Uint8Array;
  try {
    decoded = bs58.decode(raw);
  } catch {
    throw new ConfigError("PRIVATE_KEY is not valid base58, hex, or a JSON byte array.");
  }
  return keypairFromBytes(decoded, "PRIVATE_KEY base58");
}

/**
 * Load the signer keypair. Uses the provided secret if given, otherwise reads the
 * `PRIVATE_KEY` env var. Throws {@link ConfigError} if neither is available.
 */
export function loadKeypair(secret?: string): Keypair {
  const value = secret ?? process.env.PRIVATE_KEY;
  if (!value) {
    throw new ConfigError(
      "No signer found. Set the PRIVATE_KEY env var (base58 or JSON byte array) or pass a keypair explicitly.",
    );
  }
  return keypairFromSecret(value);
}

/**
 * Minimal Anchor `Wallet` backed by a local {@link Keypair}. Signs both legacy and
 * versioned transactions. This is all `AnchorProvider` needs to send `.rpc()` txs.
 */
export class KeypairWallet implements AnchorWallet {
  constructor(readonly payer: Keypair) {}

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof VersionedTransaction) {
      tx.sign([this.payer]);
    } else {
      (tx as Transaction).partialSign(this.payer);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return Promise.all(txs.map((tx) => this.signTransaction(tx)));
  }
}
