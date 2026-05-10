import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OnboardingLayout } from "@/features/onboarding/components/OnboardingLayout";
import { StepAccount } from "@/features/onboarding/components/StepAccount";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { applyDocumentLanguage, LANGUAGE_STORAGE_KEY, useI18n } from "@/i18n";
import { Language } from "@/i18n/i18n.types";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { createLogger } from "@/utils/logger";

const signUpLogger = createLogger("signup");
const routerLogger = createLogger("router");

export function SignupPage(): JSX.Element {
  const { createAccount, isAuthenticated, isLoading } = useAuth();
  const { direction, language, setLanguage, t } = useI18n();
  const { isCompleted, isSkipped, isStarted, startOnboarding } = useOnboarding();
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  function setLanguagePreference(nextLanguage: Language): void {
    setLanguage(nextLanguage);
    applyDocumentLanguage(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }

  useEffect(() => {
    const hasPersistedLanguage = Boolean(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));

    if (!hasPersistedLanguage) {
      setLanguagePreference("en");
    }
  }, [setLanguage]);

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
      setError(result.error ?? t("signup.errors.createFailed"));
      return;
    }

    try {
      setError("");
      setIsRedirecting(true);
      await startOnboarding({ displayName: input.displayName, language });
      routerLogger.info("redirect started", { destination: "/onboarding", source: "signup" });
      window.location.replace("/onboarding");
    } catch (error) {
      setIsRedirecting(false);
      signUpLogger.error("onboarding start failed after account creation", error);
      setError(t("signup.errors.onboardingStartFailed"));
    }
  }

  return (
    <OnboardingLayout
      currentStep={0}
      description={t("signup.description")}
      showBack={false}
      showNext={false}
      title={t("signup.title")}
      totalSteps={11}
    >
      <StepAccount error={error} isLoading={isLoading} onSubmit={handleCreateAccount} />
      <p className="auth-page__secondary auth-page__secondary--center">
        {t("signup.haveAccount")}{" "}
        <Link className="auth-page__link" to="/login">
          {t("signup.signIn")}
        </Link>
      </p>
      <div className={`auth-language-switch auth-language-switch--${direction} auth-language-switch--center`}>
        <label className="auth-language-switch__label" htmlFor="signup-language">
          {t("settings.language")}
        </label>
        <select
          className="auth-language-switch__select auth-form__input"
          id="signup-language"
          onChange={(event) => setLanguagePreference(event.target.value === "fa" ? "fa" : "en")}
          value={language}
        >
          <option value="en">{t("language.english")}</option>
          <option value="fa">{t("language.persian")}</option>
        </select>
      </div>
    </OnboardingLayout>
  );
}
