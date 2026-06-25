// Live poll lifecycle on devnet: create a poll → cast a vote → verify the tally
// and the per-voter vote record → close the poll.

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { primaryClient, assertFunded, ensureProfile, uid } from "./helpers.js";

const T = { timeout: 90_000 };

describe("live: poll (devnet)", () => {
  const client = primaryClient();
  const me = client.walletPublicKey;
  const pollId = uid();
  const endsAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // +1 day, within the program's 30-day cap

  before(async () => {
    await assertFunded(client);
    await ensureProfile(client, "sdktester", "SDK Tester", "live devnet suite");
  });

  after(async () => {
    await client.closePoll({ pollId }).catch(() => {});
  });

  test("createPoll → reads back with zeroed tallies", T, async () => {
    const res = await client.createPoll({
      pollId,
      question: "SDK live test — pick one",
      optionA: "alpha",
      optionB: "bravo",
      optionC: "charlie",
      numOptions: 3,
      endsAt,
    });
    assert.ok(res.signature);

    const poll = await client.getPoll(me, pollId);
    assert.ok(poll, "poll should exist");
    assert.equal(poll.creator.toBase58(), me.toBase58());
    assert.equal(poll.numOptions, 3);
    assert.equal(poll.totalVotes, 0);
    assert.equal(poll.isClosed, false);
    assert.equal(poll.optionA, "alpha");
  });

  test("votePoll → tally and per-voter record update", T, async () => {
    await client.votePoll({ pollCreator: me, pollId, choice: 0 });

    const poll = await client.getPoll(me, pollId);
    assert.ok(poll);
    assert.equal(poll.votesA, 1);
    assert.equal(poll.totalVotes, 1);

    const vote = await client.getPollVote(me, pollId, me);
    assert.ok(vote, "vote record should exist");
    assert.equal(vote.choice, 0);
    assert.equal(vote.voter.toBase58(), me.toBase58());
  });

  test("closePoll → soft close (is_closed=true; account persists, no rent refund)", T, async () => {
    // NOTE: unlike the other close_* instructions, close_poll does NOT deallocate
    // the account or refund rent — it only flips is_closed. The poll stays readable.
    await client.closePoll({ pollId });
    const poll = await client.getPoll(me, pollId);
    assert.ok(poll, "poll account should still exist after a soft close");
    assert.equal(poll.isClosed, true);
  });
});
