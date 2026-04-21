import { DEFAULT_LOCAL_AUTH_USER } from "@/constants/auth.constants";
import { AuthSession, AuthUser } from "@/domains/auth/types";
import { createId } from "@/lib/id";

export function createLocalAuthUser(params: {
  displayName?: string;
  email?: string;
  passwordHash: string;
  role?: string;
}): AuthUser {
  const timestamp = Date.now();

  return {
    id: createId(),
    displayName: params.displayName ?? DEFAULT_LOCAL_AUTH_USER.displayName,
    email: params.email ?? DEFAULT_LOCAL_AUTH_USER.email,
    passwordHash: params.passwordHash,
    role: params.role ?? DEFAULT_LOCAL_AUTH_USER.role,
    source: "local",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createAuthSession(user: AuthUser): AuthSession {
  return {
    userId: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    source: user.source,
    isAuthenticated: true,
    loginAt: Date.now(),
  };
}
