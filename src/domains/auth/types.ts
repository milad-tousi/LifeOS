import { EntityId, TimestampMs } from "@/types/shared.types";

export type AuthSource = "local" | "cs-user";

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface CreateAccountInput {
  displayName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: EntityId;
  displayName: string;
  email: string;
  passwordHash: string;
  role: string;
  source: "local";
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export interface AuthSession {
  userId: EntityId;
  displayName: string;
  email: string;
  role: string;
  source: AuthSource;
  isAuthenticated: boolean;
  loginAt: TimestampMs;
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface AuthProvider {
  login(input: LoginInput): Promise<LoginResult>;
  createAccount(input: CreateAccountInput): Promise<LoginResult>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
}
