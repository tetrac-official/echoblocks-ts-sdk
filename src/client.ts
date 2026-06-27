// EchoBlocksClient — the single entry point. Wraps the typed Anchor program with
// ergonomic methods for every on-chain instruction (post, like, comment, follow,
// communities, polls, chat) plus typed reads. PDAs are derived automatically; the
// signer from PRIVATE_KEY pays and signs every write.

import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL, type ConfirmOptions } from "@solana/web3.js";
import { BN, type Program } from "./anchor.js";
import { config as loadDotenv } from "dotenv";

import { loadConfig, type ConfigOverrides, type ShadowSpaceConfig } from "./config.js";
import { LIMITS, ReactionType } from "./constants.js";
import { ValidationError, WalletRequiredError } from "./errors.js";
import { RpcPool, type EndpointHealth } from "./rpc/endpoints.js";
import { createFailoverConnection } from "./rpc/connection.js";
import { buildProgram, createReadOnlyWallet } from "./program.js";
import { KeypairWallet, loadKeypair } from "./wallet.js";
import { Pdas, toPublicKey, type U64Like } from "./pdas.js";
import type { Shadowspace } from "./idl/shadowspace.js";
import type {
  ChatAccount,
  CommentAccount,
  CommunityAccount,
  FollowAccount,
  MembershipAccount,
  MessageAccount,
  PollAccount,
  PollVoteAccount,
  PostAccount,
  ProfileAccount,
  LikeRecordAccount,
  SendOptions,
  TxResultWithAccounts,
  WithAddress,
} from "./types.js";

type Address = PublicKey | string;

// ── Constructor / factory options ────────────────────────────────────────────
export interface ClientComponents {
  connection: Connection;
  program: Program<Shadowspace>;
  pdas: Pdas;
  pool: RpcPool;
  config: ShadowSpaceConfig;
  keypair: Keypair | null;
}

export interface FromEnvOptions extends ConfigOverrides {
  /** Provide the signer directly instead of reading PRIVATE_KEY. */
  keypair?: Keypair;
  /** Provide the signer as a base58 string / JSON byte array instead of env. */
  privateKey?: string;
  /** Build a read-only client (no signer); write methods will throw. */
  readOnly?: boolean;
  /** Load variables from a .env file before resolving config. Default true. */
  loadEnvFile?: boolean;
}

// ── Per-instruction input shapes ─────────────────────────────────────────────
export interface CreatePostInput {
  postId: U64Like;
  content: string;
  isPrivate?: boolean;
}
export interface EditPostInput {
  postId: U64Like;
  content: string;
}
export interface LikePostInput {
  /** Author of the post being liked (used to derive the post PDA). */
  author: Address;
  postId: U64Like;
}
export interface CreateCommentInput {
  postAuthor: Address;
  postId: U64Like;
  commentIndex: U64Like;
  content: string;
}
export interface CloseCommentInput {
  postAuthor: Address;
  postId: U64Like;
  commentIndex: U64Like;
}
export interface ReactToPostInput {
  postAuthor: Address;
  postId: U64Like;
  reactionType: ReactionType | number;
}
export interface CloseReactionInput {
  postAuthor: Address;
  postId: U64Like;
}
export interface CreateCommunityInput {
  communityId: U64Like;
  name: string;
  description?: string;
  avatarUrl?: string;
}
export interface UpdateCommunityInput {
  communityId: U64Like;
  description?: string;
  avatarUrl?: string;
}
export interface CreatePollInput {
  pollId: U64Like;
  question: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  numOptions: number;
  /** Unix timestamp (seconds) when the poll closes. */
  endsAt: U64Like;
}
export interface VotePollInput {
  pollCreator: Address;
  pollId: U64Like;
  /** 0-based option index (0..numOptions-1). */
  choice: number;
}
export interface CreateChatInput {
  chatId: U64Like;
  user2: Address;
}
export interface SendMessageInput {
  chatId: U64Like;
  messageIndex: U64Like;
  content: string;
}

export class EchoBlocksClient {
  readonly connection: Connection;
  readonly program: Program<Shadowspace>;
  readonly pdas: Pdas;
  readonly pool: RpcPool;
  readonly config: ShadowSpaceConfig;
  private readonly keypair: Keypair | null;

