import { OnboardingStoreState, useOnboardingStore } from "@/state/onboarding.store";

export function useOnboarding() {
  const currentStep = useOnboardingStore((state: OnboardingStoreState) => state.currentStep);
  const draft = useOnboardingStore((state: OnboardingStoreState) => state.draft);
  const isStarted = useOnboardingStore((state: OnboardingStoreState) => state.isStarted);
  const isCompleted = useOnboardingStore((state: OnboardingStoreState) => state.isCompleted);
  const isSkipped = useOnboardingStore((state: OnboardingStoreState) => state.isSkipped);
  const isLoading = useOnboardingStore((state: OnboardingStoreState) => state.isLoading);
  const startOnboarding = useOnboardingStore(
    (state: OnboardingStoreState) => state.startOnboarding,
  );
  const nextStep = useOnboardingStore((state: OnboardingStoreState) => state.nextStep);
  const previousStep = useOnboardingStore((state: OnboardingStoreState) => state.previousStep);
  const saveStep = useOnboardingStore((state: OnboardingStoreState) => state.saveStep);
  const completeOnboarding = useOnboardingStore(
    (state: OnboardingStoreState) => state.completeOnboarding,
  );
  const skipOnboarding = useOnboardingStore(
    (state: OnboardingStoreState) => state.skipOnboarding,
  );
  const restoreOnboarding = useOnboardingStore(
    (state: OnboardingStoreState) => state.restoreOnboarding,
  );
  const resetOnboarding = useOnboardingStore(
    (state: OnboardingStoreState) => state.resetOnboarding,
  );

  return {
    currentStep,
    draft,
    isStarted,
    isCompleted,
    isSkipped,
    isLoading,
    startOnboarding,
    nextStep,
    previousStep,
    saveStep,
    completeOnboarding,
    skipOnboarding,
    restoreOnboarding,
    resetOnboarding,
  };
}
