import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { StepCompletion } from "@/features/onboarding/components/StepCompletion";
import { OnboardingLayout } from "@/features/onboarding/components/OnboardingLayout";
import { StepSingleQuestion } from "@/features/onboarding/components/StepSingleQuestion";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { FIRST_ONBOARDING_STEP_INDEX, ONBOARDING_STEP_IDS } from "@/state/onboarding.store";
import { createLogger } from "@/utils/logger";

const routerLogger = createLogger("router");
const onboardingLogger = createLogger("onboarding");

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate();
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
    return <div className="route-loading">Loading setup...</div>;
  }

  if (!isStarted || currentStep < FIRST_ONBOARDING_STEP_INDEX) {
    return <div className="route-loading">Preparing your workspace...</div>;
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
                placeholder="What matters most in this season?"
                value={draft.profile.currentFocus ?? ""}
              />
            }
            description="This helps future goals, dashboard summaries, and assistant-like prompts stay relevant."
            title="What is your current focus?"
          />
        );
      case "work_style":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["fixed", "Fixed"],
                  ["flexible", "Flexible"],
                  ["remote", "Remote"],
                  ["hybrid", "Hybrid"],
                  ["onsite", "On-site"],
                  ["shift", "Shift"],
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
            description="A light work-style signal helps planning surfaces feel more realistic."
            title="Which work style fits your week best?"
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
            description="Wake time helps future reminders arrive when they feel natural."
            title="When do you usually wake up?"
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
            description="This keeps evening planning calm and avoids late nudges later on."
            title="When do you usually wind down for sleep?"
          />
        );
      case "energy_type":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["early_bird", "Early bird"],
                  ["balanced", "Balanced"],
                  ["night_owl", "Night owl"],
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
            description="A small energy preference gives LifeOS better context for future routines."
            title="How does your energy usually feel?"
          />
        );
      case "preferred_pace":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["gentle", "Gentle"],
                  ["balanced", "Balanced"],
                  ["ambitious", "Ambitious"],
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
            description="Pace helps future planning stay supportive instead of overwhelming."
            title="What pace feels best for your goals?"
          />
        );
      case "reminder_style":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["gentle", "Gentle"],
                  ["motivating", "Motivating"],
                  ["structured", "Structured"],
                  ["minimal", "Minimal"],
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
            description="Reminder style keeps future nudges aligned with how you like to be approached."
            title="How should reminders feel?"
          />
        );
      case "tone_preference":
        return (
          <StepSingleQuestion
            control={
              <div className="onboarding-choice-grid onboarding-choice-grid--triple">
                {[
                  ["friendly", "Friendly"],
                  ["coach", "Coach"],
                  ["calm", "Calm"],
                  ["direct", "Direct"],
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
            description="This will shape future copy in a way that feels more personal and human."
            title="What tone should LifeOS use with you?"
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
                placeholder="USD"
                value={draft.preferences.preferredCurrency ?? ""}
              />
            }
            description="A preferred currency keeps finance summaries ready when you need them."
            title="Which currency should LifeOS use by default?"
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
                placeholder="Share what matters most right now"
                value={draft.profile.currentFocus ?? ""}
              />
            }
            description="A little context now helps the rest of LifeOS feel more supportive."
            title="What is your current focus?"
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
            Skip for now
          </Button>
        ) : undefined
      }
      currentStep={currentStep}
      description="Each step is short, optional, and saved locally on this device."
      nextLabel={isCompletionStep ? "Enter LifeOS" : "Next"}
      onBack={() => void previousStep()}
      onNext={() => void handleNext()}
      showBack={currentStep > FIRST_ONBOARDING_STEP_INDEX}
      stepKey={currentStepId}
      title="Personalize your LifeOS"
      totalSteps={ONBOARDING_STEP_IDS.length}
    >
      {renderStepContent()}
    </OnboardingLayout>
  );
}