  constructor(components: ClientComponents) {
    this.connection = components.connection;
    this.program = components.program;
    this.pdas = components.pdas;
    this.pool = components.pool;
    this.config = components.config;
    this.keypair = components.keypair;
  }

  /**
   * Build a client from environment variables (and optional overrides). Reads
   * `PRIVATE_KEY`, `IS_MAINNET`, `SOLANA_PDA_ADDRESS`, `RPC_NODE_URL`, and the RPC
   * provider keys. If no signer is available it returns a read-only client.
   */
  static fromEnv(options: FromEnvOptions = {}): EchoBlocksClient {
    const { keypair, privateKey, readOnly, loadEnvFile = true, ...overrides } = options;
    if (loadEnvFile) loadDotenv();

    const config = loadConfig(overrides);

    let signer: Keypair | null = null;
    if (!readOnly) {
      if (keypair) signer = keypair;
      else if (privateKey) signer = loadKeypair(privateKey);
      else if (process.env.PRIVATE_KEY) signer = loadKeypair(process.env.PRIVATE_KEY);
    }

    const pool = new RpcPool(config.rpc);
    const connection = createFailoverConnection(pool, config.commitment);
    const wallet = signer ? new KeypairWallet(signer) : createReadOnlyWallet();
    const program = buildProgram(connection, wallet, config.programId, config.commitment);
    const pdas = new Pdas(config.programId);

    return new EchoBlocksClient({ connection, program, pdas, pool, config, keypair: signer });
  }

  // ── Identity / introspection ───────────────────────────────────────────────
  /** The signer's public key. Throws if the client is read-only. */
  get walletPublicKey(): PublicKey {
    if (!this.keypair) throw new WalletRequiredError("reading the wallet public key");
    return this.keypair.publicKey;
  }

  /** The signer's public key, or null for a read-only client. */
  get walletPublicKeyOrNull(): PublicKey | null {
    return this.keypair?.publicKey ?? null;
  }

  get programId(): PublicKey {
    return this.config.programId;
  }

  get treasury(): PublicKey {
    return this.config.treasury;
  }

  get cluster(): "mainnet" | "devnet" {
    return this.config.cluster;
  }

  get isReadOnly(): boolean {
    return this.keypair === null;
  }

  // ── internal helpers ────────────────────────────────────────────────────────
  private owner(): PublicKey {
    if (!this.keypair) throw new WalletRequiredError("sending a transaction");
    return this.keypair.publicKey;
  }

  private confirmOptions(opts?: SendOptions): ConfirmOptions {
    return {
      skipPreflight: opts?.skipPreflight ?? false,
      commitment: opts?.commitment ?? this.config.commitment,
      preflightCommitment: opts?.commitment ?? this.config.commitment,
      maxRetries: opts?.maxRetries,
    };
  }

  private bn(value: U64Like): BN {
    return value instanceof BN ? value : new BN(value.toString());
  }

