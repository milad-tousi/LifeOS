import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createLogger } from "@/utils/logger";

interface ProtectedRouteProps {
  children?: ReactNode;
}

const routerLogger = createLogger("router");

export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    routerLogger.info("redirect started", {
      destination: "/login",
      source: "protected-route",
      from: location.pathname,
    });
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children ? <>{children}</> : <Outlet />;
}
