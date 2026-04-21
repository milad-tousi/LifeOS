import { DEFAULT_LOCAL_AUTH_USER } from "@/constants/auth.constants";
import { checkDatabaseHealth, ensureDatabaseReady } from "@/db/dexie";
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
      await authProvider.logout();
      return;
    }

    if (session.source !== "local") {
      await authProvider.logout();
      return;
    }

    await Promise.all([
      authRepository.deleteUserById(session.userId),
      onboardingRepository.deleteDraft(session.userId),
    ]);

    // TODO: Remove user-owned domain records when app entities include explicit ownership fields.
    await authProvider.logout();
    authLogger.info("terminate account completed", { userId: session.userId });
  },
  async getCurrentSession(): Promise<AuthSession | null> {
    authLogger.info("session restore requested");
    return authProvider.getCurrentSession();
  },
};
