// Live cross-user tests on devnet. These need a SECOND signer because the program
// forbids acting on your own content (like / follow). The secondary wallet is
// provisioned by a transfer from the funded primary (no flaky airdrop); if that
// transfer fails the cross-user cases skip cleanly instead of failing the suite.
//
// Covered: like another user's post, follow/unfollow another user (with exact
// counter deltas), vote on another user's poll, and the on-chain self-action
// guards (CannotLikeOwnPost / CannotFollowSelf).

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { primaryClient, assertFunded, ensureProfile, provisionSecondary, uid, type SecondaryActor } from "./helpers.js";

const T = { timeout: 120_000 };

describe("live: cross-user (devnet)", () => {
  const primary = primaryClient();
  const me = primary.walletPublicKey;
  const postId = uid();
  const pollId = uid();
  const endsAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

  let secondary: SecondaryActor | null = null;

  before(async () => {
    await assertFunded(primary, 0.08); // enough to fund a secondary + fees
    await ensureProfile(primary, "sdktester", "SDK Tester", "live devnet suite");

    // Shared content the secondary will act on.
    await primary.createPost({ postId, content: `cross-user post ${postId}` });
    await primary.createPoll({
      pollId,
      question: "cross-user poll",
      optionA: "yes",
      optionB: "no",
      numOptions: 2,
      endsAt,
    });

    secondary = await provisionSecondary(primary, 0.03);
  });

  after(async () => {
    // Tear down primary-owned content (rent → treasury); sweep the secondary.
    await primary.closePost({ postId }).catch(() => {});
    await primary.closePoll({ pollId }).catch(() => {});
    if (secondary) await secondary.sweep();
  });

  // ── on-chain self-action guards (primary only — always run) ─────────────────
  test("program rejects liking your own post", T, async () => {
    await assert.rejects(
      () => primary.likePost({ author: me, postId }),
      /CannotLikeOwnPost|0x|custom program error|Simulation/i,
    );
  });

  test("program rejects following yourself", T, async () => {
    await assert.rejects(() => primary.followUser(me), /CannotFollowSelf|0x|custom program error|Simulation/i);
  });

  // ── cross-user happy paths (need the funded secondary) ──────────────────────
  test("secondary likes the primary's post → like record + likes count", T, async (t) => {
    if (!secondary) return t.skip("secondary wallet could not be funded");
    const them = secondary.client.walletPublicKey;

    await secondary.client.likePost({ author: me, postId });

    const record = await primary.getLikeRecord(me, postId, them);
    assert.ok(record, "like record should exist");
    assert.equal(record.liker.toBase58(), them.toBase58());

    const post = await primary.getPost(me, postId);
    assert.ok((post?.likes ?? 0) >= 1, "post.likes should be at least 1");
  });

  test("secondary follows then unfollows the primary → counter deltas", T, async (t) => {
    if (!secondary) return t.skip("secondary wallet could not be funded");
    const them = secondary.client.walletPublicKey;

    const before = (await primary.getProfile(me))!.followerCount;
    await secondary.client.followUser(me);

    const follow = await primary.getFollow(them, me);
    assert.ok(follow, "follow record should exist");
    assert.equal(follow.follower.toBase58(), them.toBase58());
    assert.equal(follow.following.toBase58(), me.toBase58());
    assert.equal((await primary.getProfile(me))!.followerCount, before + 1);

    await secondary.client.unfollowUser(me);
    assert.equal(await primary.getFollow(them, me), null, "follow record should be closed");
    assert.equal((await primary.getProfile(me))!.followerCount, before);
  });

  test("secondary votes on the primary's poll → tally + vote record", T, async (t) => {
    if (!secondary) return t.skip("secondary wallet could not be funded");
    const them = secondary.client.walletPublicKey;

    await secondary.client.votePoll({ pollCreator: me, pollId, choice: 1 });

    const poll = await primary.getPoll(me, pollId);
    assert.ok(poll);
    assert.equal(poll.votesB, 1);
    assert.equal(poll.totalVotes, 1);

    const vote = await primary.getPollVote(me, pollId, them);
    assert.ok(vote, "vote record should exist");
    assert.equal(vote.choice, 1);
  });
});
