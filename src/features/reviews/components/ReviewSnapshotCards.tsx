import { CheckCircle2, CircleDollarSign, Flag, Repeat2 } from "lucide-react";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";

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
  const cards = [
    {
      icon: CheckCircle2,
      label: "Tasks Completed",
      value: String(snapshot.tasksCompleted),
      detail: "Finished in this period",
      tone: "blue",
    },
    {
      icon: Repeat2,
      label: "Habit Completion Rate",
      value: `${snapshot.habitCompletionRate}%`,
      detail: "Scheduled habits completed",
      tone: "green",
    },
    {
      icon: Flag,
      label: "Goal Progress",
      value: `${snapshot.goalProgress}%`,
      detail: "Average active goal progress",
      tone: "violet",
    },
    {
      icon: CircleDollarSign,
      label: "Net Finance This Period",
      value: formatMoney(snapshot.netFinance, currency),
      detail: "Income minus expenses",
      tone: snapshot.netFinance >= 0 ? "green" : "red",
    },
  ] as const;

  return (
    <section className="review-snapshot-grid" aria-label="Progress snapshot">
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
