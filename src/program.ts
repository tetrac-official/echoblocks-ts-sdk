// Builds the typed Anchor `Program` for ShadowSpace. The program ID is taken from
// config (env `SOLANA_PDA_ADDRESS`) and stamped onto the IDL so PDA derivation and
// account resolution target the configured deployment.

import { AnchorProvider, Program, type Wallet as AnchorWallet } from "./anchor.js";
import { Connection, Keypair, PublicKey, type Commitment } from "@solana/web3.js";
import { IDL, type Shadowspace } from "./idl/shadowspace.js";
import { WalletRequiredError } from "./errors.js";

/** A no-op wallet for read-only clients — satisfies AnchorProvider, refuses to sign. */
export function createReadOnlyWallet(): AnchorWallet {
  const placeholder = Keypair.generate();
  const refuse = (): never => {
    throw new WalletRequiredError("signing transactions");
  };
  return {
    publicKey: placeholder.publicKey,
    signTransaction: refuse,
    signAllTransactions: refuse,
    payer: placeholder,
  } as AnchorWallet;
}

/**
 * Construct a typed `Program<Shadowspace>` bound to `connection`, `wallet`, and the
 * given `programId`. Pass a read-only wallet (see {@link createReadOnlyWallet}) for
 * fetch-only usage.
 */
export function buildProgram(
  connection: Connection,
  wallet: AnchorWallet,
  programId: PublicKey,
  commitment: Commitment = "confirmed",
): Program<Shadowspace> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment,
    preflightCommitment: commitment,
  });

  // Stamp the configured program ID onto a copy of the IDL (Anchor reads
  // `idl.address` to bind the program). Only the top-level address changes.
  const idl: Shadowspace = { ...IDL };
  (idl as { address: string }).address = programId.toBase58();

  return new Program<Shadowspace>(idl, provider);
}
