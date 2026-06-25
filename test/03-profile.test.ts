// Live profile lifecycle on devnet: ensure a profile exists (create if missing),
// then update its display fields and read the change back on-chain.

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

import { primaryClient, assertFunded } from "./helpers.js";

const T = { timeout: 90_000 };

describe("live: profile (devnet)", () => {
  const client = primaryClient();
  const me = client.walletPublicKey;

  before(async () => {
    await assertFunded(client);
  });

  test("createProfile is idempotent — a profile exists afterward", T, async () => {
    let profile = await client.getProfile(me);
    if (!profile) {
      const res = await client.createProfile("sdktester", "SDK Tester", "live devnet suite");
      assert.ok(res.signature, "createProfile returned no signature");
      assert.ok(res.accounts.profile, "createProfile returned no profile PDA");
      profile = await client.getProfile(me);
    }
    assert.ok(profile, "profile should exist after ensure");
    assert.equal(profile.owner.toBase58(), me.toBase58());
    assert.ok(profile.username.length > 0);
  });

  test("updateProfile writes display fields and they read back", T, async () => {
    const displayName = "SDK Suite";
    const bio = `updated at ${new Date().toISOString().slice(0, 19)}`;
    const res = await client.updateProfile({ displayName, bio });
    assert.ok(res.signature);

    const after = await client.getProfile(me);
    assert.ok(after);
    assert.equal(after.displayName, displayName);
    assert.equal(after.bio, bio);
  });
});
