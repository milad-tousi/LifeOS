import { CheckCircle2, CircleDollarSign, Flag, Repeat2 } from "lucide-react";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/i18n/formatters";

export interface ReviewSnapshot {
  goalProgress: number;
  habitCompletionRate: number;
  netFinance: number;
  tasksCompleted: number;
}

interface ReviewSnapshotCardsProps {
  currency: FinanceCurrency;
  snapshot: ReviewSnapshot;
}

export function ReviewSnapshotCards({
  currency,
  snapshot,
}: ReviewSnapshotCardsProps): JSX.Element {
  const { language, t } = useI18n();
  const cards = [
    {
      icon: CheckCircle2,
      label: t("reviews.snapshot.tasksCompleted"),
      value: formatNumber(snapshot.tasksCompleted, language),
      detail: t("reviews.snapshot.tasksCompletedSubtitle"),
      tone: "blue",
    },
    {
      icon: Repeat2,
      label: t("reviews.snapshot.habitCompletionRate"),
      value: `${formatNumber(snapshot.habitCompletionRate, language)}%`,
      detail: t("reviews.snapshot.habitCompletionRateSubtitle"),
      tone: "green",
    },
    {
      icon: Flag,
      label: t("reviews.snapshot.goalProgress"),
      value: `${formatNumber(snapshot.goalProgress, language)}%`,
      detail: t("reviews.snapshot.goalProgressSubtitle"),
      tone: "violet",
    },
    {
      icon: CircleDollarSign,
      label: t("reviews.snapshot.netFinance"),
      value: formatMoney(snapshot.netFinance, currency),
      detail: t("reviews.snapshot.netFinanceSubtitle"),
      tone: snapshot.netFinance >= 0 ? "green" : "red",
    },
  ] as const;

  return (
    <section className="review-snapshot-grid" aria-label={t("reviews.snapshot.ariaLabel")}>
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article className={`review-snapshot-card review-snapshot-card--${card.tone}`} key={card.label}>
            <div className="review-snapshot-card__icon">
              <Icon size={18} />
            </div>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
