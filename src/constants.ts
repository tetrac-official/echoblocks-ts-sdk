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
