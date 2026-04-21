import { AuthStoreState, useAuthStore } from "@/state/auth.store";

export function useAuth() {
  const session = useAuthStore((state: AuthStoreState) => state.session);
  const isAuthenticated = useAuthStore((state: AuthStoreState) => state.isAuthenticated);
  const isLoading = useAuthStore((state: AuthStoreState) => state.isLoading);
  const login = useAuthStore((state: AuthStoreState) => state.login);
  const createAccount = useAuthStore((state: AuthStoreState) => state.createAccount);
  const logout = useAuthStore((state: AuthStoreState) => state.logout);
  const terminateAccount = useAuthStore((state: AuthStoreState) => state.terminateAccount);
  const restoreSession = useAuthStore((state: AuthStoreState) => state.restoreSession);

  return {
    session,
    isAuthenticated,
    isLoading,
    login,
    createAccount,
    logout,
    terminateAccount,
    restoreSession,
  };
}
