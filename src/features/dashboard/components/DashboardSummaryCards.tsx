import { CheckSquare, Flag, PiggyBank, Repeat2, ScrollText } from "lucide-react";
import { DashboardSummary } from "@/features/dashboard/types/dashboard.types";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

interface DashboardSummaryCardsProps {
  currency: FinanceCurrency;
  summary: DashboardSummary;
}

export function DashboardSummaryCards({
  currency,
  summary,
}: DashboardSummaryCardsProps): JSX.Element {
  const { language, t } = useI18n();
  const numberFormatter = new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US");
  const cards = [
    {
      icon: CheckSquare,
      label: t("tasks.title"),
      value: numberFormatter.format(summary.tasks.total),
      details: [
        `${numberFormatter.format(summary.tasks.dueToday)} ${t("dashboard.dueToday")}`,
        `${numberFormatter.format(summary.tasks.overdue)} ${t("dashboard.overdue")}`,
        `${numberFormatter.format(summary.tasks.completedThisWeek)} ${t("dashboard.completedThisWeek")}`,
      ],
    },
    {
      icon: Repeat2,
      label: t("habits.title"),
      value: `${numberFormatter.format(summary.habits.todayCompletionRate)}%`,
      details: [
        `${numberFormatter.format(summary.habits.activeHabits)} ${t("dashboard.activeHabits")}`,
        `${numberFormatter.format(summary.habits.scheduledToday)} ${t("dashboard.scheduledToday")}`,
        `${numberFormatter.format(summary.habits.completedToday)} ${t("dashboard.completedToday")}`,
      ],
    },
    {
      icon: Flag,
      label: t("goals.title"),
      value: `${numberFormatter.format(summary.goals.averageProgress)}%`,
      details: [
        `${numberFormatter.format(summary.goals.activeGoals)} ${t("dashboard.activeGoals")}`,
        `${numberFormatter.format(summary.goals.needingAttention)} ${t("dashboard.needAttention")}`,
        summary.goals.recentlyUpdatedGoal
          ? `${t("dashboard.recent")}: ${summary.goals.recentlyUpdatedGoal}`
          : t("dashboard.noRecentGoalUpdates"),
      ],
    },
    {
      icon: PiggyBank,
      label: t("finance.title"),
      value: formatMoney(summary.finance.netSavingsThisMonth, currency),
      details: [
        `${formatMoney(summary.finance.incomeThisMonth, currency)} ${t("dashboard.income")}`,
        `${formatMoney(summary.finance.expensesThisMonth, currency)} ${t("dashboard.expenses")}`,
        `${numberFormatter.format(summary.finance.budgetWarnings)} ${t("dashboard.budgetWarnings")}`,
      ],
    },
    {
      icon: ScrollText,
      label: t("reviews.title"),
      value: `${numberFormatter.format(summary.reviews.reviewStreak)} ${t("dashboard.reviewStreak")}`,
      details: [
        summary.reviews.dailyReviewCompleted ? t("dashboard.dailyReviewComplete") : t("dashboard.dailyReviewOpen"),
        summary.reviews.weeklyReviewCompleted ? t("dashboard.weeklyReviewComplete") : t("dashboard.weeklyReviewOpen"),
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
