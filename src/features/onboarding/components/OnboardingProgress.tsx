interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps): JSX.Element {
  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="onboarding-progress">
      <div className="onboarding-progress__meta">
        <span>Step {currentStep + 1}</span>
        <span>{currentStep + 1} / {totalSteps}</span>
      </div>
      <div className="onboarding-progress__track">
        <div className="onboarding-progress__fill" style={{ width: `${progressValue}%` }} />
      </div>
    </div>
  );
}
