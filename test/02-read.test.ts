// Live read-only tests against real devnet. Exercises the RPC failover pool,
// cluster/genesis verification, the deployed program account, and the typed
// account decoders (getProgramAccounts). No transactions, no signer required.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { DEVNET_GENESIS } from "../src/index.js";
import { readOnlyClient, primaryClient } from "./helpers.js";

const T = { timeout: 60_000 };

describe("live: RPC + reads (devnet)", () => {
  const ro = readOnlyClient();

  test("health check finds at least one healthy, on-cluster provider", T, async () => {
    const health = await ro.healthCheck();
    assert.ok(health.length > 0, "pool should have providers");

    // The functional requirement for a failover pool: at least one provider is
    // reachable, healthy, on the correct cluster, and reporting a live slot.
    // (A misconfigured/unauth endpoint that merely answers getHealth is tolerated
    // because failover routes around it — it must not be on the WRONG cluster.)
    const serviceable = health.filter((h) => h.healthy && h.genesisOk && (h.slot ?? 0) > 0);
    assert.ok(
      serviceable.length > 0,
      `no healthy, on-cluster RPC provider available:\n${JSON.stringify(health, null, 2)}`,
    );
    for (const h of health) {
      console.log(`    ${h.healthy ? "✔" : "✖"} ${h.url}  genesisOk=${h.genesisOk}  slot=${h.slot}`);
    }
  });

  test("connection reports the devnet genesis hash", T, async () => {
    const genesis = await ro.connection.getGenesisHash();
    assert.equal(genesis, DEVNET_GENESIS);
  });

  test("the configured program is deployed and executable", T, async () => {
    const info = await ro.connection.getAccountInfo(ro.programId);
    assert.ok(info, "program account not found on devnet");
    assert.equal(info.executable, true);
  });

  test("getProgramAccounts decoders return typed arrays", T, async () => {
    const posts = await ro.allPosts();
    const profiles = await ro.allProfiles();
    assert.ok(Array.isArray(posts));
    assert.ok(Array.isArray(profiles));

    // If there is any on-chain state, the decoder should produce well-typed fields.
    const p = posts[0];
    if (p) {
      assert.ok(p.publicKey, "decoded post missing its address");
      assert.equal(typeof p.account.content, "string");
      assert.equal(typeof p.account.postId.toString(), "string"); // BN
    }
    console.log(`    on-chain: ${posts.length} posts, ${profiles.length} profiles`);
  });

  test("balance read works for the funded signer", T, async () => {
    const signed = primaryClient();
    const sol = await signed.getBalance();
    assert.equal(typeof sol, "number");
    assert.ok(sol >= 0);
    console.log(`    signer ${signed.walletPublicKey.toBase58()} balance: ${sol} SOL`);
  });
});
