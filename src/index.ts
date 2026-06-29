// Public API surface for @tetrac/echoblocks-ts-sdk.

// Primary entry point.
export { EchoBlocksClient } from "./client.js";
export type {
  ClientComponents,
  FromEnvOptions,
  CreatePostInput,
  EditPostInput,
  LikePostInput,
  CreateCommentInput,
  CloseCommentInput,
  ReactToPostInput,
  CloseReactionInput,
  CreateCommunityInput,
  UpdateCommunityInput,
  SetCommunityGateInput,
  CreateCommunityPostInput,
  CreatePollInput,
  VotePollInput,
  CreateChatInput,
  SendMessageInput,
} from "./client.js";

// Configuration.
export {
  loadConfig,
  MAINNET_GENESIS,
  DEVNET_GENESIS,
  type ShadowSpaceConfig,
  type ConfigOverrides,
  type RpcConfig,
  type SolanaCluster,
} from "./config.js";

// Constants.
export {
  DEFAULT_PROGRAM_ID,
  DEFAULT_TREASURY,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SEEDS,
  LIMITS,
  ReactionType,
  COMMUNITY_POST_PREFIX,
  buildCommunityPostContent,
  parseCommunityPostContent,
} from "./constants.js";

// PDA helpers.
export { Pdas, u64ToLeBytes, toPublicKey, type U64Like } from "./pdas.js";

// Wallet.
export { KeypairWallet, loadKeypair, keypairFromSecret } from "./wallet.js";

// Program builder.
export { buildProgram, createReadOnlyWallet } from "./program.js";

// RPC layer (for advanced/standalone use).
export { RpcPool, classifyResponse } from "./rpc/endpoints.js";
export type { Verdict, RpcProvider, FailoverResult, EndpointHealth } from "./rpc/endpoints.js";
export { createFailoverConnection } from "./rpc/connection.js";
export { createThrottledFetch, type ThrottleOpts } from "./rpc/throttle.js";

// Errors.
export {
  ShadowSpaceError,
  ConfigError,
  ValidationError,
  WalletRequiredError,
  RpcPoolExhaustedError,
} from "./errors.js";

// Account / result types.
export type {
  ProfileAccount,
  PostAccount,
  CommentAccount,
  ReactionAccount,
  LikeRecordAccount,
  ChatAccount,
  MessageAccount,
  FollowAccount,
  CommunityAccount,
  MembershipAccount,
  PollAccount,
  PollVoteAccount,
  WithAddress,
  TxResult,
  TxResultWithAccounts,
  SendOptions,
} from "./types.js";

// IDL (typed) — for users who want to build their own Program instance.
export { IDL, type Shadowspace } from "./idl/shadowspace.js";

// Re-export commonly needed primitives so consumers don't need separate imports.
export { PublicKey, Keypair, Connection } from "@solana/web3.js";
export { BN } from "./anchor.js";
