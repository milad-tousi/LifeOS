import { normalizeEmail, normalizeIdentifier } from "@/domains/auth/auth.utils";
import { createAuthSession, createLocalAuthUser } from "@/domains/auth/models";
import { authRepository } from "@/domains/auth/repository";
import { clearSession, loadSession, saveSession } from "@/domains/auth/session.storage";
import {
  AuthProvider,
  AuthSession,
  CreateAccountInput,
  LoginInput,
  LoginResult,
} from "@/domains/auth/types";
import { hashPassword, verifyPassword } from "@/utils/crypto";
import { createLogger } from "@/utils/logger";

const signInLogger = createLogger("signin");
const signUpLogger = createLogger("signup");

export class LocalAuthProvider implements AuthProvider {
  async login(input: LoginInput): Promise<LoginResult> {
    signInLogger.info("submit started");
    const identifier = normalizeIdentifier(input.identifier);
    signInLogger.info("input normalized", { identifier });
    signInLogger.info("user lookup started");
    const user = await authRepository.getUserByIdentifier(identifier);
    signInLogger.info("user lookup result", { found: Boolean(user), identifier });

    if (!user) {
      return {
        success: false,
        error: "Invalid email, username, or password.",
      };
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Invalid email, username, or password.",
      };
    }

    signInLogger.info("session creation started", { userId: user.id });
    const session = createAuthSession(user);

    if (!saveSession(session)) {
      return {
        success: false,
        error: "Unable to create a local session on this browser.",
      };
    }

    return {
      success: true,
      session,
    };
  }

  async createAccount(input: CreateAccountInput): Promise<LoginResult> {
    signUpLogger.info("submit started");
    const email = normalizeEmail(input.email);
    const displayName = input.displayName.trim();
    signUpLogger.info("input normalized", { email });
    signUpLogger.info("validation passed", { hasDisplayName: Boolean(displayName) });

    if (await authRepository.emailExists(email)) {
      signUpLogger.warn("duplicate email check", { email, exists: true });
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    signUpLogger.info("duplicate email check", { email, exists: false });
    const passwordHash = await hashPassword(input.password);
    signUpLogger.info("user record creation started", { email });
    const user = createLocalAuthUser({
      displayName,
      email,
      passwordHash,
    });

    signUpLogger.info("user record save started", { userId: user.id, email: user.email });
    await authRepository.createUser(user);
    signUpLogger.info("user record saved to database", { userId: user.id, email: user.email });

    signUpLogger.info("session creation started", { userId: user.id });
    const session = createAuthSession(user);

    if (!saveSession(session)) {
      return {
        success: false,
        error: "Unable to create a local session on this browser.",
      };
    }

    return {
      success: true,
      session,
    };
  }

  logout(): Promise<void> {
    clearSession();
    return Promise.resolve();
  }

  getCurrentSession(): Promise<AuthSession | null> {
    return Promise.resolve(loadSession());
  }
}
