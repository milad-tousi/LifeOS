import { LifeOSScore } from "@/features/dashboard/types/dashboard.types";
import { useI18n } from "@/i18n";

interface LifeScoreCardProps {
  score: LifeOSScore;
}

export function LifeScoreCard({ score }: LifeScoreCardProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="dashboard-card dashboard-life-score">
      <div className="dashboard-card__header">
        <div>
          <h2>{t("dashboard.lifeScore")}</h2>
          <p>{score.explanation}</p>
        </div>
        <strong>{score.score}</strong>
      </div>
      <div className="dashboard-life-score__track">
        <div style={{ width: `${score.score}%` }} />
      </div>
      <div className="dashboard-life-score__signals">
        {score.signals.length > 0 ? (
          score.signals.map((signal) => (
            <div key={signal.label}>
              <span>{signal.label}</span>
              <strong>{signal.value}%</strong>
            </div>
          ))
        ) : (
          <p>{t("dashboard.lifeScoreEmpty")}</p>
        )}
      </div>
    </section>
  );
}
