import { create } from "zustand";
import { authService } from "@/domains/auth/auth.service";
import { AuthSession, CreateAccountInput, LoginInput, LoginResult } from "@/domains/auth/types";
import { createLogger } from "@/utils/logger";

const authLogger = createLogger("auth");
const signInLogger = createLogger("signin");
const signUpLogger = createLogger("signup");
const sessionLogger = createLogger("session");

export interface AuthStoreState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<LoginResult>;
  createAccount: (input: CreateAccountInput) => Promise<LoginResult>;
  logout: () => Promise<void>;
  terminateAccount: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  session: null,
  isAuthenticated: false,
  isLoading: true,
  async login(input) {
    set({ isLoading: true });
    try {
      const result = await authService.login(input);
      signInLogger.info("auth store updated", {
        success: result.success,
        userId: result.session?.userId,
      });

      set({
        session: result.session ?? null,
        isAuthenticated: Boolean(result.session?.isAuthenticated),
        isLoading: false,
      });

      return result;
    } catch (error) {
      signInLogger.error("auth store login failed", error);
      const failedResult: LoginResult = {
        success: false,
        error: "Sign in failed on this browser. Please try again.",
      };

      set({
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });

      return failedResult;
    }
  },
  async createAccount(input) {
    set({ isLoading: true });
    try {
      const result = await authService.createAccount(input);
      signUpLogger.info("auth store updated", {
        success: result.success,
        userId: result.session?.userId,
      });

      set({
        session: result.session ?? null,
        isAuthenticated: Boolean(result.session?.isAuthenticated),
        isLoading: false,
      });

      return result;
    } catch (error) {
      signUpLogger.error("auth store account creation failed", error);
      const failedResult: LoginResult = {
        success: false,
        error: "Unable to create account on this browser. Please try again.",
      };

      set({
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });

      return failedResult;
    }
  },
  async logout() {
    set({ isLoading: true });
    await authService.logout();
    set({
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
  async terminateAccount() {
    set({ isLoading: true });
    await authService.terminateCurrentAccount();
    set({
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
  async restoreSession() {
    set({ isLoading: true });
    sessionLogger.info("restore started");
    try {
      const session = await authService.getCurrentSession();

      set({
        session,
        isAuthenticated: Boolean(session?.isAuthenticated),
        isLoading: false,
      });

      sessionLogger.info("auth state restored", {
        hasSession: Boolean(session),
        userId: session?.userId,
      });
    } catch (error) {
      authLogger.error("restore session failed", error);
      set({
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }

    void authService.initialize().catch((error) => {
      authLogger.error("background auth initialization failed", error);
    });
  },
}));
