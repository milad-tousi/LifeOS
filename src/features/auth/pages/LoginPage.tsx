import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card } from "@/components/common/Card";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createLogger } from "@/utils/logger";

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

const signInLogger = createLogger("signin");
const routerLogger = createLogger("router");

interface LoginPageProps {
  isAuthenticated?: boolean;
}

export function LoginPage({ isAuthenticated = false }: LoginPageProps): JSX.Element {
  const location = useLocation();
  const { isLoading, login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const locationState = location.state as LoginLocationState | null;
    const destination = locationState?.from?.pathname ?? "/";
    routerLogger.info("redirect started", { destination, source: "login-page-effect" });
    window.location.replace(destination);
  }, [isAuthenticated, location.state]);

  async function handleLogin(input: { identifier: string; password: string }): Promise<void> {
    signInLogger.info("submit started", { identifier: input.identifier });
    const result = await login(input);

    if (!result.success) {
      signInLogger.warn("submit failed", { error: result.error });
      setError(result.error ?? "Unable to sign in.");
      return;
    }

    setError("");
    routerLogger.info("redirect started", { destination: "/", source: "login-submit" });
    window.location.replace("/");
  }

  return (
    <div className="auth-page">
      <Card title="LifeOS" subtitle="Local-first sign in">
        <div className="auth-page__intro">
          <h1 className="auth-page__title">Welcome back</h1>
          <p className="text-muted">
            Sign in with your local account to access LifeOS on this device.
          </p>
          <p className="auth-page__hint">
            Default dev login: admin or admin@lifeos.local / admin123
          </p>
        </div>
        <LoginForm error={error} isLoading={isLoading} onSubmit={handleLogin} />
        <p className="auth-page__secondary">
          Don&apos;t have an account?{" "}
          <Link className="auth-page__link" to="/signup">
            Create account
          </Link>
        </p>
      </Card>
    </div>
  );
}
