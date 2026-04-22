// This helper is intentionally lightweight for local-only MVP auth.
// It is suitable for offline credential storage in this phase, but it is not
// a replacement for server-side enterprise authentication controls.

import { createLogger } from "@/utils/logger";

const cryptoLogger = createLogger("auth");

function canUseWebCrypto(): boolean {
  cryptoLogger.info("crypto capability check", {
    hasCrypto: typeof globalThis.crypto !== "undefined",
    hasCryptoSubtle: typeof globalThis.crypto?.subtle !== "undefined",
    hasTextEncoder: typeof TextEncoder !== "undefined",
  });

  return (
    typeof TextEncoder !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.subtle !== "undefined"
  );
}

function hashPasswordWithFallback(password: string): string {
  // Fallback for browsers that block SubtleCrypto on non-secure origins.
  let hash = 2166136261;

  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fallback-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function hashPassword(password: string): Promise<string> {
  cryptoLogger.info("password hashing started");

  if (!canUseWebCrypto()) {
    const fallbackHash = hashPasswordWithFallback(password);
    cryptoLogger.warn("Web Crypto API unavailable, using compatibility password hash fallback");
    cryptoLogger.info("password hashing completed");
    return fallbackHash;
  }

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
