import { CalendarDays, Flag, Gauge, Tag } from "lucide-react";
import { Goal } from "@/domains/goals/types";

interface GoalHeaderProps {
  goal: Goal;
}

export function GoalHeader({ goal }: GoalHeaderProps): JSX.Element {
  return (
    <header className="goal-detail-header">
      <div className="goal-detail-header__copy">
        <span className="goal-card__category-pill">{goal.category}</span>
        <h2 className="goal-detail-header__title">{goal.title}</h2>
        {goal.description ? (
          <p className="goal-detail-header__description">{goal.description}</p>
        ) : null}
      </div>

      <div className="goal-detail-header__meta">
        <span className="goal-detail-header__meta-item">
          <Tag size={16} />
          {goal.status}
        </span>
        <span className="goal-detail-header__meta-item">
          <Gauge size={16} />
          {goal.pace}
        </span>
        <span className="goal-detail-header__meta-item">
          <Flag size={16} />
          {goal.priority}
        </span>
        {goal.deadline ? (
          <span className="goal-detail-header__meta-item">
            <CalendarDays size={16} />
            {goal.deadline}
          </span>
        ) : null}
      </div>
    </header>
  );
}
