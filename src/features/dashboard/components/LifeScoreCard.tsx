import { LifeOSScore } from "@/features/dashboard/types/dashboard.types";
import { useI18n } from "@/i18n";

interface LifeScoreCardProps {
  score: LifeOSScore;
}

export function LifeScoreCard({ score }: LifeScoreCardProps): JSX.Element {
  const { language, t } = useI18n();
  const numberFormatter = new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US");

  return (
    <section className="dashboard-card dashboard-life-score">
      <div className="dashboard-card__header">
        <div>
          <h2>{t("dashboard.lifeScore")}</h2>
          <p>{getScoreExplanation(score, t)}</p>
        </div>
        <strong>{numberFormatter.format(score.score)}</strong>
      </div>
      <div className="dashboard-life-score__track">
        <div style={{ width: `${score.score}%` }} />
      </div>
      <div className="dashboard-life-score__signals">
        {score.signals.length > 0 ? (
          score.signals.map((signal) => (
            <div key={signal.label}>
              <span>{getSignalLabel(signal.label, t)}</span>
              <strong>{numberFormatter.format(signal.value)}%</strong>
            </div>
          ))
        ) : (
          <p>{t("dashboard.lifeScoreEmpty")}</p>
        )}
      </div>
    </section>
  );
}

function getScoreExplanation(score: LifeOSScore, t: ReturnType<typeof useI18n>["t"]): string {
  if (score.availableSignals === 0) {
    return t("dashboard.scoreActivate");
  }

  const strongestSignal = score.signals.slice().sort((left, right) => right.value - left.value)[0];
  const weakestSignal = score.signals.slice().sort((left, right) => left.value - right.value)[0];

  return t("dashboard.scoreExplanation")
    .replace("{strongest}", getSignalLabel(strongestSignal.label, t))
    .replace("{weakest}", getSignalLabel(weakestSignal.label, t));
}

function getSignalLabel(label: string, t: ReturnType<typeof useI18n>["t"]): string {
  switch (label) {
    case "Task completion":
      return t("dashboard.taskCompletion");
    case "Habit completion":
      return t("dashboard.habitCompletion");
    case "Goal progress":
      return t("dashboard.goalProgress");
    case "Review rhythm":
      return t("dashboard.reviewRhythm");
    case "Budget health":
      return t("dashboard.budgetHealth");
    default:
      return label;
  }
}
