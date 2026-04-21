import { createLogger } from "@/utils/logger";

const authLogger = createLogger("auth");

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeIdentifier(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.includes("@")) {
    return normalizeEmail(normalizedValue);
  }

  return normalizedValue.toLowerCase();
}

export function getAuthEnvironmentSnapshot(): Record<string, boolean> {
  return {
    hasIndexedDb: typeof indexedDB !== "undefined",
    hasLocalStorage: typeof window !== "undefined" && "localStorage" in window,
    hasCrypto: typeof globalThis.crypto !== "undefined",
    hasCryptoSubtle: typeof globalThis.crypto?.subtle !== "undefined",
    hasTextEncoder: typeof TextEncoder !== "undefined",
  };
}

export function logAuthEnvironment(): void {
  authLogger.info("browser capability snapshot", getAuthEnvironmentSnapshot());
}
