// Program-level constants — kept in lockstep with the on-chain program
// (programs/shadowspace/src/lib.rs). PDA seeds, the default program ID, and the
// treasury are the values the program derives/enforces; changing them here without
// changing the program will break account resolution.

import { PublicKey } from "@solana/web3.js";
import { IDL } from "./idl/shadowspace.js";

/**
 * Default ShadowSpace program ID — derived from the bundled IDL's `address` (the single source of
 * truth inside the SDK; kept in lockstep with the program by `anchor keys sync`), so the default id
 * can never drift from the IDL the SDK ships with. Overridable at runtime via the `SOLANA_PDA_ADDRESS`
 * env var (see config.ts) to repoint the SDK at a different deployment without a code change.
 */
export const DEFAULT_PROGRAM_ID = new PublicKey(IDL.address);

/**
 * Treasury wallet — the destination for all rent refunds on `close_*` / `leave_*`
 * / `unfollow_*` instructions. The program hard-codes this and rejects any other
 * address (`TREASURY_PUBKEY` in lib.rs). Overridable via `SOLANA_TREASURY_ADDRESS`
 * only if you forked the program with a different treasury.
 */
export const DEFAULT_TREASURY = new PublicKey("BYNtxb7zMereaMrmMcWCQx3G6Y1KZspnMJbiuqoh9MrF");

// ── SPL Token program ids (well-known) ───────────────────────────────────────
// Needed to derive a gate token account (ATA) for holders-only community posting.
// The program's `gate_token_account` is an Anchor `TokenAccount`, i.e. CLASSIC SPL
// Token (not Token-2022), so the ATA defaults to TOKEN_PROGRAM_ID below.
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

// ── PDA seeds (byte-for-byte matches the `*_SEED` consts in lib.rs) ───────────
export const SEEDS = {
  PROFILE: Buffer.from("profile"),
  POST: Buffer.from("post"),
  // Companion hot-stats account: holds a post's mutable counters (likes / comment_count /
  // reaction tallies) split out of the Post body. Seeded by the same (author, postId) as the post.
  POST_STATS: Buffer.from("post_stats"),
  CHAT: Buffer.from("chat"),
  MESSAGE: Buffer.from("message"),
  FOLLOW: Buffer.from("follow"),
  COMMENT: Buffer.from("comment"),
  REACTION: Buffer.from("reaction"),
  COMMUNITY: Buffer.from("community"),
  MEMBERSHIP: Buffer.from("membership"),
  POLL: Buffer.from("poll"),
  POLL_VOTE: Buffer.from("poll_vote"),
  LIKE: Buffer.from("like"),
  // Uniqueness registries — PDA seeded by the handle itself (enforces uniqueness).
  USERNAME: Buffer.from("username"),
  COMMUNITY_NAME: Buffer.from("community_name"),
  // Global protocol-fee config (single PDA, no per-user seed) — holds treasury + fee switch.
  CONFIG: Buffer.from("config"),
} as const;

// ── Community post content convention ────────────────────────────────────────
/**
 * On-chain, a community post is a normal `Post` whose `content` is prefixed so the
 * post is provably bound to the community feed it claims:
 *
 *     COMM|<communityId>|<body>
 *
 * `create_community_post` builds this exact string on-chain (and the frontend feed
 * parses it), so the SDK mirrors the convention here. The ASSEMBLED string is what
 * counts against the 500-byte `POST_CONTENT` limit — not the bare body.
 */
export const COMMUNITY_POST_PREFIX = "COMM";

/** Build the on-chain content string for a community post: `COMM|<id>|<body>`. */
export function buildCommunityPostContent(communityId: { toString(): string }, body: string): string {
  return `${COMMUNITY_POST_PREFIX}|${communityId.toString()}|${body}`;
}

/**
 * Split a fetched post's content back into `{ communityId, body }`, or return `null`
 * if it isn't a community post. `communityId` is a decimal string (compare against
 * `String(id)` / `new BN(id).toString()`). Only the first two `|` delimiters are
 * significant, so a body may itself contain `|`.
 */
export function parseCommunityPostContent(content: string): { communityId: string; body: string } | null {
  const prefix = `${COMMUNITY_POST_PREFIX}|`;
  if (!content.startsWith(prefix)) return null;
  const rest = content.slice(prefix.length);
  const sep = rest.indexOf("|");
  if (sep < 0) return null;
  const communityId = rest.slice(0, sep);
  if (!/^\d+$/.test(communityId)) return null;
  return { communityId, body: rest.slice(sep + 1) };
}

/**
 * Reaction types accepted by `react_to_post` (the program validates `0..=5`).
 * Labels are a convenience for callers; only the numeric value is stored on-chain.
 */
export enum ReactionType {
  Like = 0,
  Love = 1,
  Laugh = 2,
  Wow = 3,
  Sad = 4,
  Angry = 5,
}

/**
 * On-chain content limits (bytes), mirrored from lib.rs `require!` checks. The SDK
 * validates against these client-side so a too-long field fails fast instead of
 * wasting a transaction. Lengths are measured in UTF-8 bytes, like the program.
 */
export const LIMITS = {
  USERNAME: 16,
  DISPLAY_NAME: 24,
  BIO: 64,
  AVATAR_URL: 128,
  BANNER_URL: 128,
  POST_CONTENT: 500,
  COMMENT_CONTENT: 100,
  MESSAGE_CONTENT: 512,
  COMMUNITY_NAME: 32,
  COMMUNITY_DESCRIPTION: 128,
  COMMUNITY_AVATAR_URL: 128,
  POLL_QUESTION: 200,
  POLL_OPTION: 50,
  COMMUNITY_MAX_MEMBERS: 100,
  POLL_MAX_DURATION_SECONDS: 30 * 24 * 60 * 60,
} as const;
