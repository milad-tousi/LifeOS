import { useI18n } from "@/i18n";
import { formatNumber } from "@/i18n/formatters";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps): JSX.Element {
  const { language, t } = useI18n();
  const progressValue = ((currentStep + 1) / totalSteps) * 100;
  const current = formatNumber(currentStep + 1, language);
  const total = formatNumber(totalSteps, language);

  return (
    <div className="onboarding-progress">
      <div className="onboarding-progress__meta">
        <span>{t("onboarding.progress.step", { step: current })}</span>
        <span>{current} / {total}</span>
      </div>
      <div className="onboarding-progress__track">
        <div className="onboarding-progress__fill" style={{ width: `${progressValue}%` }} />
      </div>
    </div>
  );
}
