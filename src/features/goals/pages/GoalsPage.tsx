import { useNavigate } from "react-router-dom";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { GoalCard } from "@/features/goals/components/GoalCard";
import { GoalCarousel } from "@/features/goals/components/GoalCarousel";
import { GoalCreateButton } from "@/features/goals/components/GoalCreateButton";
import { GoalEmptyState } from "@/features/goals/components/GoalEmptyState";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useI18n } from "@/i18n";

export function GoalsPage(): JSX.Element {
  const navigate = useNavigate();
  const { goals, loading } = useGoals();
  const { t } = useI18n();

  function openGoal(goalId: string): void {
    navigate(`/goals/${goalId}`);
  }

  function openCreateGoal(): void {
    navigate("/goals/new");
  }

  return (
    <div className="goals-page">
      <div className="goals-page__header">
        <ScreenHeader
          description={t("goals.subtitle")}
          title={t("goals.title")}
        />
        <div className="goals-page__desktop-action">
          <GoalCreateButton onClick={openCreateGoal} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted">{t("goals.loading")}</p>
      ) : goals.length === 0 ? (
        <GoalEmptyState onCreate={openCreateGoal} />
      ) : (
        <>
          <div className="goals-page__desktop-grid">
            {goals.map((goalData) => (
              <GoalCard
                data={goalData}
                key={goalData.goal.id}
                onClick={() => openGoal(goalData.goal.id)}
              />
            ))}
          </div>

          <div className="goals-page__mobile-carousel">
            <GoalCarousel goals={goals} onOpenGoal={openGoal} />
          </div>
        </>
      )}

      <div className="goals-page__mobile-action">
        <GoalCreateButton compact onClick={openCreateGoal} />
      </div>
    </div>
  );
}
