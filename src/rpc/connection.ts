// A web3.js `Connection` whose every request is routed through the RPC provider
// pool with automatic failover + circuit breaking (RpcPool). The endpoint URL
// handed to the constructor is only a label — the custom `fetch` ignores it and
// lets the pool pick the upstream, so a blocked/throttled/stale primary
// transparently fails over to a secondary.

import { Connection, type Commitment } from "@solana/web3.js";
import type { RpcPool } from "./endpoints.js";

/**
 * Build a failover-backed {@link Connection}. Drop-in for `new Connection(url)` —
 * every JSON-RPC call (including `sendTransaction`) routes through `pool`.
 */
export function createFailoverConnection(pool: RpcPool, commitment: Commitment = "confirmed"): Connection {
  const failoverFetch = async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ): Promise<Response> => {
    let body: unknown = null;
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = null;
      }
    }
    // Not a JSON-RPC payload (shouldn't happen for Connection) → plain fetch.
    if (body == null) return fetch(input, init);

    const r = await pool.fetchWithFailover(body);
    const payload = r.json != null ? JSON.stringify(r.json) : (r.text ?? "");
    return new Response(payload, { status: 200, headers: { "content-type": "application/json" } });
  };

  // The label URL is cosmetic; the failover fetch decides the real upstream.
  return new Connection(pool.getPrimaryUrl(), {
    commitment,
    disableRetryOnRateLimit: false,
    fetch: failoverFetch,
  });
}
