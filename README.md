<div align="center">

# @tetrac/echoblocks-ts-sdk

**Node.js / TypeScript SDK for the ShadowSpace Solana social program.**

Profiles · posts · likes · comments · reactions · follows · communities · polls · 1:1 chat — every on-chain instruction, with automatic PDA derivation and multi-provider RPC failover.

[![npm version](https://img.shields.io/npm/v/@tetrac/echoblocks-ts-sdk?color=cb3837&logo=npm&label=npm)](https://www.npmjs.com/package/@tetrac/echoblocks-ts-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@tetrac/echoblocks-ts-sdk?color=cb3837&logo=npm)](https://www.npmjs.com/package/@tetrac/echoblocks-ts-sdk)
[![bundle types](https://img.shields.io/npm/types/@tetrac/echoblocks-ts-sdk?logo=typescript&logoColor=white)](https://www.npmjs.com/package/@tetrac/echoblocks-ts-sdk)
[![node](https://img.shields.io/node/v/@tetrac/echoblocks-ts-sdk?logo=node.js&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/@tetrac/echoblocks-ts-sdk?color=blue)](./LICENSE)
[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF?logo=solana&logoColor=white)](https://solana.com)
[![built with Anchor](https://img.shields.io/badge/Anchor-0.32-512BD4)](https://www.anchor-lang.com/)

[**npm**](https://www.npmjs.com/package/@tetrac/echoblocks-ts-sdk) · [**GitHub**](https://github.com/tetrac-official/echoblocks-ts-sdk) · [Quick start](#quick-start) · [API](#api-overview) · [Configuration](#configuration)

</div>

---

## Overview

`@tetrac/echoblocks-ts-sdk` is a typed client for the **ShadowSpace** Solana program — a social app
(profiles, posts, likes, comments, reactions, follows, communities, polls, and 1:1 chat) deployed as an
[Anchor](https://www.anchor-lang.com/) program on **devnet** (`CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh`).

It exposes **every instruction** the program has, derives all PDAs for you, and routes RPC through a
**multi-provider failover pool** with a **mainnet/devnet switch** — all configured from a `.env` file.
No wallet is created: a single `PRIVATE_KEY` is all you need to sign and pay.

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [How RPC failover works](#how-rpc-failover-works)
- [Examples](#examples)
- [Testing](#testing)
- [Development](#development)
- [License](#license)

## Features

- **Full coverage** of the on-chain program: `post`, `like`, `comment`, `react`, `follow`/`unfollow`,
  `join`/`leave` communities, `poll`/`vote`, chat, profiles, and every `close`/delete (rent-refund) instruction.
- **Automatic PDA derivation** — you pass ids and addresses, the SDK derives the accounts (seeds match the
  program byte-for-byte).
- **RPC failover** — an ordered provider pool (`RPC_NODE_URL` → keyed providers → keyless public node) with a
  passive circuit breaker, upstream throttle, and genesis/slot freshness checks.
- **`IS_MAINNET` switch** — flips the cluster, the keyless fallback, and the expected genesis hash in one variable.
- **Env-driven program address** (`SOLANA_PDA_ADDRESS`) so you can repoint or upgrade without a code change.
- **Fully typed** — the Anchor IDL is bundled and gives you typed instruction builders and decoded account reads.
  Ships **ESM + CJS + `.d.ts`**.

## Installation

```bash
npm install @tetrac/echoblocks-ts-sdk
```

```bash
pnpm add @tetrac/echoblocks-ts-sdk
```

```bash
yarn add @tetrac/echoblocks-ts-sdk
```

> **Requirements:** Node.js **>= 18** (uses the global `fetch`). The runtime peers
> `@solana/web3.js` and `@coral-xyz/anchor` are bundled as dependencies — nothing else to install.

## Quick start

```ts
import { EchoBlocksClient } from "@tetrac/echoblocks-ts-sdk";

// Reads PRIVATE_KEY, IS_MAINNET, SOLANA_PDA_ADDRESS, RPC_* from the environment.
const client = EchoBlocksClient.fromEnv();

// One-time: create your on-chain profile.
await client.createProfile("satoshi", "Satoshi", "gm");

// Post (postId is any u64 unique per author).
const { signature, accounts } = await client.createPost({
  postId: Date.now(),
  content: "gm from the Node SDK 🚀",
});
console.log("posted:", signature, "→", accounts.post.toBase58());

// Like someone else's post (you pass the author + postId; PDAs are derived).
await client.likePost({ author: "<authorPubkey>", postId: 12345 });

// Comment.
await client.createComment({
  postAuthor: "<authorPubkey>",
  postId: 12345,
  commentIndex: 0,
  content: "🔥",
});

// Join a community.
await client.joinCommunity({ communityId: 1 });

// Delete one of your own posts (refunds rent to the treasury).
await client.deletePost({ postId: 12345 });
```

### Read without a wallet

```ts
const ro = EchoBlocksClient.fromEnv({ readOnly: true });

await ro.healthCheck(); // probe every RPC provider (reachability/cluster/slot)
await ro.getProfile("<pubkey>"); // decoded Profile | null
await ro.allPosts(); // every post on-chain
await ro.postsByAuthor("<pubkey>");
await ro.followers("<pubkey>");
```

## Configuration

Copy `.env.example` to `.env` and fill it in:

```bash
# Required: the signer wallet (base58 OR a JSON byte array — no wallet is created)
PRIVATE_KEY=your_base58_secret_key

# Cluster switch: false → devnet (default), true → mainnet-beta
IS_MAINNET=false

# Program address (env so you can upgrade/repoint without a code change)
SOLANA_PDA_ADDRESS=CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh

# RPC: a custom primary (optional) + failover providers (optional)
RPC_NODE_URL=
HELIUS_API_KEY=
# mainnet-only secondaries: FLUX_API_KEY, ALCHEMY_SOLANA_KEY, QUICKNODE_SOLANA_URL,
# SYNDICA_SOLANA_KEY, DRPC_SOLANA_URL
```

See [`.env.example`](./.env.example) for every variable and its default.

## API overview

`EchoBlocksClient.fromEnv(overrides?)` builds the client. Every override is optional and takes precedence over
the matching env var (`isMainnet`, `programId`, `treasury`, `commitment`, `rpcUrl`, `keypair`, `privateKey`,
`readOnly`, …).

### Writes (require a signer)

| Area        | Methods                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------- |
| Profile     | `createProfile`, `updateProfile`, `migrateProfile`, `closeProfile`                        |
| Posts       | `createPost`, `editPost`, `closePost` / `deletePost`, `likePost`                          |
| Comments    | `createComment`, `closeComment`                                                           |
| Reactions   | `reactToPost`, `closeReaction`                                                            |
| Follow      | `followUser`, `unfollowUser`                                                              |
| Communities | `createCommunity`, `joinCommunity`, `leaveCommunity`, `updateCommunity`, `closeCommunity` |
| Polls       | `createPoll`, `votePoll`, `closePoll`                                                     |
| Chat        | `createChat`, `sendMessage`, `closeChat`, `closeMessage`                                  |

Each write returns `{ signature, accounts }` where `accounts` maps the PDAs the instruction created/touched.
All write methods accept an optional final `SendOptions` (`skipPreflight`, `commitment`, `maxRetries`).
Field-length and range limits are validated client-side (against the program's `require!` checks) so bad input
fails before a transaction is sent.

### Reads

**Single** (return the decoded account or `null`):
`getProfile`, `getPost`, `getComment`, `getCommunity`, `getMembership`, `getPoll`, `getPollVote`, `getChat`,
`getMessage`, `getFollow`, `getLikeRecord`.

**Collections:**
`allProfiles`, `allPosts`, `postsByAuthor`, `commentsForPost`, `likesForPost`, `allCommunities`,
`membershipsOf`, `allPolls`, `following`, `followers`.

### Utilities & escape hatches

- `client.pdas` — a `Pdas` instance to derive any PDA yourself.
- `client.program` — the underlying typed `Program<Shadowspace>` (build raw instructions, compose transactions,
  add `program.account.*` filters).
- `client.connection` — the failover-backed `web3.js` `Connection`.
- `client.pool` — the `RpcPool` (`getActiveProviders`, `verifyAll`, …).
- `client.getBalance()`, `client.requestAirdrop()` (devnet), `client.healthCheck()`.

## How RPC failover works

**Just insert the API keys you have — the SDK selects the RPC provider for you.** You never choose a provider by
hand. `RpcPool` reads whichever keys are present in your env (gated by `IS_MAINNET`) and assembles an ordered
failover pool; add a key and that provider joins the pool, remove it and it drops out — no code change.

The order it builds:

1. `RPC_NODE_URL` (if set) — an explicit pinned primary, for your own node or a provider not covered below.
   **Optional** — leave it blank and the keyed providers drive the pool.
2. Cluster-keyed providers — `HELIUS_API_KEY` works on both clusters; FluxRPC / Alchemy / QuickNode / Syndica /
   dRPC are added on mainnet when their key/URL is present (ignored on devnet).
3. A keyless public node (`api.devnet.solana.com` or `solana-rpc.publicnode.com`), always appended as the last
   resort.

So for devnet, setting only `HELIUS_API_KEY` is enough: it becomes the primary (the SDK builds the
`…?api-key=…` URL for you) with the public devnet node as the automatic fallback. Duplicate URLs are de-duped,
and a keyed endpoint needs its key in the URL — which is why letting `HELIUS_API_KEY` build the URL beats
hand-writing a bare `RPC_NODE_URL` (a bare keyed URL answers `getHealth` but 401s real calls).

Every JSON-RPC call (including `sendTransaction`) goes through the pool. Responses are classified — `ok` /
`app_error` are returned to you; `provider_down` / `rate_limited` / `transient` trip a passive circuit breaker
and fail over to the next provider. `healthCheck()` additionally verifies each endpoint is on the expected
cluster (genesis hash) and not lagging.

## Examples

- [`examples/post.ts`](./examples/post.ts) — create profile → post → comment → read.
- [`examples/read.ts`](./examples/read.ts) — read-only RPC health + on-chain listing.

```bash
npm run example:read   # no PRIVATE_KEY needed
npm run example:post   # needs a funded devnet wallet in PRIVATE_KEY
```

## Testing

The suite under [`test/`](./test) runs with Node's built-in test runner (`node:test`) via `tsx` — no extra
dependencies.

```bash
npm run test:offline   # hermetic: config, PDA derivation, key parsing, validation (no network)
npm run test:live      # LIVE devnet: real transactions; needs a funded PRIVATE_KEY
npm test               # everything, serialized (offline + live)
```

The live tests transact against the **real devnet deployment** using your `.env.local` values. They cover every
instruction end to end and read each result back on-chain:

- **profile** — create (idempotent) → update → read back
- **post** — create → edit → comment → react → close (rent refunded to treasury)
- **community** — create → join → leave → update → close (full membership lifecycle)
- **poll** — create → vote → verify tally (`close_poll` is a soft close: it flips `is_closed` and does **not**
  refund rent)
- **chat** — create → send message → close
- **cross-user** — a second wallet (funded by a transfer from the primary, swept back afterward) likes a post,
  follows/unfollows, and votes; plus the on-chain self-action guards (`CannotLikeOwnPost`, `CannotFollowSelf`)

A full live run costs a fraction of a SOL and self-cleans (each lifecycle closes what it creates); only the
soft-closed polls leave reclaimable-by-nothing rent. If the secondary wallet can't be funded, the cross-user
cases skip rather than fail.

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # eslint + prettier --check
npm run build       # tsup → dist (ESM + CJS + d.ts)
```

The bundled IDL (`src/idl/shadowspace.ts` / `.json`) is fetched from the on-chain program with `anchor idl fetch`
and converted to camelCase to match the Anchor runtime namespaces. To update it after a program upgrade, re-fetch
and regenerate.

## License

[MIT](./LICENSE) © [Tetrac](https://github.com/tetrac-official)
