// Solana RPC resolver — "where RPC goes and when to fail over." Adapted from the
// shyft.lol server resolver (docs/PRD-rpc-resilience.md), made config-driven and
// instance-scoped so each client owns its own circuit-breaker state.
//
// Provides:
//   • a provider pool built from config (RPC_NODE_URL → keyed providers → keyless)
//   • multi-shape failure classification (the reject shapes real providers return)
//   • a passive, in-memory circuit breaker (no background pinger)
//   • genesis-hash + slot-lag freshness checks (the silent-wrong-cluster case)

import type { RpcConfig } from "../config.js";
import { RpcPoolExhaustedError } from "../errors.js";
import { createThrottledFetch } from "./throttle.js";

export type Verdict = "ok" | "app_error" | "provider_down" | "rate_limited" | "transient";

export interface RpcProvider {
  name: string;
  url: string;
  keyless: boolean;
}

export interface RawResult {
  status: number;
  ms: number;
  json: unknown;
  text: string | null;
}

export interface FailoverResult {
  provider: string;
  status: number;
  json: unknown;
  text: string | null;
  verdict: Verdict;
}

export interface EndpointHealth {
  url: string;
  reachable: boolean;
  healthy: boolean;
  genesisOk: boolean;
  slot: number | null;
  verdict: Verdict;
}

// ── Multi-shape failure classification ───────────────────────────────────────
const AUTH_RE =
  /(api[\s_-]?key|forbidden|unauthor|not allowed|access denied|invalid key|payment required|upgrade|paid[\s-]?tier|free[\s-]?tier|quota|suspended|disabled)/i;
const RATE_RE = /(rate.?limit|too many|throttl|\b429\b)/i;
const NODE_BEHIND_RE = /(node is behind|node is unhealthy|not available|temporar|try again|blockstore)/i;

function errorMessageOf(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const e = (json as { error?: unknown }).error;
  if (e == null) return null;
  if (typeof e === "string") return e;
  if (typeof e === "object") {
    const msg = (e as { message?: unknown }).message;
    return typeof msg === "string" ? msg : JSON.stringify(e);
  }
  return typeof e === "number" || typeof e === "boolean" ? String(e) : JSON.stringify(e);
}

function errorCodeOf(json: unknown): number | null {
  const e = json && typeof json === "object" ? (json as { error?: unknown }).error : null;
  if (e && typeof e === "object") {
    const code = (e as { code?: unknown }).code;
    return typeof code === "number" ? code : null;
  }
  return null;
}

/**
 * Classify an upstream RPC response. PURE — exported for unit tests.
 *  - `ok`            → has a `result`; return to caller
 *  - `app_error`     → a legit JSON-RPC error (e.g. invalid params); return to caller
 *  - `provider_down` → auth/quota/block; trip breaker + fail over (alert-worthy)
 *  - `rate_limited`  → 429 / "too many"; fail over
 *  - `transient`     → 5xx / timeout / non-JSON / node-behind; retry/fail over
 */
export function classifyResponse(httpStatus: number, json: unknown, text?: string | null): Verdict {
  if (httpStatus === 0) return "transient"; // network / timeout / abort
  if (httpStatus === 401 || httpStatus === 402 || httpStatus === 403 || httpStatus === 407 || httpStatus === 410) {
    return "provider_down";
  }
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus >= 500) return "transient";

  if (!json) {
    return RATE_RE.test(text || "") ? "rate_limited" : "transient";
  }

  // JSON-RPC batch (array) — transport succeeded; per-item errors are the caller's.
  if (Array.isArray(json)) return "ok";

  const msg = errorMessageOf(json);
  if (msg != null) {
    if (RATE_RE.test(msg)) return "rate_limited";
    if (AUTH_RE.test(msg)) return "provider_down";
    if (NODE_BEHIND_RE.test(msg)) return "transient";
    const code = errorCodeOf(json);
    if (code === -32005 || code === -32004 || code === -32014) return "transient"; // node behind / unhealthy
    return "app_error"; // legit application error — return to caller, do NOT fail over
  }

  if (Object.prototype.hasOwnProperty.call(json, "result")) return "ok";
  return "transient";
}

