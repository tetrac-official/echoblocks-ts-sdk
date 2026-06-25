// Live post lifecycle on devnet, exercised end to end and cleaned up (rent
// refunded to the treasury) so the suite is repeatable and cheap:
//   create post → edit → comment → react → close reaction → close comment → close post
// Each step is verified by reading the on-chain account back.

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { ReactionType } from "../src/index.js";
import { primaryClient, assertFunded, ensureProfile, uid } from "./helpers.js";

const T = { timeout: 90_000 };

describe("live: post / comment / reaction lifecycle (devnet)", () => {
  const client = primaryClient();
  const me = client.walletPublicKey;
  const postId = uid();
  const commentIndex = uid();

  before(async () => {
    await assertFunded(client);
    await ensureProfile(client, "sdktester", "SDK Tester", "live devnet suite");
  });

  // Safety net: if an assertion aborts mid-lifecycle, don't leave rent-bearing
  // PDAs behind. Each close is best-effort (the happy path already closed them).
  after(async () => {
    for (const fn of [
      () => client.closeReaction({ postAuthor: me, postId }),
      () => client.closeComment({ postAuthor: me, postId, commentIndex }),
      () => client.closePost({ postId }),
    ]) {
      await fn().catch(() => {});
    }
  });

  test("createPost → reads back with zeroed counters", T, async () => {
    const content = `live-suite post ${postId}`;
    const res = await client.createPost({ postId, content });
    assert.ok(res.signature);

    const post = await client.getPost(me, postId);
    assert.ok(post, "post should exist after create");
    assert.equal(post.author.toBase58(), me.toBase58());
    assert.equal(post.postId.toString(), postId.toString());
    assert.equal(post.content, content);
    assert.equal(post.likes, 0);
    assert.equal(post.commentCount, 0);
  });

  test("editPost → content updates, updatedAt advances", T, async () => {
    const before = await client.getPost(me, postId);
    assert.ok(before);
    const newContent = `edited ${postId}`;
    await client.editPost({ postId, content: newContent });

    const after = await client.getPost(me, postId);
    assert.ok(after);
    assert.equal(after.content, newContent);
    assert.ok(
      after.updatedAt.gte(before.updatedAt),
      `updatedAt should not go backwards (${after.updatedAt} < ${before.updatedAt})`,
    );
  });

  test("createComment → appears in commentsForPost and bumps commentCount", T, async () => {
    await client.createComment({ postAuthor: me, postId, commentIndex, content: "self comment" });

    const comment = await client.getComment(me, postId, commentIndex);
    assert.ok(comment, "comment should exist");
    assert.equal(comment.content, "self comment");
    assert.equal(comment.author.toBase58(), me.toBase58());

    const all = await client.commentsForPost(me, postId);
    assert.ok(
      all.some((c) => c.account.commentIndex.toString() === commentIndex.toString()),
      "commentsForPost should include the new comment",
    );

    const post = await client.getPost(me, postId);
    assert.equal(post?.commentCount, 1);
  });

  test("reactToPost → reaction PDA stores the reaction type", T, async () => {
    await client.reactToPost({ postAuthor: me, postId, reactionType: ReactionType.Love });
    const reactionPda = client.pdas.reaction(client.pdas.post(me, postId), me);
    const reaction = await client.program.account.reaction.fetchNullable(reactionPda);
    assert.ok(reaction, "reaction should exist");
    assert.equal(reaction.reactionType, ReactionType.Love);
    assert.equal(reaction.user.toBase58(), me.toBase58());
  });

  // Teardown is split into one test per close so each prints its own verified
  // line. They run in definition order (reaction → comment → post) so nothing
  // references the post when it is finally deallocated.
  test("closeReaction → reaction account is gone", T, async () => {
    await client.closeReaction({ postAuthor: me, postId });
    const reactionPda = client.pdas.reaction(client.pdas.post(me, postId), me);
    assert.equal(await client.program.account.reaction.fetchNullable(reactionPda), null);
  });

  test("closeComment → comment account is gone, commentCount back to 0", T, async () => {
    await client.closeComment({ postAuthor: me, postId, commentIndex });
    assert.equal(await client.getComment(me, postId, commentIndex), null);
    const post = await client.getPost(me, postId);
    assert.equal(post?.commentCount, 0);
  });

  test("closePost → post account deallocated (rent → treasury)", T, async () => {
    const before = await client.getPost(me, postId);
    assert.ok(before, "post should still exist right before close");

    const res = await client.closePost({ postId });
    assert.ok(res.signature, "closePost returned no signature");

    // The account is fully removed from chain — a hard close, not a soft flag.
    assert.equal(await client.getPost(me, postId), null);
  });
});
