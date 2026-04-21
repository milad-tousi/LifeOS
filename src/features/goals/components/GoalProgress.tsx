interface GoalProgressProps {
  completed: number;
  total: number;
  percent: number;
  large?: boolean;
}

export function GoalProgress({
  completed,
  large = false,
  percent,
  total,
}: GoalProgressProps): JSX.Element {
  return (
    <div className={large ? "goal-progress goal-progress--large" : "goal-progress"}>
      <div className="goal-progress__meta">
        <span className="goal-progress__percent">{percent}%</span>
        <span className="goal-progress__text">
          {total > 0 ? `${completed} of ${total} tasks completed` : "No steps yet"}
        </span>
      </div>
      <div className="goal-progress__track">
        <div className="goal-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
