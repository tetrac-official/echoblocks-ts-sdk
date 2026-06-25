// SDK error types. These wrap configuration and validation failures so callers can
// branch on `instanceof` instead of string-matching messages. On-chain program
// errors surface as Anchor's own `AnchorError` (with the program's error code/msg).

/** Base class for every error the SDK throws itself (vs. RPC/Anchor errors). */
export class ShadowSpaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShadowSpaceError";
  }
}

/** Thrown when required configuration (env or constructor options) is missing/invalid. */
export class ConfigError extends ShadowSpaceError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Thrown when an argument fails a client-side check before a transaction is sent. */
export class ValidationError extends ShadowSpaceError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Thrown when a write method is called on a client created without a signer wallet. */
export class WalletRequiredError extends ShadowSpaceError {
  constructor(action = "this action") {
    super(
      `A signer wallet is required for ${action}. Set PRIVATE_KEY (or pass a Keypair) ` + `when creating the client.`,
    );
    this.name = "WalletRequiredError";
  }
}

/** Thrown when every provider in the RPC failover pool has failed. */
export class RpcPoolExhaustedError extends ShadowSpaceError {
  constructor(public readonly attempts: { provider: string; verdict: string; status: number }[]) {
    super(`All RPC providers failed: ${attempts.map((a) => `${a.provider}:${a.verdict}`).join(", ")}`);
    this.name = "RpcPoolExhaustedError";
  }
}
