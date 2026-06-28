---
name: echo-blocks-client
description: >
  Correct usage of @tetrac/echoblocks-ts-sdk — the Node/TypeScript client for the
  ShadowSpace Solana social program (profiles, posts, likes, comments, reactions,
  follows, communities, polls, 1:1 chat) on devnet/mainnet. Use when writing,
  reviewing, or debugging code that imports EchoBlocksClient: configuring
  fromEnv / PRIVATE_KEY / RPC failover, creating a profile and posting, deriving
  PDAs, reading on-chain accounts (post counts now live on a separate PostStats PDA),
  handling content limits and caller-chosen ids,
  or diagnosing failures like AnchorError 3007 "AccountOwnedByWrongProgram",
  "account ... already in use", WalletRequiredError, InvalidTreasury, the protocol
  fee plus the config + treasury accounts now required on create_post and every
  close, or a future mismatch between the bundled IDL and the deployed program.
---

# EchoBlocksClient (@tetrac/echoblocks-ts-sdk)

A typed client for the **ShadowSpace** Anchor program on Solana
(`5zokTL2f5VCTu7vH2aaAhqhjRytLBFdxVJ6osEPxrJsY`, devnet by default — the id is read from
the bundled IDL, overridable via `SOLANA_PDA_ADDRESS`). It exposes
every on-chain instruction, derives all PDAs for you, and routes RPC through a
multi-provider failover pool. One `PRIVATE_KEY` signs **and** pays for everything —
no separate wallet account is created.

- Runtime: Node **>= 18** (uses global `fetch`). Ships ESM + CJS + `.d.ts`.
- Bundled deps: `@solana/web3.js`, `@coral-xyz/anchor` (re-exported — import
  `PublicKey`, `Keypair`, `Connection`, `BN` straight from the SDK).

## Golden path

```ts
import { EchoBlocksClient } from "@tetrac/echoblocks-ts-sdk";

const client = EchoBlocksClient.fromEnv(); // reads .env (see vars below)
const me = client.walletPublicKey; // throws if read-only

// 1. A profile is REQUIRED before posting/commenting/etc. Create it once.
if (!(await client.getProfile(me))) {
  await client.createProfile("handle", "Display Name", "bio");
}

// 2. postId is a CALLER-CHOSEN u64, unique per author. Reusing one = "already in use".
const postId = Math.floor(Date.now() / 1000);
const { signature, accounts } = await client.createPost({ postId, content: "gm" });
console.log(signature, accounts.post?.toBase58());

// 3. Reads return null when the account doesn't exist (no throw).
const post = await client.getPost(me, postId);
```

Always construct via `EchoBlocksClient.fromEnv(options?)`. Do **not** `new
EchoBlocksClient(...)` unless you are wiring components by hand — the constructor
takes a fully-assembled `ClientComponents`, not config.

## Configuration (env vars)

`fromEnv()` calls `dotenv` and reads `process.env`. Override any of these via the
options arg (e.g. `fromEnv({ isMainnet: true, rpcUrl, privateKey, readOnly })`).

