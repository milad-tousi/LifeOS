import { Button } from "@/components/common/Button";
import { GoalCardData } from "@/features/goals/hooks/useGoals";

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
  return (
    <div className="dashboard-mind-controls">
      <label>
        <span>Select Goal</span>
        <select onChange={(event) => onSelectGoal(event.target.value)} value={selectedGoalId}>
          <option value="">Select a Goal</option>
          {goals.map((goal) => (
            <option key={goal.goal.id} value={goal.goal.id}>
              {goal.goal.title}
            </option>
          ))}
        </select>
      </label>
      <div className="dashboard-mind-controls__actions">
        <Button disabled={!selectedGoalId} onClick={onLinkTask} type="button" variant="secondary">
          Link Existing Task
        </Button>
        <Button disabled={!selectedGoalId} onClick={onCreateTask} type="button" variant="secondary">
          Create New Task
        </Button>
        <Button onClick={onFitView} type="button" variant="ghost">
          Fit View
        </Button>
        <Button onClick={onResetLayout} type="button" variant="ghost">
          Reset Layout
        </Button>
      </div>
    </div>
  );
}
