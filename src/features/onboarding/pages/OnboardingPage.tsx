import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { StepCompletion } from "@/features/onboarding/components/StepCompletion";
import { OnboardingLayout } from "@/features/onboarding/components/OnboardingLayout";
import { StepSingleQuestion } from "@/features/onboarding/components/StepSingleQuestion";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { applyDocumentLanguage, LANGUAGE_STORAGE_KEY, useI18n } from "@/i18n";
import { FIRST_ONBOARDING_STEP_INDEX, ONBOARDING_STEP_IDS } from "@/state/onboarding.store";
import { createLogger } from "@/utils/logger";

const routerLogger = createLogger("router");
const onboardingLogger = createLogger("onboarding");

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const {
    completeOnboarding,
    currentStep,
    draft,
    isLoading,
    isStarted,
    nextStep,
    previousStep,
    restoreOnboarding,
    saveStep,
    skipOnboarding,
  } = useOnboarding();

  useEffect(() => {
    if (!draft) {
      void restoreOnboarding().catch((error) => {
        onboardingLogger.error("initial onboarding restore failed", error);
      });
    }
  }, [draft, restoreOnboarding]);

  useEffect(() => {
    const onboardingLanguage = draft?.profile.language === "fa" ? "fa" : draft?.profile.language === "en" ? "en" : null;

    if (!onboardingLanguage || onboardingLanguage === language) {
      return;
    }

    setLanguage(onboardingLanguage);
    applyDocumentLanguage(onboardingLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, onboardingLanguage);
  }, [draft?.profile.language, language, setLanguage]);

  useEffect(() => {
    if (isLoading || !draft) {
      return;
    }

    if (!isStarted || currentStep < FIRST_ONBOARDING_STEP_INDEX) {
      routerLogger.info("redirect started", {
        destination: "/",
        source: "onboarding-guard",
      });
      navigate("/", { replace: true });
    }
  }, [currentStep, draft, isLoading, isStarted, navigate]);

  if (isLoading || !draft) {
    return <div className="route-loading">{t("onboarding.loading.setup")}</div>;
  }

  if (!isStarted || currentStep < FIRST_ONBOARDING_STEP_INDEX) {
    return <div className="route-loading">{t("onboarding.loading.workspace")}</div>;
  }

  const currentStepId = ONBOARDING_STEP_IDS[currentStep];
  const isCompletionStep = currentStepId === "completion";
  const showSkip = !isCompletionStep && currentStep >= FIRST_ONBOARDING_STEP_INDEX;

  function renderStepContent(): JSX.Element {
    switch (currentStepId) {
      case "focus":
        return (
          <StepSingleQuestion
            control={
              <textarea
                className="auth-form__input onboarding-textarea"
                onChange={(event) =>
                  void saveStep({ profile: { currentFocus: event.target.value } })
                }
                placeholder={t("onboarding.steps.focus.placeholder")}
                value={draft.profile.currentFocus ?? ""}
              />
            }
            description={t("onboarding.steps.focus.description")}
            title={t("onboarding.steps.focus.title")}
          />
        );
      case "work_style":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["fixed", t("onboarding.options.workStyle.fixed")],
                  ["flexible", t("onboarding.options.workStyle.flexible")],
                  ["remote", t("onboarding.options.workStyle.remote")],
                  ["hybrid", t("onboarding.options.workStyle.hybrid")],
                  ["onsite", t("onboarding.options.workStyle.onsite")],
                  ["shift", t("onboarding.options.workStyle.shift")],
                ].map(([value, label]) => (
                  <button
                    className={`onboarding-choice ${
                      draft.profile.workStyle === value ? "onboarding-choice--active" : ""
                    }`}
                    key={value}
                    onClick={() => void saveStep({ profile: { workStyle: value as never } })}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            description={t("onboarding.steps.workStyle.description")}
            title={t("onboarding.steps.workStyle.title")}
          />
        );
      case "wake_time":
        return (
          <StepSingleQuestion
            control={
              <input
                className="auth-form__input"
                onChange={(event) => void saveStep({ profile: { wakeTime: event.target.value } })}
                type="time"
                value={draft.profile.wakeTime ?? ""}
              />
            }
            description={t("onboarding.steps.wakeTime.description")}
            title={t("onboarding.steps.wakeTime.title")}
          />
        );
      case "sleep_time":
        return (
          <StepSingleQuestion
            control={
              <input
                className="auth-form__input"
                onChange={(event) =>
                  void saveStep({ profile: { sleepTime: event.target.value } })
                }
                type="time"
                value={draft.profile.sleepTime ?? ""}
              />
            }
            description={t("onboarding.steps.sleepTime.description")}
            title={t("onboarding.steps.sleepTime.title")}
          />
        );
      case "energy_type":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["early_bird", t("onboarding.options.energyType.early_bird")],
                  ["balanced", t("onboarding.options.energyType.balanced")],
                  ["night_owl", t("onboarding.options.energyType.night_owl")],
                ].map(([value, label]) => (
                  <button
                    className={`onboarding-choice ${
                      draft.profile.energyType === value ? "onboarding-choice--active" : ""
                    }`}
                    key={value}
                    onClick={() => void saveStep({ profile: { energyType: value as never } })}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            description={t("onboarding.steps.energyType.description")}
            title={t("onboarding.steps.energyType.title")}
          />
        );
      case "preferred_pace":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["gentle", t("onboarding.options.preferredPace.gentle")],
                  ["balanced", t("onboarding.options.preferredPace.balanced")],
                  ["ambitious", t("onboarding.options.preferredPace.ambitious")],
                ].map(([value, label]) => (
                  <button
                    className={`onboarding-choice ${
                      draft.profile.preferredPace === value ? "onboarding-choice--active" : ""
                    }`}
                    key={value}
                    onClick={() =>
                      void saveStep({ profile: { preferredPace: value as never } })
                    }
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            description={t("onboarding.steps.preferredPace.description")}
            title={t("onboarding.steps.preferredPace.title")}
          />
        );
      case "reminder_style":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["gentle", t("onboarding.options.reminderStyle.gentle")],
                  ["motivating", t("onboarding.options.reminderStyle.motivating")],
                  ["structured", t("onboarding.options.reminderStyle.structured")],
                  ["minimal", t("onboarding.options.reminderStyle.minimal")],
                ].map(([value, label]) => (
                  <button
                    className={`onboarding-choice ${
                      draft.preferences.reminderStyle === value ? "onboarding-choice--active" : ""
                    }`}
                    key={value}
                    onClick={() =>
                      void saveStep({ preferences: { reminderStyle: value as never } })
                    }
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            description={t("onboarding.steps.reminderStyle.description")}
            title={t("onboarding.steps.reminderStyle.title")}
          />
        );
      case "tone_preference":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["friendly", t("onboarding.options.tonePreference.friendly")],
                  ["coach", t("onboarding.options.tonePreference.coach")],
                  ["calm", t("onboarding.options.tonePreference.calm")],
                  ["direct", t("onboarding.options.tonePreference.direct")],
                ].map(([value, label]) => (
                  <button
                    className={`onboarding-choice ${
                      draft.preferences.tonePreference === value
                        ? "onboarding-choice--active"
                        : ""
                    }`}
                    key={value}
                    onClick={() =>
                      void saveStep({ preferences: { tonePreference: value as never } })
                    }
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            description={t("onboarding.steps.tonePreference.description")}
            title={t("onboarding.steps.tonePreference.title")}
          />
        );
      case "preferred_currency":
        return (
          <StepSingleQuestion
            control={
              <input
                className="auth-form__input onboarding-input--compact"
                onChange={(event) =>
                  void saveStep({ preferences: { preferredCurrency: event.target.value } })
                }
                placeholder={t("onboarding.steps.preferredCurrency.placeholder")}
                value={draft.preferences.preferredCurrency ?? ""}
              />
            }
            description={t("onboarding.steps.preferredCurrency.description")}
            title={t("onboarding.steps.preferredCurrency.title")}
          />
        );
      case "completion":
        return <StepCompletion profile={draft.profile} />;
      default:
        return (
          <StepSingleQuestion
            control={
              <textarea
                className="auth-form__input onboarding-textarea"
                onChange={(event) =>
                  void saveStep({ profile: { currentFocus: event.target.value } })
                }
                placeholder={t("onboarding.steps.default.placeholder")}
                value={draft.profile.currentFocus ?? ""}
              />
            }
            description={t("onboarding.steps.default.description")}
            title={t("onboarding.steps.default.title")}
          />
        );
    }
  }

  async function handleNext(): Promise<void> {
    if (isCompletionStep) {
      await completeOnboarding();
      routerLogger.info("redirect started", {
        destination: "/",
        source: "onboarding-complete",
      });
      navigate("/", { replace: true });
      return;
    }

    await nextStep();
  }

  async function handleSkip(): Promise<void> {
    await skipOnboarding();
    routerLogger.info("redirect started", {
      destination: "/",
      source: "onboarding-skip",
    });
    navigate("/", { replace: true });
  }

  return (
    <OnboardingLayout
      actions={
        showSkip ? (
          <Button onClick={() => void handleSkip()} type="button" variant="ghost">
            {t("onboarding.actions.skip")}
          </Button>
        ) : undefined
      }
      currentStep={currentStep}
      description={t("onboarding.description")}
      nextLabel={isCompletionStep ? t("onboarding.actions.enter") : t("onboarding.actions.next")}
      onBack={() => void previousStep()}
      onNext={() => void handleNext()}
      showBack={currentStep > FIRST_ONBOARDING_STEP_INDEX}
      stepKey={currentStepId}
      title={t("onboarding.title")}
      totalSteps={ONBOARDING_STEP_IDS.length}
    >
      {renderStepContent()}
    </OnboardingLayout>
  );
}
