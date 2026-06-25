/**
 * Read-only example: no PRIVATE_KEY required. Probes RPC health and lists some
 * on-chain state. Run with:  npm run example:read
 */
import { ShadowSpaceClient } from "../src/index.js";

async function main(): Promise<void> {
  const client = ShadowSpaceClient.fromEnv({ readOnly: true });
  console.log(`Cluster: ${client.cluster}  |  Program: ${client.programId.toBase58()}`);

  // RPC pool health (reachability, correct cluster, slot lag).
  console.log("\nRPC provider health:");
  for (const h of await client.healthCheck()) {
    console.log(`  ${h.healthy ? "✅" : "❌"} ${h.url}  genesisOk=${h.genesisOk}  slot=${h.slot}`);
  }

  // A small sample of on-chain accounts.
  const posts = await client.allPosts();
  console.log(`\nTotal posts on-chain: ${posts.length}`);
  for (const p of posts.slice(0, 5)) {
    console.log(`  • [${p.account.postId.toString()}] ${p.account.content.slice(0, 60)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
