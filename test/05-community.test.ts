// Live community + membership lifecycle on devnet:
//   create (creator is COUNTED as member 1, but gets no Membership PDA) →
//   join (creates the creator's Membership PDA, count → 2) →
//   leave (closes it, rent → treasury, count → 1) →
//   update metadata → close community.

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { primaryClient, assertFunded, ensureProfile, uid } from "./helpers.js";

const T = { timeout: 90_000 };

describe("live: community (devnet)", () => {
  const client = primaryClient();
  const me = client.walletPublicKey;
  const communityId = uid();

  before(async () => {
    await assertFunded(client);
    await ensureProfile(client, "sdktester", "SDK Tester", "live devnet suite");
  });

  after(async () => {
    await client.leaveCommunity({ communityId }).catch(() => {});
    await client.closeCommunity({ communityId }).catch(() => {});
  });

  test("createCommunity → creator counted as member 1, no membership PDA yet", T, async () => {
    const name = `suite-${communityId}`.slice(0, 32);
    const res = await client.createCommunity({ communityId, name, description: "live suite" });
    assert.ok(res.signature);

    const community = await client.getCommunity(communityId);
    assert.ok(community, "community should exist");
    assert.equal(community.creator.toBase58(), me.toBase58());
    assert.equal(community.name, name);
    assert.equal(community.communityId.toString(), communityId.toString());
    assert.equal(community.memberCount, 1, "creator is counted as the first member");

    // create_community only sets the counter — it does NOT init a Membership PDA.
    assert.equal(await client.getMembership(communityId, me), null);
  });

  test("joinCommunity → membership PDA created, count → 2", T, async () => {
    await client.joinCommunity({ communityId });

    const membership = await client.getMembership(communityId, me);
    assert.ok(membership, "membership PDA should exist after join");
    assert.equal(membership.member.toBase58(), me.toBase58());

    const community = await client.getCommunity(communityId);
    assert.equal(community?.memberCount, 2);
  });

  test("leaveCommunity → membership PDA closed, count → 1", T, async () => {
    await client.leaveCommunity({ communityId });
    assert.equal(await client.getMembership(communityId, me), null);

    const community = await client.getCommunity(communityId);
    assert.equal(community?.memberCount, 1);
  });

  test("updateCommunity → description changes on-chain", T, async () => {
    const description = `updated ${communityId}`;
    await client.updateCommunity({ communityId, description });
    const after = await client.getCommunity(communityId);
    assert.equal(after?.description, description);
  });

  test("closeCommunity → account is gone", T, async () => {
    await client.closeCommunity({ communityId });
    assert.equal(await client.getCommunity(communityId), null);
  });
});
