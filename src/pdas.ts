// PDA derivation for every ShadowSpace account. Seeds match the program exactly
// (lib.rs `#[account(seeds = [...])]`). All u64 ids are encoded little-endian to
// 8 bytes, the same as Rust's `id.to_le_bytes()`.

import { PublicKey } from "@solana/web3.js";
import { BN } from "./anchor.js";
import { SEEDS } from "./constants.js";

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
}