| Var                                                                                                   | Required | Meaning                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRIVATE_KEY`                                                                                         | to write | Signer/payer. base58, hex (64/128 chars, `0x` optional), or JSON byte array `[1,2,...]`. Absent → **read-only client**.                                                                                        |
| `IS_MAINNET`                                                                                          | no       | `false` → devnet (default), `true` → mainnet-beta. Flips cluster, keyless fallback, expected genesis.                                                                                                          |
| `SOLANA_PDA_ADDRESS`                                                                                  | no       | Program ID. Defaults to the devnet deployment. Set this to repoint without a code change.                                                                                                                      |
| `SOLANA_TREASURY_ADDRESS`                                                                             | no       | Rent/fee destination. Must equal the program's on-chain `config.treasury` (DAO-rotatable via `update_config`). If the DAO rotates it, set this to the new value or every create/close fails `InvalidTreasury`. |
| `SOLANA_COMMITMENT`                                                                                   | no       | `processed` \| `confirmed` (default) \| `finalized`.                                                                                                                                                           |
| `RPC_NODE_URL`                                                                                        | no       | Pin one explicit primary endpoint (include auth in the URL).                                                                                                                                                   |
| `HELIUS_API_KEY`                                                                                      | no       | Works on both clusters; becomes the pool primary.                                                                                                                                                              |
| `FLUX_API_KEY`, `ALCHEMY_SOLANA_KEY`, `QUICKNODE_SOLANA_URL`, `SYNDICA_SOLANA_KEY`, `DRPC_SOLANA_URL` | no       | Mainnet-only secondaries; ignored on devnet.                                                                                                                                                                   |

You never pick a provider by hand — set whichever keys you have and the pool
orders/rotates them (`RPC_NODE_URL` → keyed → keyless public fallback) with a
circuit breaker, throttle, and slot-freshness checks.

Funding: the signer needs SOL for fees + PDA rent. On devnet:
`await client.requestAirdrop(1)` (throws on mainnet) or fund the pubkey at a faucet.

## API surface

Every write returns `{ signature, accounts }` (the derived PDAs it touched) and
accepts an optional `SendOptions` (`{ commitment?, skipPreflight?, maxRetries? }`).
Every read returns the decoded account or `null`.

**Identity / introspection (getters):** `walletPublicKey` (throws if read-only),
`walletPublicKeyOrNull`, `programId`, `treasury`, `cluster`, `isReadOnly`.

**Profile:** `createProfile(username, displayName?, bio?)` ·
`updateProfile({ displayName?, bio?, avatarUrl?, bannerUrl? })` ·
`migrateProfile()` (resize after a program upgrade) · `closeProfile()`.

**Posts:** `createPost({ postId, content, isPrivate? })` ·
`editPost({ postId, content })` · `closePost({ postId })` / `deletePost(...)` ·
`likePost({ author, postId })`. A post's mutable **counts** (likes, commentCount,
reaction tallies) are NOT on the post body — read them with `getPostStats(author, postId)`.

**Comments:** `createComment({ postAuthor, postId, commentIndex, content })` ·
`closeComment({ postAuthor, postId, commentIndex })`.

**Reactions:** `reactToPost({ postAuthor, postId, reactionType })` (`reactionType`
0–5, see `ReactionType` enum) · `closeReaction({ postAuthor, postId })`.

**Communities:** `createCommunity({ communityId, name, description?, avatarUrl? })`
· `joinCommunity({ communityId })` · `leaveCommunity({ communityId })` ·
`updateCommunity({ communityId, description?, avatarUrl? })` (creator only) ·
`closeCommunity({ communityId })`.

**Polls:** `createPoll({ pollId, question, optionA, optionB, optionC?, optionD?, numOptions, endsAt })`
(`numOptions` 2–4, `endsAt` = future unix seconds) ·
`votePoll({ pollCreator, pollId, choice })` (`choice` 0-based) · `closePoll({ pollId })`.

**Follow:** `followUser(target)` · `unfollowUser(target)`.

**Chat (legacy):** `createChat({ chatId, user2 })` ·
`sendMessage({ chatId, messageIndex, content })` (content stored verbatim —
encrypt client-side) · `closeChat({ chatId })` · `closeMessage({ chatId, messageIndex })`.

**Reads (single, → `T | null`):** `getProfile`, `getPost`, `getPostStats`, `getComment`,
`getCommunity`, `getMembership`, `getPoll`, `getPollVote`, `getChat`, `getMessage`,
`getFollow`, `getLikeRecord`.

**Reads (collections, heavy `getProgramAccounts` — avoid on public RPC):**
`allProfiles`, `allPosts`, `allPostStats`, `postsByAuthor(author)`, `commentsForPost`,
`likesForPost`, `allCommunities`, `membershipsOf(member)`, `allPolls`,
`following(user)`, `followers(user)`.

**Utilities:** `getBalance(address?)` (SOL) · `requestAirdrop(sol?, address?)`
(devnet only) · `healthCheck()` (probe the RPC pool).

`Address` args accept a `PublicKey` or base58 string. `U64Like` ids accept
`number | string | BN`. Need a PDA yourself? Use `client.pdas` (`profile(owner)`,
`post(author, postId)`, `postStats(author, postId)`, `comment`, `reaction`, `like`,
`follow`, `community`, `membership`, `poll`, `pollVote`, `chat`, `message`, `config`
(the global protocol-fee config PDA), `usernameRegistry`, `communityNameRegistry`).

## Correctness rules — read before you write

- **Profile first.** Posting/commenting/reacting/voting/joining all require the
  caller's profile PDA to exist. Call `getProfile(me)` and `createProfile(...)`
  once up front. Username is unique on-chain (a registry PDA) — a taken handle
  fails the transaction.
- **Post counts live on a separate `PostStats` account, not the post body.** `getPost`
  returns only `author, postId, content, isPrivate, epochDay, createdAt, updatedAt`. For
  `likes` / `commentCount` / `reactionCounts` (the per-type tally array, indices 0–5) call
  `getPostStats(author, postId)` — or `allPostStats()` and join by the `post` pubkey it
  stores. `createPost` creates **both** Post + PostStats; `closePost` closes both; the SDK
  threads the `postStats` account into create/like/comment/react/close for you.
- **Caller-chosen ids must be unique per scope, and they make ops idempotent.**
  `postId` (per author), `commentIndex` (per post), `pollId` (per creator),
  `communityId`, `chatId`, `messageIndex` are yours to pick. Re-using one fails on
  chain with **"account ... already in use"** (Anchor custom error `0x0`). To make
  reposting safe, either pre-check with the matching `getX()` and skip when
  non-null, or catch that error and treat it as "already done." The SDK does
  **not** dedupe for you.
- **Content limits are bytes (UTF-8), validated client-side** (throws
  `ValidationError` before spending a transaction):

  | Field                        | Max | Field                 | Max |
  | ---------------------------- | --- | --------------------- | --- |
  | username                     | 16  | post content          | 500 |
  | display name                 | 24  | comment content       | 100 |
  | bio                          | 64  | message content       | 512 |
  | avatar/banner URL            | 128 | poll question         | 200 |
  | community name               | 32  | poll option           | 50  |
  | community description/avatar | 128 | community max members | 100 |

- **Enums/ranges:** `reactionType` 0–5 (`ReactionType.Like..Angry`); poll `choice`
  0-based (`0..numOptions-1`); poll `numOptions` 2–4; poll duration ≤ 30 days.
- **Read-only clients throw on writes.** No `PRIVATE_KEY` (or `readOnly: true`) →
  `walletPublicKey` and every write throw `WalletRequiredError`. Gate writes on
  `client.isReadOnly`.
- **`close_*` / `leave_*` / `unfollow` refund rent to `config.treasury`** — the SDK
  passes the global config PDA + your configured treasury; both are bound on-chain to
  `config.treasury`, so a stale/wrong treasury is rejected with `InvalidTreasury`
  (see version-drift section). Only the owner/creator may close their accounts.
- **`createPost` may cost a protocol fee.** `create_post` carries the same `config` +
  `treasury` accounts. When the DAO has enabled the fee (a config flag), each post also
  transfers a small flat fee (default 2× the base signature fee ≈ 10 000 lamports) from
  the payer to `config.treasury`, on top of network fee + rent. It is OFF until the DAO
  turns it on; the SDK needs no change either way. Tips/paid-unlocks are never charged.
- **Program-enforced rejections** you should expect and handle: liking your own
  post or double-liking; following yourself; voting twice; closing something you
  don't own.
- **Errors:** `ValidationError` (client-side limit/range), `WalletRequiredError`
  (write without signer), `ConfigError`, `RpcPoolExhaustedError` (all providers
  failed — usually transient, retry), and `ShadowSpaceError` base. On-chain
  failures surface as Anchor errors with a code and the offending account name —
  read the account name in the message; it tells you which PDA was wrong.

## Bundled IDL ↔ deployed program (currently in sync; handling future drift)

The SDK builds each instruction's account list from its **bundled** IDL
(`src/idl/shadowspace.json`, mirrored as a typed `src/idl/shadowspace.ts`). It must
match the deployed program or Anchor sends the wrong accounts in the wrong slots.

**As of the bundled IDL v0.5.0 the SDK is current** with the deployed program
(`5zokTL2f5VCTu7vH2aaAhqhjRytLBFdxVJ6osEPxrJsY`, a clean redeploy under a new id). Three
upgrades are absorbed and wired into every affected method:

- **Post / PostStats split.** A post's mutable counters moved off the `Post` body into a
  separate **`PostStats`** PDA (seeded `["post_stats", author, postId]`) holding `likes`,
  `commentCount`, `reactionCounts[6]`. `create_post`, `like_post`, `create_comment`,
  `react_to_post`, and the matching `close_*` all take an extra `postStats` account (the SDK
  threads `client.pdas.postStats(author, postId)` — always the **post author**, never the
  actor); `close_post` closes both accounts. Read counts via `getPostStats` / `allPostStats`.
- **Delegated signing (optional `agent_record`).** Every social instruction takes an
  OPTIONAL `agent_record`. The SDK always signs as the owner, so it passes `agentRecord: null`
  (Anchor encodes None as the program id). It does **not** yet expose `set_agent` / delegated
  signing — a future enhancement.
- **Protocol-fee switch (`config` + `treasury`).** `create_post` and every rent-returning
  close (`close_post/comment/reaction/profile/chat/message`, `unfollow_user`,
  `leave_community`, `close_community`) require a PDA-derived `config` account (`["config"]`)
  and a `treasury` bound on-chain to `config.treasury`. The SDK passes
  `config: client.pdas.config()` and `treasury: client.treasury` for you.

So posts / counts / closes / follows / chat build correctly today — **no known drift**. The
rest of this section is for the **next** program upgrade.

### Symptoms of future drift

- `3007 AccountOwnedByWrongProgram` naming an account the SDK "shouldn't" touch (e.g.
  the wallet landing in a slot like `agent_record`) → the bundled IDL is **missing** a
  newly-inserted account.
- `Reached maximum depth … Unresolved accounts: X` → the builder doesn't pass an account the
  IDL **has** and Anchor can't resolve by itself — classically a **self-referentially seeded**
  account (its seed reads its own stored field, e.g. chat's `user1_profile` / `sender_profile`
  seeded by `…profile.owner`). Pass it explicitly (`client.pdas.profile(owner)`); the SDK
  already does this for `createChat` / `sendMessage`.
- `InvalidTreasury (6015)` on a create/close → `client.treasury` ≠ on-chain
  `config.treasury` (the DAO rotated it). Fix `SOLANA_TREASURY_ADDRESS`; not an IDL bug.

### Detect it

Fetch the deployed IDL and diff the instruction's account list against the bundled
one:

```bash
PROGRAM_ID=$(node -p "require('./src/idl/shadowspace.json').address")  # the bundled IDL's id
anchor idl fetch "$PROGRAM_ID" --provider.cluster devnet > onchain-idl.json
# compare instructions[].accounts (names + order) vs src/idl/shadowspace.json
```

If account names/order differ, the SDK is out of sync.

### Fix A — maintainer (preferred): regenerate the bundled IDL, then rewire

1. **Regenerate the bundled IDL from a fresh `anchor build`** of the program repo:
   `npm run idl:regen -- /path/to/shadowspace-program` (= `scripts/regen-idl.mjs`). It copies
   `target/idl/shadowspace.json` (raw snake_case) into `src/idl/shadowspace.json`, and writes
   `src/idl/shadowspace.ts` = Anchor's camelCase `type Shadowspace` (`target/types`) +
   `const IDL` = the **raw snake IDL cast `as unknown as Shadowspace`**. Do **not** hand-camelCase
   the const — Anchor's type-gen and its runtime converter disagree on seed-path / error-name
   casing, so a camelCased const won't typecheck against the type; Anchor camelCases the snake IDL
   at runtime, so the raw value is the correct input to `new Program(IDL)`. (`DEFAULT_PROGRAM_ID`
   in `constants.ts` derives from `IDL.address`, so the id updates automatically.)
2. Add any new accounts to the affected client methods. The None marker for an absent optional
   account (the SDK signs as owner, so `agent_record` is always None) is `null`; `create_post`
   and the closes also take `config` + `treasury`, and the post instructions take `postStats`:

```ts
.accountsPartial({
  post,
  postStats: this.pdas.postStats(owner, postId), // ["post_stats", author, postId] — counts
  profile, author: owner,
  agentRecord: null,                  // optional account absent → None
  payer: owner,
  config: this.pdas.config(),         // ["config"] PDA — required by the program
  treasury: this.config.treasury,     // must equal config.treasury
  systemProgram: SystemProgram.programId,
})
```

3. `npm run typecheck && npm run build`. **Verify without spending SOL**: build with
   `.instruction()` instead of `.rpc()` and inspect `ix.keys` — an absent optional
   account's slot must be the **program id** (None), not your wallet.

(To support delegated posting later, expose `set_agent(agent)` — the owner registers
one `Agent` PDA seeded `["agent", profile.owner]`; the agent then signs with that
`agent_record` passed in instead of `null`.)

### Fix B — consumer (no SDK rebuild): build against the fetched IDL at the call site

If a published SDK lags and you can't wait for a release, reuse the client's
provider/pdas and build from the fetched on-chain IDL — pass the absent optional as
`null` and include `config` + `treasury`:

```ts
import { Program, web3 } from "@coral-xyz/anchor";
import { BN, EchoBlocksClient } from "@tetrac/echoblocks-ts-sdk";
import ONCHAIN_IDL from "./shadowspace.onchain.json"; // from `anchor idl fetch`

