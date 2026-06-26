---
name: echo-blocks-client
description: >
  Correct usage of @tetrac/echoblocks-ts-sdk — the Node/TypeScript client for the
  ShadowSpace Solana social program (profiles, posts, likes, comments, reactions,
  follows, communities, polls, 1:1 chat) on devnet/mainnet. Use when writing,
  reviewing, or debugging code that imports EchoBlocksClient: configuring
  fromEnv / PRIVATE_KEY / RPC failover, creating a profile and posting, deriving
  PDAs, reading on-chain accounts, handling content limits and caller-chosen ids,
  or diagnosing failures like AnchorError 3007 "AccountOwnedByWrongProgram",
  "account ... already in use", WalletRequiredError, or any mismatch between the
  bundled IDL and the deployed program (the `agent_record` / `set_agent` drift).
---

# EchoBlocksClient (@tetrac/echoblocks-ts-sdk)

A typed client for the **ShadowSpace** Anchor program on Solana
(`CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh`, devnet by default). It exposes
every on-chain instruction, derives all PDAs for you, and routes RPC through a
multi-provider failover pool. One `PRIVATE_KEY` signs **and** pays for everything —
no separate wallet account is created.

- Runtime: Node **>= 18** (uses global `fetch`). Ships ESM + CJS + `.d.ts`.
- Bundled deps: `@solana/web3.js`, `@coral-xyz/anchor` (re-exported — import
  `PublicKey`, `Keypair`, `Connection`, `BN` straight from the SDK).

## Golden path

