import { formatNumber } from "@/i18n/formatters";
import { Language } from "@/i18n/i18n.types";

interface GoalProgressProps {
  completed: number;
  total: number;
  percent: number;
  large?: boolean;
  language?: Language;
  summaryText?: string;
}

export function GoalProgress({
  completed,
  large = false,
  language = "en",
  percent,
  summaryText,
  total,
}: GoalProgressProps): JSX.Element {
  return (
    <div className={large ? "goal-progress goal-progress--large" : "goal-progress"}>
      <div className="goal-progress__meta">
        <span className="goal-progress__percent">{formatNumber(percent, language)}%</span>
        <span className="goal-progress__text">
          {summaryText ?? (total > 0 ? `${completed} of ${total} tasks completed` : "No steps yet")}
        </span>
      </div>
      <div className="goal-progress__track">
        <div className="goal-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
