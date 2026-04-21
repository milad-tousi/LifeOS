// This helper is intentionally lightweight for local-only MVP auth.
// It is suitable for offline credential storage in this phase, but it is not
// a replacement for server-side enterprise authentication controls.

import { createLogger } from "@/utils/logger";

const cryptoLogger = createLogger("auth");

function assertCryptoSupport(): void {
  cryptoLogger.info("crypto capability check", {
    hasCrypto: typeof globalThis.crypto !== "undefined",
    hasCryptoSubtle: typeof globalThis.crypto?.subtle !== "undefined",
    hasTextEncoder: typeof TextEncoder !== "undefined",
  });

  if (typeof TextEncoder === "undefined") {
    throw new Error("TextEncoder is unavailable in this browser.");
  }

  if (typeof globalThis.crypto === "undefined" || typeof globalThis.crypto.subtle === "undefined") {
    throw new Error("Web Crypto API is unavailable in this browser.");
  }
}

export async function hashPassword(password: string): Promise<string> {
  cryptoLogger.info("password hashing started");
  assertCryptoSupport();
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  cryptoLogger.info("password hashing completed");

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  cryptoLogger.info("password comparison started");
  const candidateHash = await hashPassword(password);
  const isMatch = candidateHash === passwordHash;
  cryptoLogger.info("password comparison result", { isMatch });
  return isMatch;
}
