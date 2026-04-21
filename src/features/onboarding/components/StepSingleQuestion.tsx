import { ReactNode } from "react";

interface StepSingleQuestionProps {
  title: string;
  description: string;
  control: ReactNode;
}

export function StepSingleQuestion({
  control,
  description,
  title,
}: StepSingleQuestionProps): JSX.Element {
  return (
    <section className="onboarding-question">
      <div className="onboarding-question__copy">
        <h2 className="onboarding-question__title">{title}</h2>
        <p className="onboarding-question__description">{description}</p>
      </div>
      <div className="onboarding-question__control">{control}</div>
    </section>
  );
}
