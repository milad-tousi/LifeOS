import { AuthProvider } from "@/domains/auth/types";

export interface AuthProviderFactory {
  createProvider(): AuthProvider;
}
