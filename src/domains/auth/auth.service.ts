import { DEFAULT_LOCAL_AUTH_USER } from "@/constants/auth.constants";
import { STORAGE_KEYS } from "@/constants/storage.keys";
import { db, checkDatabaseHealth, ensureDatabaseReady } from "@/db/dexie";
import { logAuthEnvironment, normalizeEmail } from "@/domains/auth/auth.utils";
import { createLocalAuthUser } from "@/domains/auth/models";
import { LocalAuthProvider } from "@/domains/auth/local-auth.provider";
import { authRepository } from "@/domains/auth/repository";
import {
  AuthProvider,
  AuthSession,
  CreateAccountInput,
  LoginInput,
  LoginResult,
} from "@/domains/auth/types";
import { onboardingRepository } from "@/domains/onboarding/repository";
import { hashPassword } from "@/utils/crypto";
import { createLogger } from "@/utils/logger";

// ── All localStorage keys owned by user data ──────────────────────────────────
const USER_LOCALSTORAGE_KEYS: string[] = [
  // Finance (from STORAGE_KEYS)
  STORAGE_KEYS.uiPreferences,
  STORAGE_KEYS.onboardingState,
  STORAGE_KEYS.lastBackupAt,
  STORAGE_KEYS.financeTransactions,
  STORAGE_KEYS.financeCategories,
  STORAGE_KEYS.financeSettings,
  STORAGE_KEYS.financeMerchantRules,
  STORAGE_KEYS.financeRecurringTransactions,
  STORAGE_KEYS.financeSmartRules,
  STORAGE_KEYS.financeVoiceAliases,
  // Habits (hardcoded in habits.storage.ts)
  "lifeos:habits:v1",
  "lifeos:habitLogs:v1",
  "lifeos:habitCategories:v1",
  "lifeos:habitReminderSettings:v1",
];

/**
 * Wipes every user-owned table in Dexie and every user-owned localStorage key.
 * Auth user record and onboarding draft are NOT deleted here — the caller is
 * responsible for that (so we don't break the terminate flow).
 */
async function clearAllUserData(): Promise<void> {
  // Dexie tables — clear all user-owned data in parallel
  await db.transaction(
    "rw",
    [
      db.tasks,
      db.taskBoardColumns,
      db.calendarEvents,
      db.habits,
      db.habitLogs,
      db.goals,
      db.expenses,
      db.dailyReviews,
      db.settings,
      db.notifications,
      db.userPreferences,
      db.userProfiles,
    ],
    async () => {
      await Promise.all([
        db.tasks.clear(),
        db.taskBoardColumns.clear(),
        db.calendarEvents.clear(),
        db.habits.clear(),
        db.habitLogs.clear(),
        db.goals.clear(),
        db.expenses.clear(),
        db.dailyReviews.clear(),
        db.settings.clear(),
        db.notifications.clear(),
        db.userPreferences.clear(),
        db.userProfiles.clear(),
      ]);
    },
  );

  // localStorage — wipe all user-owned keys.
  // Finance keys that have auto-seeding fallbacks get an explicit empty-array
  // value instead of removal, so ensureFinanceSeedData() doesn't re-populate
  // them with demo data on the next read.
  if (typeof localStorage !== "undefined") {
    const FINANCE_ARRAY_KEYS = new Set([
      STORAGE_KEYS.financeTransactions,
      STORAGE_KEYS.financeRecurringTransactions,
      STORAGE_KEYS.financeSmartRules,
      STORAGE_KEYS.financeVoiceAliases,
    ]);

    for (const key of USER_LOCALSTORAGE_KEYS) {
      if (FINANCE_ARRAY_KEYS.has(key)) {
        localStorage.setItem(key, "[]");
      } else {
        localStorage.removeItem(key);
      }
    }
  }
}

const authProvider: AuthProvider = new LocalAuthProvider();
const authLogger = createLogger("auth");
const signInLogger = createLogger("signin");
const signUpLogger = createLogger("signup");

async function ensureDefaultLocalUser(): Promise<void> {
  const normalizedAdminEmail = normalizeEmail(DEFAULT_LOCAL_AUTH_USER.email);
  const existingAdminUser = await authRepository.getUserByEmail(normalizedAdminEmail);

  if (existingAdminUser) {
    return;
  }

  const passwordHash = await hashPassword(DEFAULT_LOCAL_AUTH_USER.password);
  const user = createLocalAuthUser({
    passwordHash,
    email: normalizedAdminEmail,
    displayName: DEFAULT_LOCAL_AUTH_USER.displayName,
    role: DEFAULT_LOCAL_AUTH_USER.role,
  });

  try {
    await authRepository.createUser(user);
  } catch {
    // If another initialization path created the same local admin user first,
    // this seed can be treated as complete.
  }
}

export const authService = {
  async initialize(): Promise<void> {
    authLogger.info("initialize started");
    logAuthEnvironment();
    await checkDatabaseHealth();
    await ensureDefaultLocalUser();
    authLogger.info("initialize completed");
  },
  async login(input: LoginInput): Promise<LoginResult> {
    signInLogger.info("auth service login started");
    await ensureDatabaseReady();
    await ensureDefaultLocalUser();
    try {
      return await authProvider.login(input);
    } catch (error) {
      signInLogger.error("sign in failed unexpectedly", error);
      throw error;
    }
  },
  async createAccount(input: CreateAccountInput): Promise<LoginResult> {
    signUpLogger.info("account creation flow started");
    await ensureDatabaseReady();
    await ensureDefaultLocalUser();
    try {
      return await authProvider.createAccount(input);
    } catch (error) {
      signUpLogger.error("account creation failed unexpectedly", error);
      throw error;
    }
  },
  async logout(): Promise<void> {
    authLogger.info("logout started");
    await authProvider.logout();
    authLogger.info("logout completed");
  },
  async terminateCurrentAccount(): Promise<void> {
    authLogger.info("terminate account started");
    const session = await authProvider.getCurrentSession();

    if (!session) {
      await clearAllUserData();
      await authProvider.logout();
      return;
    }

    if (session.source !== "local") {
      await clearAllUserData();
      await authProvider.logout();
      return;
    }

    // 1. Wipe all user-owned data (Dexie tables + localStorage)
    await clearAllUserData();

    // 2. Delete the auth user record and onboarding draft
    await Promise.all([
      authRepository.deleteUserById(session.userId),
      onboardingRepository.deleteDraft(session.userId),
    ]);

    await authProvider.logout();
    authLogger.info("terminate account completed", { userId: session.userId });
  },
  async getCurrentSession(): Promise<AuthSession | null> {
    authLogger.info("session restore requested");
    return authProvider.getCurrentSession();
  },
};