interface BreakerEntry {
  failures: number;
  openUntil: number;
}

/**
 * An ordered RPC provider pool with automatic failover and a passive circuit
 * breaker. One instance per client so breaker state never leaks between configs.
 */
export class RpcPool {
  private readonly providers: RpcProvider[];
  private readonly breaker = new Map<string, BreakerEntry>();
  private readonly upstreamFetch: typeof fetch;

  constructor(private readonly cfg: RpcConfig) {
    this.providers = RpcPool.buildProviders(cfg);
    this.upstreamFetch = createThrottledFetch({
      ratePerSec: cfg.upstreamRps,
      maxConcurrent: cfg.upstreamConcurrency,
      retryOn429: false, // let failover handle 429
      dedupe: false,
    });
  }

  /**
   * Build the ordered provider pool. Order: explicit `RPC_NODE_URL` → cluster-keyed
   * providers (Helius works on both clusters; the rest are mainnet-only) → keyless
   * public fallback (always appended as last resort).
   */
  static buildProviders(cfg: RpcConfig): RpcProvider[] {
    const list: RpcProvider[] = [];

    if (cfg.customUrl) list.push({ name: "custom", url: cfg.customUrl, keyless: false });

    if (!cfg.isMainnet) {
      if (cfg.heliusApiKey) {
        list.push({
          name: "helius-devnet",
          url: `https://devnet.helius-rpc.com/?api-key=${cfg.heliusApiKey}`,
          keyless: false,
        });
      }
      list.push({ name: "solana-devnet", url: cfg.publicFallbackUrl, keyless: true });
      return RpcPool.dedupe(list);
    }

    if (cfg.heliusApiKey) {
      list.push({ name: "helius", url: `https://mainnet.helius-rpc.com/?api-key=${cfg.heliusApiKey}`, keyless: false });
    }
    if (cfg.fluxApiKey)
      list.push({ name: "fluxrpc", url: `https://eu.fluxrpc.com?key=${cfg.fluxApiKey}`, keyless: false });
    if (cfg.alchemyKey) {
      list.push({ name: "alchemy", url: `https://solana-mainnet.g.alchemy.com/v2/${cfg.alchemyKey}`, keyless: false });
    }
    if (cfg.quicknodeUrl) list.push({ name: "quicknode", url: cfg.quicknodeUrl, keyless: false });
    if (cfg.syndicaKey) {
      list.push({
        name: "syndica",
        url: `https://solana-mainnet.api.syndica.io/api-key/${cfg.syndicaKey}`,
        keyless: false,
      });
    }
    if (cfg.drpcUrl) list.push({ name: "drpc", url: cfg.drpcUrl, keyless: false });

    list.push({ name: "publicnode", url: cfg.publicFallbackUrl, keyless: true });
    return RpcPool.dedupe(list);
  }

