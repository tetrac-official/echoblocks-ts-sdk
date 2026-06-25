// Public types. On-chain account shapes are derived directly from the IDL via
// Anchor's `IdlAccounts`, so they stay in sync with the program automatically.

import type { PublicKey, Commitment } from "@solana/web3.js";
import type { IdlAccounts } from "./anchor.js";
import type { Shadowspace } from "./idl/shadowspace.js";

type Accounts = IdlAccounts<Shadowspace>;

// Decoded on-chain account types (pubkeys → PublicKey, u64/i64 → BN, etc.).
export type ProfileAccount = Accounts["profile"];
export type PostAccount = Accounts["post"];
export type CommentAccount = Accounts["comment"];
export type ReactionAccount = Accounts["reaction"];
export type LikeRecordAccount = Accounts["likeRecord"];
export type ChatAccount = Accounts["chat"];
export type MessageAccount = Accounts["message"];
export type FollowAccount = Accounts["followAccount"];
export type CommunityAccount = Accounts["community"];
export type MembershipAccount = Accounts["membership"];
export type PollAccount = Accounts["poll"];
export type PollVoteAccount = Accounts["pollVote"];

/** A fetched account paired with its on-chain address. */
export interface WithAddress<T> {
  publicKey: PublicKey;
  account: T;
}

/** Result of any write (transaction-sending) method. */
export interface TxResult {
  /** Transaction signature. */
  signature: string;
}

/** A write result that also reports the PDAs the instruction created/touched. */
export interface TxResultWithAccounts extends TxResult {
  accounts: Record<string, PublicKey>;
}

/** Per-call send options forwarded to Anchor's `.rpc()`. */
export interface SendOptions {
  /** Skip preflight simulation. Default false. */
  skipPreflight?: boolean;
  /** Commitment for this transaction's confirmation. */
  commitment?: Commitment;
  /** Max preflight retries. */
  maxRetries?: number;
}
