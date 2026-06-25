// Live tests for the username + community-name UNIQUENESS upgrade (registry PDAs).
// These run against the upgraded devnet program (CKdp…): create_profile and
// create_community now `init` a registry PDA seeded by the handle, so a second
// claim of the same handle fails on-chain.
//
// Strategy: use a fresh, run-unique handle (so we never collide with pre-upgrade
// data), claim it once (succeeds), then claim it again from a DIFFERENT wallet /
// id (must fail). Also assert distinct handles still succeed.

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@solana/web3.js";

import { primaryClient, assertFunded, ensureProfile, fundFreshWallet, uid, type SecondaryActor } from "./helpers.js";

const T = { timeout: 120_000 };

// A short, collision-resistant, charset-safe handle. Derived from a random keypair
// (not the clock) so handles never recur across runs — important because the
// uniqueness registries are never freed, so a recurring handle would collide.
// `prefix` + 11 base58 chars ≤ 12 bytes (well within username's 16-byte limit).
function freshHandle(prefix: string): string {
  return `${prefix}${Keypair.generate().publicKey.toBase58().slice(0, 11).toLowerCase()}`;
}

describe("live: username uniqueness (devnet, upgraded program)", () => {
  const primary = primaryClient();
  let walletA: SecondaryActor | null = null;
  let walletB: SecondaryActor | null = null;
  const username = freshHandle("u"); // e.g. "u123456789" — ≤ 16 bytes

  before(async () => {
    await assertFunded(primary, 0.08);
    walletA = await fundFreshWallet(primary, 0.03);
    walletB = await fundFreshWallet(primary, 0.03);
  });

  after(async () => {
    if (walletA) await walletA.sweep();
    if (walletB) await walletB.sweep();
  });

  test("first wallet claims a fresh username → succeeds", T, async (t) => {
    if (!walletA) return t.skip("could not fund wallet A");
    const res = await walletA.client.createProfile(username, "A", "first claimant");
    assert.ok(res.signature, "createProfile should return a signature");
    assert.ok(res.accounts.usernameRegistry, "should report the username registry PDA");

    const profile = await walletA.client.getProfile(walletA.keypair.publicKey);
    assert.equal(profile?.username, username);

    // The registry PDA now exists and records wallet A as the owner.
    const reg = await primary.program.account.usernameRegistry.fetchNullable(primary.pdas.usernameRegistry(username));
    assert.ok(reg, "username registry account should exist after claim");
    assert.equal(reg.owner.toBase58(), walletA.keypair.publicKey.toBase58());
  });

  test("second wallet claiming the SAME username → rejected on-chain", T, async (t) => {
    if (!walletA || !walletB) return t.skip("could not fund both wallets");
    await assert.rejects(
      () => walletB!.client.createProfile(username, "B", "duplicate attempt"),
      /already in use|custom program error|0x0|Allocate|Simulation|failed/i,
      "registering a taken username must fail",
    );
    // And wallet B got no profile.
    assert.equal(await walletB.client.getProfile(walletB.keypair.publicKey), null);
  });

  test("a different username from the second wallet → still succeeds", T, async (t) => {
    if (!walletB) return t.skip("could not fund wallet B");
    const other = freshHandle("v");
    const res = await walletB.client.createProfile(other, "B", "distinct handle");
    assert.ok(res.signature);
    assert.equal((await walletB.client.getProfile(walletB.keypair.publicKey))?.username, other);
  });
});

describe("live: community-name uniqueness (devnet, upgraded program)", () => {
  const primary = primaryClient();
  const name = freshHandle("c"); // ≤ 32 bytes
  const id1 = uid();
  const id2 = uid();

  before(async () => {
    await assertFunded(primary, 0.05);
    await ensureProfile(primary, "sdktester", "SDK Tester", "live devnet suite");
  });

  after(async () => {
    // close_community frees the community account (the name registry is not freed —
    // names aren't reclaimable, by design). id1 is the live one.
    await primary.closeCommunity({ communityId: id1 }).catch(() => {});
  });

  test("first community claims a fresh name → succeeds", T, async () => {
    const res = await primary.createCommunity({ communityId: id1, name, description: "first" });
    assert.ok(res.signature);
    assert.ok(res.accounts.nameRegistry, "should report the name registry PDA");

    const community = await primary.getCommunity(id1);
    assert.equal(community?.name, name);

    const reg = await primary.program.account.communityNameRegistry.fetchNullable(
      primary.pdas.communityNameRegistry(name),
    );
    assert.ok(reg, "community-name registry should exist after claim");
    assert.equal(reg.communityId.toString(), id1.toString());
  });

  test("a SECOND community with the same name (different id) → rejected on-chain", T, async () => {
    await assert.rejects(
      () => primary.createCommunity({ communityId: id2, name, description: "duplicate name" }),
      /already in use|custom program error|0x0|Allocate|Simulation|failed/i,
      "a duplicate community name must fail even with a new community id",
    );
    assert.equal(await primary.getCommunity(id2), null);
  });

  test("a community with a different name → still succeeds", T, async () => {
    const other = freshHandle("d");
    const idOther = uid();
    const res = await primary.createCommunity({ communityId: idOther, name: other, description: "distinct" });
    assert.ok(res.signature);
    await primary.closeCommunity({ communityId: idOther }).catch(() => {});
  });
});
