// In-memory RPC throttle (no Redis). A `fetch`-compatible wrapper that:
//   • caps concurrency (queues excess)
//   • rate-limits via a token bucket (ratePerSec)
//   • optionally coalesces identical in-flight requests (dedupe)
//   • optionally backs off + retries on HTTP 429 (retryOn429)
//
// Adapted from the shyft.lol resolver. Used to wrap the upstream provider call so
// the SDK never bursts a provider's quota on a request storm. 429s are NOT retried
// here when retryOn429=false — they fail over to the next provider instead.

export interface ThrottleOpts {
  ratePerSec: number;
  maxConcurrent: number;
  /** 429 backoff attempts (only when retryOn429). */
  maxRetries?: number;
  /** Default true. The pool sets this false so failover handles 429 instead. */
  retryOn429?: boolean;
  /** Coalesce identical in-flight bodies. Default true. */
  dedupe?: boolean;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export function createThrottledFetch(opts: ThrottleOpts): typeof fetch {
  const { ratePerSec, maxConcurrent, maxRetries = 4, retryOn429 = true, dedupe = true } = opts;

  // ── token bucket ──
  let tokens = ratePerSec;
  let lastRefill = Date.now();
  function takeTokenWaitMs(): number {
    const now = Date.now();
    tokens = Math.min(ratePerSec, tokens + ((now - lastRefill) / 1000) * ratePerSec);
    lastRefill = now;
    if (tokens >= 1) {
      tokens -= 1;
      return 0;
    }
    return Math.ceil(((1 - tokens) / ratePerSec) * 1000);
  }

  // ── concurrency gate ──
  let active = 0;
  const queue: Array<() => void> = [];
  function acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (active < maxConcurrent) {
        active++;
        resolve();
      } else {
        queue.push(resolve);
      }
    });
  }
  function release(): void {
    const next = queue.shift();
    if (next)
      next(); // hand the slot to the next waiter (active stays the same)
    else active--;
  }

  const inflight = new Map<string, Promise<{ status: number; text: string }>>();

  const run = async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ): Promise<{ status: number; text: string }> => {
    await acquire();
    try {
      let attempt = 0;
      for (;;) {
        const wait = takeTokenWaitMs();
        if (wait > 0) await sleep(wait);
        const res = await fetch(input, init);
        if (!retryOn429 || res.status !== 429 || attempt >= maxRetries) {
          return { status: res.status, text: await res.text() };
        }
        // 429 → back off (honor Retry-After if given), then retry the same endpoint.
        const retryAfter = Number(res.headers.get("retry-after"));
        const backoff =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250;
        try {
          await res.text();
        } catch {
          /* drain body */
        }
        await sleep(backoff);
        attempt++;
      }
    } finally {
      release();
    }
  };

  return async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> => {
    const key = dedupe && typeof init?.body === "string" ? init.body : null;
    if (key) {
      const existing = inflight.get(key);
      if (existing) {
        const r = await existing;
        return new Response(r.text, { status: r.status, headers: { "content-type": "application/json" } });
      }
    }
    const p = run(input, init);
    if (key) {
      inflight.set(key, p);
      void p.finally(() => inflight.delete(key)).catch(() => {});
    }
    const r = await p;
    return new Response(r.text, { status: r.status, headers: { "content-type": "application/json" } });
  };
}