  private checkLen(field: string, value: string, max: number): void {
    const bytes = Buffer.byteLength(value, "utf8");
    if (bytes > max) {
      throw new ValidationError(`${field} is ${bytes} bytes; max is ${max}.`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════════════════════════════════════════

  /** Create the caller's profile PDA. Required before posting/commenting/etc. */
  async createProfile(username: string, displayName = "", bio = "", opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    if (!username || Buffer.byteLength(username, "utf8") === 0) {
      throw new ValidationError("username is required.");
    }
    this.checkLen("username", username, LIMITS.USERNAME);
    this.checkLen("displayName", displayName, LIMITS.DISPLAY_NAME);
    this.checkLen("bio", bio, LIMITS.BIO);

    const profile = this.pdas.profile(owner);
    // Username-uniqueness registry — the program `init`s this PDA (seeded by the
    // username), so creating a profile with a taken handle fails on-chain.
    const usernameRegistry = this.pdas.usernameRegistry(username);
    const signature = await this.program.methods
      .createProfile(username, displayName, bio)
      .accountsPartial({ profile, usernameRegistry, user: owner, payer: owner, systemProgram: SystemProgram.programId })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { profile, usernameRegistry } };
  }

  /** Resize an existing profile to the current schema (after a program upgrade). */
  async migrateProfile(opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const profile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .migrateProfile()
      .accountsPartial({ profile, user: owner, systemProgram: SystemProgram.programId })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { profile } };
  }

  /** Update profile display fields. */
  async updateProfile(
    fields: { displayName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string },
    opts?: SendOptions,
  ): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const displayName = fields.displayName ?? "";
    const bio = fields.bio ?? "";
    const avatarUrl = fields.avatarUrl ?? "";
    const bannerUrl = fields.bannerUrl ?? "";
    this.checkLen("displayName", displayName, LIMITS.DISPLAY_NAME);
    this.checkLen("bio", bio, LIMITS.BIO);
    this.checkLen("avatarUrl", avatarUrl, LIMITS.AVATAR_URL);
    this.checkLen("bannerUrl", bannerUrl, LIMITS.BANNER_URL);

    const profile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .updateProfile(displayName, bio, avatarUrl, bannerUrl)
      .accountsPartial({ profile, user: owner, payer: owner, systemProgram: SystemProgram.programId })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { profile } };
  }

  /** Close the caller's profile and refund rent to the treasury. */
  async closeProfile(opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const profile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .closeProfile()
      .accountsPartial({ profile, user: owner, config: this.pdas.config(), treasury: this.config.treasury })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { profile } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POSTS
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a post. `postId` is a caller-chosen u64 unique per author. */
  async createPost(input: CreatePostInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    this.checkLen("content", input.content, LIMITS.POST_CONTENT);
    const profile = this.pdas.profile(owner);
    const post = this.pdas.post(owner, input.postId);
    const signature = await this.program.methods
      .createPost(this.bn(input.postId), input.content, input.isPrivate ?? false)
      .accountsPartial({
        post,
        profile,
        author: owner,
        agentRecord: null, // owner-signed (no agent delegation in the SDK) → None
        payer: owner,
        config: this.pdas.config(),
        treasury: this.config.treasury, // must equal config.treasury (protocol fee sink)
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { post, profile } };
  }

  /** Edit one of the caller's own posts. */
  async editPost(input: EditPostInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    this.checkLen("content", input.content, LIMITS.POST_CONTENT);
    const post = this.pdas.post(owner, input.postId);
    const signature = await this.program.methods
      .editPost(this.bn(input.postId), input.content)
      .accountsPartial({ post, author: owner, agentRecord: null })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { post } };
  }

  /** Delete one of the caller's own posts and refund rent to the treasury. */
  async closePost(input: { postId: U64Like }, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const post = this.pdas.post(owner, input.postId);
    const profile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .closePost(this.bn(input.postId))
      .accountsPartial({
        post,
        profile,
        user: owner,
        agentRecord: null,
        config: this.pdas.config(),
        treasury: this.config.treasury,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { post, profile } };
  }

  /** Convenience alias for {@link closePost}. */
  async deletePost(input: { postId: U64Like }, opts?: SendOptions): Promise<TxResultWithAccounts> {
    return this.closePost(input, opts);
  }

  /** Like another user's post. The program rejects liking your own post or double-liking. */
  async likePost(input: LikePostInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const author = toPublicKey(input.author);
    const post = this.pdas.post(author, input.postId);
    const profile = this.pdas.profile(owner);
    const likeRecord = this.pdas.like(post, owner);
    const signature = await this.program.methods
      .likePost(this.bn(input.postId))
      .accountsPartial({
        post,
        profile,
        likeRecord,
        user: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { post, profile, likeRecord } };
  }

  // ── COMMENTS ──
  /** Comment on a post. `commentIndex` is a caller-chosen u64 unique per post. */
  async createComment(input: CreateCommentInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    this.checkLen("content", input.content, LIMITS.COMMENT_CONTENT);
    const postAuthor = toPublicKey(input.postAuthor);
    const post = this.pdas.post(postAuthor, input.postId);
    const comment = this.pdas.comment(post, input.commentIndex);
    const commenterProfile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .createComment(this.bn(input.postId), this.bn(input.commentIndex), input.content)
      .accountsPartial({
        comment,
        post,
        commenterProfile,
        author: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { comment, post, commenterProfile } };
  }

  /** Close one of the caller's own comments and refund rent. */
  async closeComment(input: CloseCommentInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const postAuthor = toPublicKey(input.postAuthor);
    const post = this.pdas.post(postAuthor, input.postId);
    const comment = this.pdas.comment(post, input.commentIndex);
    const signature = await this.program.methods
      .closeComment(this.bn(input.postId), this.bn(input.commentIndex))
      .accountsPartial({
        comment,
        post,
        user: owner,
        agentRecord: null,
        config: this.pdas.config(),
        treasury: this.config.treasury,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { comment, post } };
  }

  // ── REACTIONS ──
  /** React to a post (one reaction PDA per user/post). `reactionType` is 0..5. */
  async reactToPost(input: ReactToPostInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const reactionType = Number(input.reactionType);
    if (!Number.isInteger(reactionType) || reactionType < 0 || reactionType > 5) {
      throw new ValidationError("reactionType must be an integer in 0..5.");
    }
    const postAuthor = toPublicKey(input.postAuthor);
    const post = this.pdas.post(postAuthor, input.postId);
    const reaction = this.pdas.reaction(post, owner);
    const reactorProfile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .reactToPost(this.bn(input.postId), reactionType)
      .accountsPartial({
        reaction,
        post,
        reactorProfile,
        user: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { reaction, post, reactorProfile } };
  }

  /** Close the caller's reaction on a post and refund rent. */
  async closeReaction(input: CloseReactionInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const postAuthor = toPublicKey(input.postAuthor);
    const post = this.pdas.post(postAuthor, input.postId);
    const reaction = this.pdas.reaction(post, owner);
    const signature = await this.program.methods
      .closeReaction(this.bn(input.postId))
      .accountsPartial({
        reaction,
        post,
        user: owner,
        agentRecord: null,
        config: this.pdas.config(),
        treasury: this.config.treasury,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { reaction, post } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMMUNITIES
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a community (the caller auto-joins as the first member). */
  async createCommunity(input: CreateCommunityInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const description = input.description ?? "";
    const avatarUrl = input.avatarUrl ?? "";
    this.checkLen("name", input.name, LIMITS.COMMUNITY_NAME);
    this.checkLen("description", description, LIMITS.COMMUNITY_DESCRIPTION);
    this.checkLen("avatarUrl", avatarUrl, LIMITS.COMMUNITY_AVATAR_URL);

    const community = this.pdas.community(input.communityId);
    const creatorProfile = this.pdas.profile(owner);
    // Community-name-uniqueness registry — the program `init`s this PDA (seeded by
    // the name), so a second community with the same name fails on-chain.
    const nameRegistry = this.pdas.communityNameRegistry(input.name);
    const signature = await this.program.methods
      .createCommunity(this.bn(input.communityId), input.name, description, avatarUrl)
      .accountsPartial({
        community,
        nameRegistry,
        creatorProfile,
        user: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { community, creatorProfile, nameRegistry } };
  }

  /** Join a community (creates the caller's membership PDA). */
  async joinCommunity(input: { communityId: U64Like }, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const community = this.pdas.community(input.communityId);
    const memberProfile = this.pdas.profile(owner);
    const membership = this.pdas.membership(community, owner);
    const signature = await this.program.methods
      .joinCommunity(this.bn(input.communityId))
      .accountsPartial({
        membership,
        community,
        memberProfile,
        user: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { membership, community, memberProfile } };
  }

  /** Leave a community (closes the membership PDA, refunds rent). */
  async leaveCommunity(input: { communityId: U64Like }, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const community = this.pdas.community(input.communityId);
    const memberProfile = this.pdas.profile(owner);
    const membership = this.pdas.membership(community, owner);
    const signature = await this.program.methods
      .leaveCommunity(this.bn(input.communityId))
      .accountsPartial({
        membership,
        community,
        memberProfile,
        user: owner,
        agentRecord: null,
        config: this.pdas.config(),
        treasury: this.config.treasury,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { membership, community, memberProfile } };
  }

  /** Update a community's description/avatar (creator only). */
  async updateCommunity(input: UpdateCommunityInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const description = input.description ?? "";
    const avatarUrl = input.avatarUrl ?? "";
    this.checkLen("description", description, LIMITS.COMMUNITY_DESCRIPTION);
    this.checkLen("avatarUrl", avatarUrl, LIMITS.COMMUNITY_AVATAR_URL);
    const community = this.pdas.community(input.communityId);
    const signature = await this.program.methods
      .updateCommunity(this.bn(input.communityId), description, avatarUrl)
      .accountsPartial({ community, user: owner, agentRecord: null })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { community } };
  }

  /** Close a community (creator only), refunding rent to the treasury. */
  async closeCommunity(input: { communityId: U64Like }, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const community = this.pdas.community(input.communityId);
    const signature = await this.program.methods
      .closeCommunity(this.bn(input.communityId))
      .accountsPartial({
        community,
        user: owner,
        agentRecord: null,
        config: this.pdas.config(),
        treasury: this.config.treasury,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { community } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POLLS
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a poll with 2-4 options ending at a future unix timestamp. */
  async createPoll(input: CreatePollInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const optionA = input.optionA;
    const optionB = input.optionB;
    const optionC = input.optionC ?? "";
    const optionD = input.optionD ?? "";
    if (!Number.isInteger(input.numOptions) || input.numOptions < 2 || input.numOptions > 4) {
      throw new ValidationError("numOptions must be an integer in 2..4.");
    }
    this.checkLen("question", input.question, LIMITS.POLL_QUESTION);
    this.checkLen("optionA", optionA, LIMITS.POLL_OPTION);
    this.checkLen("optionB", optionB, LIMITS.POLL_OPTION);
    this.checkLen("optionC", optionC, LIMITS.POLL_OPTION);
    this.checkLen("optionD", optionD, LIMITS.POLL_OPTION);

    const poll = this.pdas.poll(owner, input.pollId);
    const profile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .createPoll(
        this.bn(input.pollId),
        input.question,
        optionA,
        optionB,
        optionC,
        optionD,
        input.numOptions,
        this.bn(input.endsAt),
      )
      .accountsPartial({
        poll,
        profile,
        user: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { poll, profile } };
  }

  /** Cast a vote on a poll (one vote PDA per voter/poll). `choice` is 0-based. */
  async votePoll(input: VotePollInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    if (!Number.isInteger(input.choice) || input.choice < 0 || input.choice > 3) {
      throw new ValidationError("choice must be an integer in 0..3.");
    }
    const pollCreator = toPublicKey(input.pollCreator);
    const poll = this.pdas.poll(pollCreator, input.pollId);
    const pollVote = this.pdas.pollVote(poll, owner);
    const voterProfile = this.pdas.profile(owner);
    const signature = await this.program.methods
      .votePoll(this.bn(input.pollId), input.choice)
      .accountsPartial({
        poll,
        pollVote,
        voterProfile,
        user: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { poll, pollVote, voterProfile } };
  }

  /** Close one of the caller's own polls. */
  async closePoll(input: { pollId: U64Like }, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const poll = this.pdas.poll(owner, input.pollId);
    const signature = await this.program.methods
      .closePoll(this.bn(input.pollId))
      .accountsPartial({ poll, user: owner, agentRecord: null })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { poll } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOLLOW
  // ══════════════════════════════════════════════════════════════════════════

  /** Follow another user (both profiles must exist). */
  async followUser(target: Address, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const following = toPublicKey(target);
    const followerProfile = this.pdas.profile(owner);
    const followingProfile = this.pdas.profile(following);
    const followAccount = this.pdas.follow(owner, following);
    const signature = await this.program.methods
      .followUser()
      .accountsPartial({
        followAccount,
        followerProfile,
        followingProfile,
        user: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { followAccount, followerProfile, followingProfile } };
  }

  /** Unfollow a user (closes the follow PDA, refunds rent). */
  async unfollowUser(target: Address, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const following = toPublicKey(target);
    const followerProfile = this.pdas.profile(owner);
    const followingProfile = this.pdas.profile(following);
    const followAccount = this.pdas.follow(owner, following);
    const signature = await this.program.methods
      .unfollowUser()
      .accountsPartial({
        followAccount,
        followerProfile,
        followingProfile,
        user: owner,
        agentRecord: null,
        config: this.pdas.config(),
        treasury: this.config.treasury,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { followAccount, followerProfile, followingProfile } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CHAT (legacy)
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a 1:1 chat between the caller and `user2`. */
  async createChat(input: CreateChatInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const user2 = toPublicKey(input.user2);
    const chat = this.pdas.chat(input.chatId);
    const signature = await this.program.methods
      .createChat(this.bn(input.chatId))
      .accountsPartial({
        chat,
        user1: owner,
        user2,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { chat } };
  }

  /** Send a message in a chat (content is stored verbatim; encrypt client-side). */
  async sendMessage(input: SendMessageInput, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    this.checkLen("content", input.content, LIMITS.MESSAGE_CONTENT);
    const message = this.pdas.message(input.chatId, input.messageIndex);
    const chat = this.pdas.chat(input.chatId);
    const signature = await this.program.methods
      .sendMessage(this.bn(input.chatId), this.bn(input.messageIndex), input.content)
      .accountsPartial({
        message,
        chat,
        sender: owner,
        agentRecord: null,
        payer: owner,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { message, chat } };
  }

  /** Close a chat the caller participates in, refunding rent. */
  async closeChat(input: { chatId: U64Like }, opts?: SendOptions): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const chat = this.pdas.chat(input.chatId);
    const signature = await this.program.methods
      .closeChat(this.bn(input.chatId))
      .accountsPartial({ chat, user: owner, config: this.pdas.config(), treasury: this.config.treasury })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { chat } };
  }

  /** Close a message the caller sent, refunding rent. */
  async closeMessage(
    input: { chatId: U64Like; messageIndex: U64Like },
    opts?: SendOptions,
  ): Promise<TxResultWithAccounts> {
    const owner = this.owner();
    const message = this.pdas.message(input.chatId, input.messageIndex);
    const signature = await this.program.methods
      .closeMessage(this.bn(input.chatId), this.bn(input.messageIndex))
      .accountsPartial({ message, user: owner, config: this.pdas.config(), treasury: this.config.treasury })
      .rpc(this.confirmOptions(opts));
    return { signature, accounts: { message } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // READS
  // ══════════════════════════════════════════════════════════════════════════

  /** Fetch a profile by owner. Returns null if it doesn't exist. */
  async getProfile(owner: Address): Promise<ProfileAccount | null> {
    return this.program.account.profile.fetchNullable(this.pdas.profile(owner));
  }

  /** Fetch a post by (author, postId). Returns null if it doesn't exist. */
  async getPost(author: Address, postId: U64Like): Promise<PostAccount | null> {
    return this.program.account.post.fetchNullable(this.pdas.post(author, postId));
  }

  /** Fetch a comment by (postAuthor, postId, commentIndex). */
  async getComment(postAuthor: Address, postId: U64Like, commentIndex: U64Like): Promise<CommentAccount | null> {
    const post = this.pdas.post(postAuthor, postId);
    return this.program.account.comment.fetchNullable(this.pdas.comment(post, commentIndex));
  }

  /** Fetch a community by id. */
  async getCommunity(communityId: U64Like): Promise<CommunityAccount | null> {
    return this.program.account.community.fetchNullable(this.pdas.community(communityId));
  }

  /** Fetch a membership for (communityId, member). */
  async getMembership(communityId: U64Like, member: Address): Promise<MembershipAccount | null> {
    const community = this.pdas.community(communityId);
    return this.program.account.membership.fetchNullable(this.pdas.membership(community, member));
  }

  /** Fetch a poll by (creator, pollId). */
  async getPoll(creator: Address, pollId: U64Like): Promise<PollAccount | null> {
    return this.program.account.poll.fetchNullable(this.pdas.poll(creator, pollId));
  }

  /** Fetch a poll vote for (pollCreator, pollId, voter). */
  async getPollVote(pollCreator: Address, pollId: U64Like, voter: Address): Promise<PollVoteAccount | null> {
    const poll = this.pdas.poll(pollCreator, pollId);
    return this.program.account.pollVote.fetchNullable(this.pdas.pollVote(poll, voter));
  }

  /** Fetch a chat by id. */
  async getChat(chatId: U64Like): Promise<ChatAccount | null> {
    return this.program.account.chat.fetchNullable(this.pdas.chat(chatId));
  }

  /** Fetch a message by (chatId, messageIndex). */
  async getMessage(chatId: U64Like, messageIndex: U64Like): Promise<MessageAccount | null> {
    return this.program.account.message.fetchNullable(this.pdas.message(chatId, messageIndex));
  }

  /** Fetch a follow record for (follower, following). */
  async getFollow(follower: Address, following: Address): Promise<FollowAccount | null> {
    return this.program.account.followAccount.fetchNullable(this.pdas.follow(follower, following));
  }

  /** Fetch a like record for (postAuthor, postId, liker). */
  async getLikeRecord(postAuthor: Address, postId: U64Like, liker: Address): Promise<LikeRecordAccount | null> {
    const post = this.pdas.post(postAuthor, postId);
    return this.program.account.likeRecord.fetchNullable(this.pdas.like(post, liker));
  }

  // ── Collection reads (getProgramAccounts; can be heavy on public RPCs) ──
  /** All profiles. */
  async allProfiles(): Promise<WithAddress<ProfileAccount>[]> {
    return this.program.account.profile.all();
  }

  /** All posts. */
  async allPosts(): Promise<WithAddress<PostAccount>[]> {
    return this.program.account.post.all();
  }

  /** Posts authored by a given wallet (memcmp on the `author` field). */
  async postsByAuthor(author: Address): Promise<WithAddress<PostAccount>[]> {
    return this.program.account.post.all([{ memcmp: { offset: 8, bytes: toPublicKey(author).toBase58() } }]);
  }

  /** Comments on a given post (memcmp on the `post` field). */
  async commentsForPost(postAuthor: Address, postId: U64Like): Promise<WithAddress<CommentAccount>[]> {
    const post = this.pdas.post(postAuthor, postId);
    return this.program.account.comment.all([{ memcmp: { offset: 8, bytes: post.toBase58() } }]);
  }

  /** Like records for a given post (memcmp on the `post` field). */
  async likesForPost(postAuthor: Address, postId: U64Like): Promise<WithAddress<LikeRecordAccount>[]> {
    const post = this.pdas.post(postAuthor, postId);
    return this.program.account.likeRecord.all([{ memcmp: { offset: 8, bytes: post.toBase58() } }]);
  }

  /** All communities. */
  async allCommunities(): Promise<WithAddress<CommunityAccount>[]> {
    return this.program.account.community.all();
  }

  /** Communities a user has joined (memcmp on the membership `member` field). */
  async membershipsOf(member: Address): Promise<WithAddress<MembershipAccount>[]> {
    return this.program.account.membership.all([{ memcmp: { offset: 8 + 32, bytes: toPublicKey(member).toBase58() } }]);
  }

  /** All polls. */
  async allPolls(): Promise<WithAddress<PollAccount>[]> {
    return this.program.account.poll.all();
  }

  /** Accounts a user follows (memcmp on the `follower` field). */
  async following(user: Address): Promise<WithAddress<FollowAccount>[]> {
    return this.program.account.followAccount.all([{ memcmp: { offset: 8, bytes: toPublicKey(user).toBase58() } }]);
  }

  /** Accounts that follow a user (memcmp on the `following` field). */
  async followers(user: Address): Promise<WithAddress<FollowAccount>[]> {
    return this.program.account.followAccount.all([
      { memcmp: { offset: 8 + 32, bytes: toPublicKey(user).toBase58() } },
    ]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════════════════════════════════════════

  /** SOL balance (in SOL) of an address, or the signer if omitted. */
  async getBalance(address?: Address): Promise<number> {
    const pk = address ? toPublicKey(address) : this.walletPublicKey;
    const lamports = await this.connection.getBalance(pk);
    return lamports / LAMPORTS_PER_SOL;
  }

  /** Request a devnet airdrop (SOL) to the signer (or `address`). Devnet only. */
  async requestAirdrop(sol = 1, address?: Address): Promise<string> {
    if (this.config.isMainnet) throw new ValidationError("Airdrops are not available on mainnet.");
    const pk = address ? toPublicKey(address) : this.walletPublicKey;
    return this.connection.requestAirdrop(pk, Math.floor(sol * LAMPORTS_PER_SOL));
  }

  /** Probe every RPC provider in the pool (reachability, cluster, slot). */
  async healthCheck(): Promise<EndpointHealth[]> {
    return this.pool.verifyAll();
  }
}