  private static dedupe(list: RpcProvider[]): RpcProvider[] {
    const seen = new Set<string>();
    return list.filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true)));
  }

  /** Every configured provider, in preference order. */
  getProviders(): RpcProvider[] {
    return this.providers;
  }

  private breakerIsOpen(name: string): boolean {
    const e = this.breaker.get(name);
    return !!e && e.openUntil > Date.now();
  }

  private recordSuccess(name: string): void {
    this.breaker.set(name, { failures: 0, openUntil: 0 });
  }

  private recordFailure(name: string): void {
    const e = this.breaker.get(name) ?? { failures: 0, openUntil: 0 };
    e.failures += 1;
    if (e.failures >= this.cfg.breakerThreshold) e.openUntil = Date.now() + this.cfg.breakerCooldownMs;
    this.breaker.set(name, e);
  }

  /** Providers not currently tripped, in preference order. Half-opens if all are open. */
  getActiveProviders(): RpcProvider[] {
    const live = this.providers.filter((p) => !this.breakerIsOpen(p.name));
    return live.length ? live : this.providers;
  }

  /** The single best RPC URL right now — top non-tripped provider, else keyless fallback. */
  getPrimaryUrl(): string {
    return this.getActiveProviders()[0]?.url ?? this.cfg.publicFallbackUrl;
  }

  private async rawFetch(url: string, body: unknown, timeoutMs = this.cfg.timeoutMs): Promise<RawResult> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const started = Date.now();
    try {
      const res = await this.upstreamFetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      let json: unknown = null;
      let text: string | null = null;
      try {
        json = await res.clone().json();
      } catch {
        text = (await res.text()).slice(0, 500);
      }
      return { status: res.status, ms: Date.now() - started, json, text };
    } catch (e) {
      const isAbort = e instanceof Error && e.name === "AbortError";
      const message = e instanceof Error ? e.message : String(e);
      return { status: 0, ms: Date.now() - started, json: null, text: isAbort ? "timeout" : message };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Send a JSON-RPC body through the pool, failing over on
   * `provider_down` / `rate_limited` / `transient`. Returns the first `ok` or
   * `app_error` response. Throws {@link RpcPoolExhaustedError} if all fail.
   *
   * sendTransaction is safe to fan out this way — Solana txs are idempotent by
   * signature, so duplicate broadcasts land once.
   */
  async fetchWithFailover(body: unknown, opts: { timeoutMs?: number } = {}): Promise<FailoverResult> {
    const attempts: { provider: string; verdict: Verdict; status: number }[] = [];
    for (const p of this.getActiveProviders()) {
      const r = await this.rawFetch(p.url, body, opts.timeoutMs);
      const verdict = classifyResponse(r.status, r.json, r.text);

      if (verdict === "ok" || verdict === "app_error") {
        this.recordSuccess(p.name);
        return { provider: p.name, status: r.status, json: r.json, text: r.text, verdict };
      }

      this.recordFailure(p.name);
      if (verdict === "provider_down") {
        console.error(`[rpc-failover] provider_down: ${p.name} (http ${r.status}) — key likely revoked/blocked`);
      }
      attempts.push({ provider: p.name, verdict, status: r.status });
    }
    throw new RpcPoolExhaustedError(attempts);
  }

  // ── Freshness / cluster detection — the silent failure case ──────────────────
  /**
   * Probe a single endpoint for reachability + correct cluster + current slot.
   * Catches "HTTP 200 but wrong cluster / stale" that plain status checks miss.
   */
  async verifyEndpoint(url: string, timeoutMs = this.cfg.timeoutMs): Promise<EndpointHealth> {
    const rpcBody = (method: string, params: unknown[] = []) => ({ jsonrpc: "2.0", id: 1, method, params });
    const [health, genesis, slot] = await Promise.all([
      this.rawFetch(url, rpcBody("getHealth"), timeoutMs),
      this.rawFetch(url, rpcBody("getGenesisHash"), timeoutMs),
      this.rawFetch(url, rpcBody("getSlot"), timeoutMs),
    ]);
    const resultOf = (json: unknown): unknown =>
      json && typeof json === "object" ? (json as { result?: unknown }).result : undefined;
    const slotResult = resultOf(slot.json);
    return {
      url,
      reachable: health.status !== 0,
      healthy: resultOf(health.json) === "ok",
      genesisOk: resultOf(genesis.json) === this.cfg.expectedGenesis,
      slot: typeof slotResult === "number" ? slotResult : null,
      verdict: classifyResponse(health.status, health.json, health.text),
    };
  }

  /** Probe every provider in the pool (health, cluster, slot). */
  async verifyAll(): Promise<EndpointHealth[]> {
    return Promise.all(this.providers.map((p) => this.verifyEndpoint(p.url)));
  }
}
