// Live gated-community posting on devnet (the token-gate feature):
//   mint a fresh $GATE SPL token → create a HOLDERS-ONLY community →
//   the holder posts (gate ATA auto-derived) and the body lands as COMM|<id>|<body> →
//   a non-holder is REJECTED by the live balance check →
//   open the gate (setCommunityGate, mint=null) → the non-holder can now post.
//
// Mirrors the program's scripts/verify-comm1-gate.ts, exercised through the SDK surface
// (createCommunity gate args, setCommunityGate, createCommunityPost with auto ATA).

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { parseCommunityPostContent, TOKEN_PROGRAM_ID } from "../src/index.js";
import {
  primaryClient,
  primaryKeypair,
  assertFunded,
  ensureProfile,
  provisionSecondary,
  uid,
  type SecondaryActor,
} from "./helpers.js";

const T = { timeout: 120_000 };
const DECIMALS = 6;
const ONE = 1_000_000; // 1.0 token at 6 decimals — the community's gate_min

describe("live: gated community posting (devnet)", () => {
  const client = primaryClient();
  const payer = primaryKeypair();
  const me = client.walletPublicKey;
  const communityId = uid();
  const holderPostId = uid();
  const strangerPostId = uid();

  let mint: PublicKey;
  let secondary: SecondaryActor | null = null;

  before(async () => {
    // Minting + ATAs + a funded secondary cost more than the other suites — ask for a little headroom.
    await assertFunded(client, 0.1);
    await ensureProfile(client, "sdktester", "SDK Tester", "live devnet suite");

    // Deploy a fresh gate token (classic SPL, 6 decimals) and give the primary wallet exactly gate_min.
    mint = await createMint(client.connection, payer, payer.publicKey, null, DECIMALS);
    const ata = await getOrCreateAssociatedTokenAccount(client.connection, payer, mint, payer.publicKey);
    await mintTo(client.connection, payer, mint, ata.address, payer, ONE);

    // A second, profiled wallet that holds NONE of the gate token (funds the negative path).
    secondary = await provisionSecondary(client, 0.03);
  });

  after(async () => {
    // Best-effort cleanup (rent → treasury). Order: posts before the community they live under.
    await client.closePost({ postId: holderPostId }).catch(() => {});
    if (secondary) await secondary.client.closePost({ postId: strangerPostId }).catch(() => {});
    await client.closeCommunity({ communityId }).catch(() => {});
    if (secondary) await secondary.sweep();
  });

  test("pdas.associatedTokenAccount matches @solana/spl-token's derivation", T, async () => {
    const expected = getAssociatedTokenAddressSync(mint, me, false, TOKEN_PROGRAM_ID);
    const actual = client.pdas.associatedTokenAccount(mint, me);
    assert.equal(actual.toBase58(), expected.toBase58(), "SDK ATA derivation must equal spl-token's");
  });

  test("createCommunity with a gate → gateMint/gateMin stored on-chain", T, async () => {
    const name = `gate-${communityId}`.slice(0, 32);
    const res = await client.createCommunity({
      communityId,
      name,
      description: "gated suite",
      gateMint: mint,
      gateMin: ONE,
    });
    assert.ok(res.signature);

    const community = await client.getCommunity(communityId);
    assert.ok(community, "community should exist");
    assert.equal(community.creator.toBase58(), me.toBase58());
    assert.ok(community.gateMint, "gateMint should be set");
    assert.equal(community.gateMint?.toBase58(), mint.toBase58());
    assert.equal(community.gateMin.toString(), String(ONE));
  });

  test("holder createCommunityPost → succeeds, body stored as COMM|<id>|<body>", T, async () => {
    const body = `gated hello ${holderPostId}`;
    // gateTokenAccount omitted → the client auto-derives the holder's ATA for the gate mint.
    const res = await client.createCommunityPost({ postId: holderPostId, communityId, body });
    assert.ok(res.signature);

    const post = await client.getPost(me, holderPostId);
    assert.ok(post, "post should exist");
    const parsed = parseCommunityPostContent(post.content);
    assert.ok(parsed, "content should be a community post");
    assert.equal(parsed.communityId, communityId.toString());
    assert.equal(parsed.body, body);
  });

  test("non-holder createCommunityPost → rejected by the live gate", T, async () => {
    if (!secondary) {
      console.warn("  ⚠️  no funded secondary wallet — skipping non-holder rejection check");
      return;
    }
    // The stranger holds none of the gate token; the program rejects the write (no ATA / zero balance).
    await assert.rejects(
      secondary.client.createCommunityPost({ postId: strangerPostId, communityId, body: "should fail" }),
      "a non-holder must not be able to post into a gated community",
    );
    assert.equal(await secondary.client.getPost(secondary.keypair.publicKey, strangerPostId), null);
  });

  test("setCommunityGate(mint=null) opens it → non-holder can now post", T, async () => {
    await client.setCommunityGate({ communityId }); // omit gateMint → clears the gate
    const opened = await client.getCommunity(communityId);
    assert.equal(opened?.gateMint, null, "gate should be cleared");

    if (!secondary) {
      console.warn("  ⚠️  no funded secondary wallet — skipping open-post check");
      return;
    }
    const body = `open hello ${strangerPostId}`;
    const res = await secondary.client.createCommunityPost({ postId: strangerPostId, communityId, body });
    assert.ok(res.signature, "non-holder should post once the community is open");

    const post = await secondary.client.getPost(secondary.keypair.publicKey, strangerPostId);
    assert.equal(parseCommunityPostContent(post?.content ?? "")?.body, body);
  });
});
