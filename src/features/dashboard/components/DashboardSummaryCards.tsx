import { CheckSquare, Flag, PiggyBank, Repeat2, ScrollText } from "lucide-react";
import { DashboardSummary } from "@/features/dashboard/types/dashboard.types";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface DashboardSummaryCardsProps {
  currency: FinanceCurrency;
  summary: DashboardSummary;
}

export function DashboardSummaryCards({
  currency,
  summary,
}: DashboardSummaryCardsProps): JSX.Element {
  const cards = [
    {
      icon: CheckSquare,
      label: "Tasks",
      value: String(summary.tasks.total),
      details: [
        `${summary.tasks.dueToday} due today`,
        `${summary.tasks.overdue} overdue`,
        `${summary.tasks.completedThisWeek} completed this week`,
      ],
    },
    {
      icon: Repeat2,
      label: "Habits",
      value: `${summary.habits.todayCompletionRate}%`,
      details: [
        `${summary.habits.activeHabits} active habits`,
        `${summary.habits.scheduledToday} scheduled today`,
        `${summary.habits.completedToday} completed today`,
      ],
    },
    {
      icon: Flag,
      label: "Goals",
      value: `${summary.goals.averageProgress}%`,
      details: [
        `${summary.goals.activeGoals} active goals`,
        `${summary.goals.needingAttention} need attention`,
        summary.goals.recentlyUpdatedGoal
          ? `Recent: ${summary.goals.recentlyUpdatedGoal}`
          : "No recent goal updates",
      ],
    },
    {
      icon: PiggyBank,
      label: "Finance",
      value: formatMoney(summary.finance.netSavingsThisMonth, currency),
      details: [
        `${formatMoney(summary.finance.incomeThisMonth, currency)} income`,
        `${formatMoney(summary.finance.expensesThisMonth, currency)} expenses`,
        `${summary.finance.budgetWarnings} budget warnings`,
      ],
    },
    {
      icon: ScrollText,
      label: "Reviews",
      value: `${summary.reviews.reviewStreak}d streak`,
      details: [
        summary.reviews.dailyReviewCompleted ? "Daily review complete" : "Daily review open",
        summary.reviews.weeklyReviewCompleted ? "Weekly review complete" : "Weekly review open",
      ],
    },
  ] as const;

  return (
    <section className="dashboard-summary-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article className="dashboard-card dashboard-summary-card" key={card.label}>
            <div className="dashboard-summary-card__top">
              <span className="dashboard-summary-card__icon">
                <Icon size={18} />
              </span>
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            </div>
            <div className="dashboard-summary-card__details">
              {card.details.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
