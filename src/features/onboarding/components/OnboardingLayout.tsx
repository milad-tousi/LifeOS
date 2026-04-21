import { PropsWithChildren, ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { OnboardingProgress } from "@/features/onboarding/components/OnboardingProgress";

interface OnboardingLayoutProps extends PropsWithChildren {
  actions?: ReactNode;
  currentStep: number;
  description: string;
  stepKey?: string;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  onBack?: () => void;
  onNext?: () => void;
  title: string;
  totalSteps: number;
}

export function OnboardingLayout({
  actions,
  children,
  currentStep,
  description,
  nextLabel = "Next",
  onBack,
  onNext,
  stepKey,
  showBack = true,
  showNext = true,
  title,
  totalSteps,
}: OnboardingLayoutProps): JSX.Element {
  return (
    <div className="onboarding-page">
      <Card title="LifeOS" subtitle="Personal setup">
        <div className="onboarding-layout">
          <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />
          <div className="onboarding-layout__header">
            <h1 className="onboarding-layout__title">{title}</h1>
            <p className="onboarding-layout__description">{description}</p>
          </div>
          <div className="onboarding-layout__body" key={stepKey}>
            {children}
          </div>
          <div className="onboarding-layout__actions">
            {showBack ? (
              <Button onClick={onBack} type="button" variant="secondary">
                Back
              </Button>
            ) : (
              <span />
            )}
            <div className="onboarding-layout__actions-right">
              {actions}
              {showNext ? (
                <Button onClick={onNext} type="button">
                  {nextLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
