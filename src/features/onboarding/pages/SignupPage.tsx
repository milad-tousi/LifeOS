import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OnboardingLayout } from "@/features/onboarding/components/OnboardingLayout";
import { StepAccount } from "@/features/onboarding/components/StepAccount";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { createLogger } from "@/utils/logger";

const signUpLogger = createLogger("signup");
const routerLogger = createLogger("router");

export function SignupPage(): JSX.Element {
  const { createAccount, isAuthenticated, isLoading } = useAuth();
  const { isCompleted, isSkipped, isStarted, startOnboarding } = useOnboarding();
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isRedirecting) {
      return;
    }

    const destination = isStarted && !isCompleted && !isSkipped ? "/onboarding" : "/";
    routerLogger.info("redirect started", { destination, source: "signup-page-effect" });
    window.location.replace(destination);
  }, [isAuthenticated, isCompleted, isRedirecting, isSkipped, isStarted]);

  async function handleCreateAccount(input: {
    displayName: string;
    email: string;
    password: string;
  }): Promise<void> {
    signUpLogger.info("submit started", { email: input.email });
    const result = await createAccount(input);

    if (!result.success) {
      signUpLogger.warn("submit failed", { error: result.error });
      setError(result.error ?? "Unable to create your account.");
      return;
    }

    try {
      setError("");
      setIsRedirecting(true);
      await startOnboarding({ displayName: input.displayName });
      routerLogger.info("redirect started", { destination: "/onboarding", source: "signup" });
      window.location.replace("/onboarding");
    } catch (error) {
      setIsRedirecting(false);
      signUpLogger.error("onboarding start failed after account creation", error);
      setError("Your account was created, but onboarding could not start on this browser.");
    }
  }

  return (
    <OnboardingLayout
      currentStep={0}
      description="Create your local account first. The rest of onboarding stays light and can be skipped later."
      showBack={false}
      showNext={false}
      title="Create your account"
      totalSteps={11}
    >
      <StepAccount error={error} isLoading={isLoading} onSubmit={handleCreateAccount} />
      <p className="auth-page__secondary auth-page__secondary--center">
        Already have an account?{" "}
        <Link className="auth-page__link" to="/login">
          Sign in
        </Link>
      </p>
    </OnboardingLayout>
  );
}
