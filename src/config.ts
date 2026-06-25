// Configuration resolver — the single place env vars are read and validated.
//
// Everything downstream (RPC pool, program builder, client) takes a fully-resolved
// config object instead of reaching into `process.env`, which keeps those modules
// pure/testable and makes the precedence rules explicit here.

import { PublicKey, type Commitment } from "@solana/web3.js";
import { DEFAULT_PROGRAM_ID, DEFAULT_TREASURY } from "./constants.js";
import { ConfigError } from "./errors.js";

// ── Cluster fingerprints (genesis hashes) — used to detect the "200 OK but wrong
//    cluster / stale node" silent failure in the RPC freshness check. ──
export const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
export const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

const DEFAULT_MAINNET_FALLBACK = "https://solana-rpc.publicnode.com";
const DEFAULT_DEVNET_FALLBACK = "https://api.devnet.solana.com";

export type SolanaCluster = "mainnet" | "devnet";

/** Resolved RPC pool configuration (consumed by the failover endpoints module). */
export interface RpcConfig {
  isMainnet: boolean;
  /** Explicit primary RPC (`RPC_NODE_URL`). Tried first when set. */
  customUrl?: string;
  heliusApiKey?: string;
  fluxApiKey?: string;
  alchemyKey?: string;
  quicknodeUrl?: string;
  syndicaKey?: string;
  drpcUrl?: string;
  /** Keyless last-resort RPC for the active cluster. */
  publicFallbackUrl: string;
  expectedGenesis: string;
  timeoutMs: number;
  breakerThreshold: number;
  breakerCooldownMs: number;
  upstreamRps: number;
  upstreamConcurrency: number;
  slotLagThreshold: number;
}

/** Fully-resolved SDK configuration. */
export interface ShadowSpaceConfig {
  isMainnet: boolean;
  cluster: SolanaCluster;
  programId: PublicKey;
  treasury: PublicKey;
  commitment: Commitment;
  rpc: RpcConfig;
}

/** Per-field overrides accepted by `loadConfig` (take precedence over env). */
export interface ConfigOverrides {
  isMainnet?: boolean;
  programId?: PublicKey | string;
  treasury?: PublicKey | string;
  commitment?: Commitment;
  rpcUrl?: string;
  rpc?: Partial<RpcConfig>;
}

function envBool(value: string | undefined): boolean | undefined {
  if (value == null || value.trim() === "") return undefined;
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function envNum(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && value != null && value.trim() !== "" ? n : fallback;
}

function trimmed(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function toPublicKey(value: PublicKey | string, label: string): PublicKey {
  if (value instanceof PublicKey) return value;
  try {
    return new PublicKey(value);
  } catch {
    throw new ConfigError(`${label} is not a valid Solana address: "${value}"`);
  }
}

/**
 * Build a resolved {@link ShadowSpaceConfig} from `process.env`, applying any
 * overrides on top. Reads (env → override precedence):
 *
 *   IS_MAINNET, SOLANA_PDA_ADDRESS, SOLANA_TREASURY_ADDRESS, SOLANA_COMMITMENT,
 *   RPC_NODE_URL, HELIUS_API_KEY, FLUX_API_KEY, ALCHEMY_SOLANA_KEY,
 *   QUICKNODE_SOLANA_URL, SYNDICA_SOLANA_KEY, DRPC_SOLANA_URL,
 *   RPC_PUBLIC_FALLBACK, RPC_DEVNET_FALLBACK, and the RPC_* tunables.
 *
 * Does NOT read PRIVATE_KEY — wallet loading lives in wallet.ts so read-only
 * clients can skip it entirely.
 */
export function loadConfig(overrides: ConfigOverrides = {}): ShadowSpaceConfig {
  const env = process.env;

  const isMainnet = overrides.isMainnet ?? envBool(env.IS_MAINNET) ?? false;
  const cluster: SolanaCluster = isMainnet ? "mainnet" : "devnet";

  const programIdRaw = overrides.programId ?? trimmed(env.SOLANA_PDA_ADDRESS) ?? DEFAULT_PROGRAM_ID;
  const programId = toPublicKey(programIdRaw, "SOLANA_PDA_ADDRESS (program ID)");

  const treasuryRaw = overrides.treasury ?? trimmed(env.SOLANA_TREASURY_ADDRESS) ?? DEFAULT_TREASURY;
  const treasury = toPublicKey(treasuryRaw, "SOLANA_TREASURY_ADDRESS");

  const commitment = overrides.commitment ?? (trimmed(env.SOLANA_COMMITMENT) as Commitment) ?? "confirmed";

  const publicFallbackUrl = isMainnet
    ? (trimmed(env.RPC_PUBLIC_FALLBACK) ?? DEFAULT_MAINNET_FALLBACK)
    : (trimmed(env.RPC_DEVNET_FALLBACK) ?? DEFAULT_DEVNET_FALLBACK);

  const rpc: RpcConfig = {
    isMainnet,
    customUrl: overrides.rpcUrl ?? trimmed(env.RPC_NODE_URL),
    heliusApiKey: trimmed(env.HELIUS_API_KEY),
    fluxApiKey: trimmed(env.FLUX_API_KEY),
    alchemyKey: trimmed(env.ALCHEMY_SOLANA_KEY),
    quicknodeUrl: trimmed(env.QUICKNODE_SOLANA_URL),
    syndicaKey: trimmed(env.SYNDICA_SOLANA_KEY),
    drpcUrl: trimmed(env.DRPC_SOLANA_URL),
    publicFallbackUrl,
    expectedGenesis: isMainnet ? MAINNET_GENESIS : DEVNET_GENESIS,
    timeoutMs: envNum(env.RPC_TIMEOUT_MS, 8000),
    breakerThreshold: envNum(env.RPC_BREAKER_THRESHOLD, 3),
    breakerCooldownMs: envNum(env.RPC_BREAKER_COOLDOWN_MS, 60_000),
    upstreamRps: envNum(env.RPC_UPSTREAM_RPS, 25),
    upstreamConcurrency: envNum(env.RPC_UPSTREAM_CONCURRENCY, 8),
    slotLagThreshold: envNum(env.RPC_SLOT_LAG_THRESHOLD, 150),
    ...overrides.rpc,
  };

  return { isMainnet, cluster, programId, treasury, commitment, rpc };
}
