// PDA derivation for every ShadowSpace account. Seeds match the program exactly
// (lib.rs `#[account(seeds = [...])]`). All u64 ids are encoded little-endian to
// 8 bytes, the same as Rust's `id.to_le_bytes()`.

import { PublicKey } from "@solana/web3.js";
import { BN } from "./anchor.js";
import { SEEDS, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "./constants.js";

/** A bigint-ish id accepted anywhere the program takes a `u64`. */
export type U64Like = number | bigint | BN | string;

/** Encode a u64 as an 8-byte little-endian Buffer (matches `to_le_bytes()`). */
export function u64ToLeBytes(value: U64Like): Buffer {
  const bn = value instanceof BN ? value : new BN(value.toString());
  if (bn.isNeg()) throw new RangeError(`u64 id cannot be negative: ${value}`);
  return bn.toArrayLike(Buffer, "le", 8);
}

/** Coerce a `PublicKey | string` into a `PublicKey`. */
export function toPublicKey(value: PublicKey | string): PublicKey {
  return value instanceof PublicKey ? value : new PublicKey(value);
}

/**
 * Derives every account PDA for a given program ID. The `[address, bump]` tuple
 * from `findProgramAddressSync` is split — methods return just the address since
 * the program re-derives the bump on-chain.
 */
export class Pdas {
  constructor(readonly programId: PublicKey) {}

  private derive(seeds: Array<Buffer | Uint8Array>): PublicKey {
    return PublicKey.findProgramAddressSync(seeds, this.programId)[0];
  }

  /** Same as the per-account helpers but also returns the bump. */
  deriveWithBump(seeds: Array<Buffer | Uint8Array>): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(seeds, this.programId);
  }

  profile(owner: PublicKey | string): PublicKey {
    return this.derive([SEEDS.PROFILE, toPublicKey(owner).toBuffer()]);
  }

  post(author: PublicKey | string, postId: U64Like): PublicKey {
    return this.derive([SEEDS.POST, toPublicKey(author).toBuffer(), u64ToLeBytes(postId)]);
  }

  /** PostStats PDA — same (author, postId) inputs as the post; holds the mutable counters
   * (likes / comment_count / reaction tallies) the Post body no longer carries. AUTHOR is always
   * the POST's author (never the liker/commenter/reactor). Required on `create_post`, the
   * like/comment/react instructions, and the matching `close_*` (which also closes this account). */
  postStats(author: PublicKey | string, postId: U64Like): PublicKey {
    return this.derive([SEEDS.POST_STATS, toPublicKey(author).toBuffer(), u64ToLeBytes(postId)]);
  }

  comment(post: PublicKey | string, commentIndex: U64Like): PublicKey {
    return this.derive([SEEDS.COMMENT, toPublicKey(post).toBuffer(), u64ToLeBytes(commentIndex)]);
  }

  reaction(post: PublicKey | string, reactorOwner: PublicKey | string): PublicKey {
    return this.derive([SEEDS.REACTION, toPublicKey(post).toBuffer(), toPublicKey(reactorOwner).toBuffer()]);
  }

  like(post: PublicKey | string, liker: PublicKey | string): PublicKey {
    return this.derive([SEEDS.LIKE, toPublicKey(post).toBuffer(), toPublicKey(liker).toBuffer()]);
  }

  chat(chatId: U64Like): PublicKey {
    return this.derive([SEEDS.CHAT, u64ToLeBytes(chatId)]);
  }

  message(chatId: U64Like, messageIndex: U64Like): PublicKey {
    return this.derive([SEEDS.MESSAGE, u64ToLeBytes(chatId), u64ToLeBytes(messageIndex)]);
  }

  follow(follower: PublicKey | string, following: PublicKey | string): PublicKey {
    return this.derive([SEEDS.FOLLOW, toPublicKey(follower).toBuffer(), toPublicKey(following).toBuffer()]);
  }

  community(communityId: U64Like): PublicKey {
    return this.derive([SEEDS.COMMUNITY, u64ToLeBytes(communityId)]);
  }

  membership(community: PublicKey | string, member: PublicKey | string): PublicKey {
    return this.derive([SEEDS.MEMBERSHIP, toPublicKey(community).toBuffer(), toPublicKey(member).toBuffer()]);
  }

  poll(creator: PublicKey | string, pollId: U64Like): PublicKey {
    return this.derive([SEEDS.POLL, toPublicKey(creator).toBuffer(), u64ToLeBytes(pollId)]);
  }

  pollVote(poll: PublicKey | string, voter: PublicKey | string): PublicKey {
    return this.derive([SEEDS.POLL_VOTE, toPublicKey(poll).toBuffer(), toPublicKey(voter).toBuffer()]);
  }

  /** Global protocol-fee config PDA (`["config"]`). One per program; holds the
   * treasury + fee switch. Required on `create_post` and every rent-returning close. */
  config(): PublicKey {
    return this.derive([SEEDS.CONFIG]);
  }

  /**
   * Associated Token Account address for `(owner, mint)` — the gate token account a
   * holder passes to `create_community_post` when a community is token-gated. Derived
   * exactly like `@solana/spl-token`'s `getAssociatedTokenAddressSync`
   * (`[owner, tokenProgram, mint]` under the ATA program). Defaults to the CLASSIC SPL
   * Token program, matching the program's Anchor `TokenAccount`; pass a different
   * `tokenProgram` only for a Token-2022 gate mint. NOTE: this is a pure address derivation
   * — it does NOT check the account exists or holds enough balance (the program does that).
   */
  associatedTokenAccount(
    mint: PublicKey | string,
    owner: PublicKey | string,
    tokenProgram: PublicKey = TOKEN_PROGRAM_ID,
  ): PublicKey {
    return PublicKey.findProgramAddressSync(
      [toPublicKey(owner).toBuffer(), tokenProgram.toBuffer(), toPublicKey(mint).toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )[0];
  }

  /** Username-uniqueness registry PDA. Seeded by the raw UTF-8 username bytes
   * (matches the program's `username.as_bytes()`), so it exists at most once per
   * handle. Pass the exact username string used in `createProfile`. */
  usernameRegistry(username: string): PublicKey {
    return this.derive([SEEDS.USERNAME, Buffer.from(username, "utf8")]);
  }

  /** Community-name-uniqueness registry PDA. Seeded by the raw UTF-8 name bytes
   * (matches the program's `name.as_bytes()`). Pass the exact name used in
   * `createCommunity`. */
  communityNameRegistry(name: string): PublicKey {
    return this.derive([SEEDS.COMMUNITY_NAME, Buffer.from(name, "utf8")]);
  }
}