```ts
import { EchoBlocksClient } from "@tetrac/echoblocks-ts-sdk";

const client = EchoBlocksClient.fromEnv();           // reads .env (see vars below)
const me = client.walletPublicKey;                   // throws if read-only

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

| Var | Required | Meaning |
|---|---|---|
| `PRIVATE_KEY` | to write | Signer/payer. base58, hex (64/128 chars, `0x` optional), or JSON byte array `[1,2,...]`. Absent → **read-only client**. |
| `IS_MAINNET` | no | `false` → devnet (default), `true` → mainnet-beta. Flips cluster, keyless fallback, expected genesis. |
| `SOLANA_PDA_ADDRESS` | no | Program ID. Defaults to the devnet deployment. Set this to repoint without a code change. |
| `SOLANA_TREASURY_ADDRESS` | no | Rent-refund destination. Hard-coded in the program; only change if you forked it. |
| `SOLANA_COMMITMENT` | no | `processed` \| `confirmed` (default) \| `finalized`. |
| `RPC_NODE_URL` | no | Pin one explicit primary endpoint (include auth in the URL). |
| `HELIUS_API_KEY` | no | Works on both clusters; becomes the pool primary. |
| `FLUX_API_KEY`, `ALCHEMY_SOLANA_KEY`, `QUICKNODE_SOLANA_URL`, `SYNDICA_SOLANA_KEY`, `DRPC_SOLANA_URL` | no | Mainnet-only secondaries; ignored on devnet. |

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
`likePost({ author, postId })`.

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

**Reads (single, → `T | null`):** `getProfile`, `getPost`, `getComment`,
`getCommunity`, `getMembership`, `getPoll`, `getPollVote`, `getChat`, `getMessage`,
`getFollow`, `getLikeRecord`.

**Reads (collections, heavy `getProgramAccounts` — avoid on public RPC):**
`allProfiles`, `allPosts`, `postsByAuthor(author)`, `commentsForPost`,
`likesForPost`, `allCommunities`, `membershipsOf(member)`, `allPolls`,
`following(user)`, `followers(user)`.

**Utilities:** `getBalance(address?)` (SOL) · `requestAirdrop(sol?, address?)`
(devnet only) · `healthCheck()` (probe the RPC pool).

`Address` args accept a `PublicKey` or base58 string. `U64Like` ids accept
`number | string | BN`. Need a PDA yourself? Use `client.pdas` (`profile(owner)`,
`post(author, postId)`, `comment`, `reaction`, `like`, `follow`, `community`,
`membership`, `poll`, `pollVote`, `chat`, `message`, `usernameRegistry`,
`communityNameRegistry`).

## Correctness rules — read before you write

- **Profile first.** Posting/commenting/reacting/voting/joining all require the
  caller's profile PDA to exist. Call `getProfile(me)` and `createProfile(...)`
  once up front. Username is unique on-chain (a registry PDA) — a taken handle
  fails the transaction.
- **Caller-chosen ids must be unique per scope, and they make ops idempotent.**
  `postId` (per author), `commentIndex` (per post), `pollId` (per creator),
  `communityId`, `chatId`, `messageIndex` are yours to pick. Re-using one fails on
  chain with **"account ... already in use"** (Anchor custom error `0x0`). To make
  reposting safe, either pre-check with the matching `getX()` and skip when
  non-null, or catch that error and treat it as "already done." The SDK does
  **not** dedupe for you.
- **Content limits are bytes (UTF-8), validated client-side** (throws
  `ValidationError` before spending a transaction):

  | Field | Max | Field | Max |
  |---|---|---|---|
  | username | 16 | post content | 500 |
  | display name | 24 | comment content | 100 |
  | bio | 64 | message content | 512 |
  | avatar/banner URL | 128 | poll question | 200 |
  | community name | 32 | poll option | 50 |
  | community description/avatar | 128 | community max members | 100 |

- **Enums/ranges:** `reactionType` 0–5 (`ReactionType.Like..Angry`); poll `choice`
  0-based (`0..numOptions-1`); poll `numOptions` 2–4; poll duration ≤ 30 days.
- **Read-only clients throw on writes.** No `PRIVATE_KEY` (or `readOnly: true`) →
  `walletPublicKey` and every write throw `WalletRequiredError`. Gate writes on
  `client.isReadOnly`.
- **`close_*` / `leave_*` / `unfollow` refund rent to the treasury** — you must pass
  (the SDK passes) the program's hard-coded treasury; any other address is
  rejected. Only the owner/creator may close their accounts.
- **Program-enforced rejections** you should expect and handle: liking your own
  post or double-liking; following yourself; voting twice; closing something you
  don't own.
- **Errors:** `ValidationError` (client-side limit/range), `WalletRequiredError`
  (write without signer), `ConfigError`, `RpcPoolExhaustedError` (all providers
  failed — usually transient, retry), and `ShadowSpaceError` base. On-chain
  failures surface as Anchor errors with a code and the offending account name —
  read the account name in the message; it tells you which PDA was wrong.

## ⚠️ The bundled IDL can lag the deployed program (version drift)

This is the most important non-obvious failure mode. The SDK derives the account
list for each instruction from its **bundled** IDL (`src/idl/shadowspace.json`).
If the on-chain program has been **upgraded** since the SDK was published, the
bundled account layout can be stale, and Anchor will send the wrong accounts in
the wrong slots.

**Known live drift (SDK 0.2.0):** the deployed program added delegated posting —
new instructions `set_agent` / `revoke_agent` and an **optional `agent_record`
account inserted into `create_post`** (between `author` and `payer`). The bundled
IDL predates this, so `createPost` sends one account too few. The program then
reads the signer wallet into the `agent_record` slot and aborts:

```
AnchorError caused by account: agent_record.
Error Code: AccountOwnedByWrongProgram. Error Number: 3007.
Left: 11111111111111111111111111111111   (System Program — the wallet's owner)
Right: CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh   (expected: ShadowSpace)
```

Any `3007 AccountOwnedByWrongProgram` naming an account that the SDK "shouldn't"
be touching is this class of bug: **the bundled IDL is behind the chain.**

### Detect it

Fetch the deployed IDL and diff the instruction's account list against the bundled
one:

```bash
anchor idl fetch CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh \
  --provider.cluster devnet > onchain-idl.json
# compare instructions[].accounts (names + order) vs src/idl/shadowspace.json
```

If account names/order differ, the SDK is out of sync.

### Fix A — maintainer (preferred): regenerate the bundled IDL

Replace `src/idl/shadowspace.json` (and the typed `src/idl/shadowspace.ts`) with
the freshly fetched on-chain IDL, then add the new accounts to the affected client
methods and rebuild. For `create_post`, the owner posts with no delegate, so
`agent_record` is passed as **None** (Anchor encodes None as the program id):

```ts
.accountsPartial({ post, profile, author: owner,
  agentRecord: this.program.programId,   // None marker
  payer: owner, systemProgram: SystemProgram.programId })
```

(To support delegated posting, expose `set_agent(agent)` — the profile owner
registers one `AgentRecord` PDA seeded `["agent", profile.owner]`; the agent then
signs `create_post` with that `agent_record` passed in.)

### Fix B — consumer (no SDK rebuild): post against the on-chain IDL at the call site

Reuse the client's already-configured provider/pdas and build the instruction from
the fetched IDL, passing `agent_record` as None. Single wallet, no env change:

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
    profile: client.pdas.profile(owner),
    author: owner,
    agentRecord: program.programId,              // None (optional account absent)
    payer: owner,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc();
```

Verify the layout without spending SOL by calling `.instruction()` instead of
`.rpc()` and inspecting `ix.keys` — the `agent_record` slot must be the **program
id** (None), not your wallet.

## Advanced: build your own Program

`fromEnv()` exposes its plumbing as public readonly fields: `client.connection`,
`client.program` (typed `Program<Shadowspace>`, has `.provider`), `client.pdas`,
`client.pool`, `client.config`. Reuse `client.program.provider` to construct a
`new Program(idl, provider)` (as in Fix B) so you keep the failover connection,
wallet, and commitment without re-plumbing them. The SDK also re-exports `IDL`
and the `Shadowspace` type, and `buildProgram(connection, wallet, programId)`.