const client = EchoBlocksClient.fromEnv();
const program = new Program(ONCHAIN_IDL as any, client.program.provider);
const owner = client.walletPublicKey;

await program.methods
  .createPost(new BN(String(postId)), content, false)
  .accountsPartial({
    post: client.pdas.post(owner, postId),
    postStats: client.pdas.postStats(owner, postId), // counts PDA — required on create_post
    profile: client.pdas.profile(owner),
    author: owner,
    agentRecord: null, // None (optional account absent)
    payer: owner,
    config: client.pdas.config(),
    treasury: client.treasury,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc();
```

Verify the layout without spending SOL by calling `.instruction()` instead of `.rpc()`
and inspecting `ix.keys` — an absent optional account's slot must be the **program id**
(None), not your wallet.

## Advanced: build your own Program

`fromEnv()` exposes its plumbing as public readonly fields: `client.connection`,
`client.program` (typed `Program<Shadowspace>`, has `.provider`), `client.pdas`,
`client.pool`, `client.config`. Reuse `client.program.provider` to construct a
`new Program(idl, provider)` (as in Fix B) so you keep the failover connection,
wallet, and commitment without re-plumbing them. The SDK also re-exports `IDL`
and the `Shadowspace` type, and `buildProgram(connection, wallet, programId)`.
