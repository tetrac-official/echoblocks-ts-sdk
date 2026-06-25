// Offline unit tests — no RPC. Config resolution, PDA derivation, every accepted
// private-key format, and the SDK's client-side validation guards. Fast, hermetic,
// and safe to run anywhere; the live network tests live in the 02+ files.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

import {
  loadConfig,
  DEFAULT_PROGRAM_ID,
  DEFAULT_TREASURY,
  DEVNET_GENESIS,
  Pdas,
  u64ToLeBytes,
  ConfigError,
  ValidationError,
  ReactionType,
} from "../src/index.js";
import { keypairFromSecret } from "../src/wallet.js";
import { loadEnv, primaryClient, uid } from "./helpers.js";

const EXPECTED_PUBKEY = "47v5da8rK2vrVTe9w4MZxycehmKdfdmp195qDssYrHCf";
const HEX_SECRET =
  "a6ea32d7bf8d067b9ecdb0be821594a33b1bc57380b991ddcee17553122241c62e58902da3f6443646088e745109f04315ae6c7282e6f806c9b7c1991a60433c";

describe("config", () => {
  test("resolves devnet from .env.local", () => {
    loadEnv();
    const cfg = loadConfig();
    assert.equal(cfg.isMainnet, false);
    assert.equal(cfg.cluster, "devnet");
    assert.equal(cfg.programId.toBase58(), DEFAULT_PROGRAM_ID.toBase58());
    assert.equal(cfg.programId.toBase58(), "CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh");
    assert.equal(cfg.treasury.toBase58(), DEFAULT_TREASURY.toBase58());
    assert.equal(cfg.commitment, "confirmed");
    assert.equal(cfg.rpc.expectedGenesis, DEVNET_GENESIS);
    assert.ok(cfg.rpc.customUrl, "RPC_NODE_URL should be set from env");
    assert.ok(cfg.rpc.heliusApiKey, "HELIUS_API_KEY should be set from env");
  });

  test("overrides take precedence over env", () => {
    const cfg = loadConfig({ isMainnet: true, commitment: "finalized" });
    assert.equal(cfg.isMainnet, true);
    assert.equal(cfg.cluster, "mainnet");
    assert.equal(cfg.commitment, "finalized");
  });

  test("rejects a malformed program id", () => {
    assert.throws(() => loadConfig({ programId: "not-a-real-pubkey" }), ConfigError);
  });
});

describe("private key parsing", () => {
  test("hex (128 chars) → funded wallet", () => {
    assert.equal(keypairFromSecret(HEX_SECRET).publicKey.toBase58(), EXPECTED_PUBKEY);
  });

  test("hex with 0x prefix", () => {
    assert.equal(keypairFromSecret("0x" + HEX_SECRET).publicKey.toBase58(), EXPECTED_PUBKEY);
  });

  test("base58 of the same key", () => {
    const secret = Buffer.from(HEX_SECRET, "hex");
    assert.equal(keypairFromSecret(bs58.encode(secret)).publicKey.toBase58(), EXPECTED_PUBKEY);
  });

  test("JSON byte array of the same key", () => {
    const arr = JSON.stringify([...Buffer.from(HEX_SECRET, "hex")]);
    assert.equal(keypairFromSecret(arr).publicKey.toBase58(), EXPECTED_PUBKEY);
  });

  test("32-byte hex seed is accepted", () => {
    // First 32 bytes of the secret key are the ed25519 seed → same keypair.
    const seedHex = HEX_SECRET.slice(0, 64);
    assert.equal(keypairFromSecret(seedHex).publicKey.toBase58(), EXPECTED_PUBKEY);
  });

  test("garbage and empty are rejected", () => {
    assert.throws(() => keypairFromSecret("nope"), ConfigError);
    assert.throws(() => keypairFromSecret(""), ConfigError);
    assert.throws(() => keypairFromSecret("[1,2,3]"), ConfigError); // wrong length
  });
});

describe("PDA derivation", () => {
  const pdas = new Pdas(DEFAULT_PROGRAM_ID);
  const owner = new PublicKey(EXPECTED_PUBKEY);

  test("u64ToLeBytes encodes little-endian, rejects negatives", () => {
    assert.deepEqual([...u64ToLeBytes(1)], [1, 0, 0, 0, 0, 0, 0, 0]);
    assert.deepEqual([...u64ToLeBytes(256)], [0, 1, 0, 0, 0, 0, 0, 0]);
    assert.equal(u64ToLeBytes(0).length, 8);
    assert.throws(() => u64ToLeBytes(-1), RangeError);
  });

  test("derivations are deterministic and off-curve", () => {
    const a = pdas.profile(owner);
    const b = pdas.profile(owner);
    assert.equal(a.toBase58(), b.toBase58());
    assert.equal(PublicKey.isOnCurve(a.toBytes()), false, "a PDA must be off-curve");

    const [addr, bump] = pdas.deriveWithBump([Buffer.from("profile"), owner.toBuffer()]);
    assert.equal(addr.toBase58(), a.toBase58());
    assert.ok(bump >= 0 && bump <= 255);
  });

  test("different account kinds / ids derive distinct PDAs", () => {
    const post0 = pdas.post(owner, 0);
    const post1 = pdas.post(owner, 1);
    const profile = pdas.profile(owner);
    const set = new Set([post0.toBase58(), post1.toBase58(), profile.toBase58()]);
    assert.equal(set.size, 3);
  });

  test("u64 id type coercion is consistent (number == bigint == string == BN-ish)", () => {
    const id = 123456789n;
    assert.equal(pdas.post(owner, Number(id)).toBase58(), pdas.post(owner, id).toBase58());
    assert.equal(pdas.post(owner, id.toString()).toBase58(), pdas.post(owner, id).toBase58());
  });
});

describe("client-side validation (no tx is sent)", () => {
  // Build a signer-bearing client so methods reach their validation guards
  // (validation runs before any RPC). Nothing here touches the network.
  const client = primaryClient();

  test("oversized username/content throw ValidationError", async () => {
    await assert.rejects(() => client.createProfile("x".repeat(17)), ValidationError);
    await assert.rejects(() => client.createProfile("ok", "d".repeat(25)), ValidationError);
    await assert.rejects(() => client.createPost({ postId: uid(), content: "x".repeat(501) }), ValidationError);
    await assert.rejects(() => client.createProfile(""), ValidationError);
  });

  test("reactionType must be 0..5", async () => {
    await assert.rejects(
      () => client.reactToPost({ postAuthor: client.walletPublicKey, postId: uid(), reactionType: 6 }),
      ValidationError,
    );
    await assert.rejects(
      () => client.reactToPost({ postAuthor: client.walletPublicKey, postId: uid(), reactionType: -1 }),
      ValidationError,
    );
  });

  test("poll numOptions must be 2..4 and vote choice 0..3", async () => {
    await assert.rejects(
      () =>
        client.createPoll({
          pollId: uid(),
          question: "q",
          optionA: "a",
          optionB: "b",
          numOptions: 5,
          endsAt: Math.floor(Date.now() / 1000) + 3600,
        }),
      ValidationError,
    );
    await assert.rejects(
      () => client.votePoll({ pollCreator: client.walletPublicKey, pollId: uid(), choice: 9 }),
      ValidationError,
    );
  });

  test("ReactionType enum maps to its numeric value", () => {
    assert.equal(ReactionType.Like, 0);
    assert.equal(ReactionType.Angry, 5);
  });
});
