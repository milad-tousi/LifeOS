import { AUTH_SESSION_STORAGE_KEY } from "@/constants/auth.constants";
import { AuthSession } from "@/domains/auth/types";
import { createLogger } from "@/utils/logger";

const sessionLogger = createLogger("session");

function probeStorage(storage: Storage): Storage {
  storage.setItem("__lifeos_storage_probe__", "1");
  storage.removeItem("__lifeos_storage_probe__");
  return storage;
}

function readStorage(storageType: "localStorage" | "sessionStorage"): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return probeStorage(window[storageType]);
  } catch (error) {
    sessionLogger.warn(`${storageType} is unavailable`, error);
    return null;
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    sessionLogger.warn("window is unavailable");
    return null;
  }

  const localStorage = readStorage("localStorage");

  if (localStorage) {
    return localStorage;
  }

  const sessionStorage = readStorage("sessionStorage");

  if (sessionStorage) {
    sessionLogger.warn("localStorage is unavailable, falling back to sessionStorage");
    return sessionStorage;
  }

  sessionLogger.error("unable to access browser storage");
  return null;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession>;

  return Boolean(
    candidate.userId &&
      candidate.displayName &&
      candidate.email &&
      candidate.role &&
      typeof candidate.isAuthenticated === "boolean",
  );
}

export function saveSession(session: AuthSession): boolean {
  sessionLogger.info("session save started", { userId: session.userId });
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    sessionLogger.info("session saved", { userId: session.userId });
    return true;
  } catch (error) {
    sessionLogger.error("failed to save session", error);
    return false;
  }
}

export function loadSession(): AuthSession | null {
  sessionLogger.info("restore started");
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  sessionLogger.info("localStorage read started");

  try {
    const rawSession = storage.getItem(AUTH_SESSION_STORAGE_KEY);
    sessionLogger.info("localStorage read result", { hasSession: Boolean(rawSession) });

    if (!rawSession) {
      return null;
    }

    const parsedValue = JSON.parse(rawSession) as unknown;

    if (!isAuthSession(parsedValue)) {
      sessionLogger.warn("parsed session shape is invalid");
      clearSession();
      return null;
    }

    const parsedSession = parsedValue;
    sessionLogger.info("parsed session result", {
      userId: parsedSession.userId,
      isAuthenticated: parsedSession.isAuthenticated,
    });
    return parsedSession;
  } catch (error) {
    sessionLogger.error("failed to load session", error);
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(AUTH_SESSION_STORAGE_KEY);
    sessionLogger.info("session cleared");
  } catch (error) {
    sessionLogger.error("failed to clear session", error);
  }
}
