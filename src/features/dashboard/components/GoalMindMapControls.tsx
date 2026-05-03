import { Button } from "@/components/common/Button";
import { GoalCardData } from "@/features/goals/hooks/useGoals";
import { useI18n } from "@/i18n";

interface GoalMindMapControlsProps {
  goals: GoalCardData[];
  onCreateTask: () => void;
  onFitView: () => void;
  onLinkTask: () => void;
  onResetLayout: () => void;
  onSelectGoal: (goalId: string) => void;
  selectedGoalId: string;
}

export function GoalMindMapControls({
  goals,
  onCreateTask,
  onFitView,
  onLinkTask,
  onResetLayout,
  onSelectGoal,
  selectedGoalId,
}: GoalMindMapControlsProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="dashboard-mind-controls">
      <label>
        <span>{t("dashboard.selectGoal")}</span>
        <select onChange={(event) => onSelectGoal(event.target.value)} value={selectedGoalId}>
          <option value="">{t("dashboard.selectGoal")}</option>
          {goals.map((goal) => (
            <option key={goal.goal.id} value={goal.goal.id}>
              {goal.goal.title}
            </option>
          ))}
        </select>
      </label>
      <div className="dashboard-mind-controls__actions">
        <Button disabled={!selectedGoalId} onClick={onLinkTask} type="button" variant="secondary">
          {t("dashboard.linkExistingTask")}
        </Button>
        <Button disabled={!selectedGoalId} onClick={onCreateTask} type="button" variant="secondary">
          {t("dashboard.createNewTask")}
        </Button>
        <Button onClick={onFitView} type="button" variant="ghost">
          {t("dashboard.fitView")}
        </Button>
        <Button onClick={onResetLayout} type="button" variant="ghost">
          {t("dashboard.resetLayout")}
        </Button>
      </div>
    </div>
  );
}
