/**
 * End-to-end write example: create a profile (if needed), publish a post, then
 * comment on it. Run with:  npm run example:post
 *
 * Requires a funded devnet wallet in PRIVATE_KEY (see .env.example).
 */
import { EchoBlocksClient } from "../src/index.js";

async function main(): Promise<void> {
  const client = EchoBlocksClient.fromEnv();
  const me = client.walletPublicKey;
  console.log(`Wallet:  ${me.toBase58()}`);
  console.log(`Cluster: ${client.cluster}  |  Program: ${client.programId.toBase58()}`);
  console.log(`Balance: ${await client.getBalance()} SOL`);

  // 1. Ensure a profile exists.
  const existing = await client.getProfile(me);
  if (!existing) {
    const { signature } = await client.createProfile("sdk_demo", "SDK Demo", "posting via the node sdk");
    console.log(`Created profile: ${signature}`);
  } else {
    console.log(`Profile already exists: @${existing.username}`);
  }

  // 2. Publish a post. postId just needs to be unique per author.
  const postId = Math.floor(Date.now() / 1000);
  const post = await client.createPost({ postId, content: "gm from the ShadowSpace Node SDK 🚀" });
  console.log(`Posted (#${postId}): ${post.signature}`);
  console.log(`Post PDA: ${post.accounts.post?.toBase58()}`);

  // 3. Comment on our own post.
  const comment = await client.createComment({
    postAuthor: me,
    postId,
    commentIndex: 0,
    content: "first!",
  });
  console.log(`Commented: ${comment.signature}`);

  // 4. Read it back.
  const fetched = await client.getPost(me, postId);
  console.log(`Fetched post content: "${fetched?.content}" | likes: ${fetched?.likes}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
