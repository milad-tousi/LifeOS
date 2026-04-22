import { CalendarDays, Flag, Gauge, NotebookText, Tag, Target } from "lucide-react";
import {
  getGoalNotesPreview,
  getGoalProgressModeHelperText,
  getGoalProgressModeName,
  getGoalTargetSummary,
} from "@/domains/goals/goal.utils";
import { Goal } from "@/domains/goals/types";

interface GoalHeaderProps {
  goal: Goal;
}

export function GoalHeader({ goal }: GoalHeaderProps): JSX.Element {
  const notesPreview = getGoalNotesPreview(goal);
  const targetSummary = getGoalTargetSummary(goal);
  const progressModeName = getGoalProgressModeName(goal);
  const progressHelperText = getGoalProgressModeHelperText(goal);

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

      <div className="goal-detail-header__summary">
        <div className="goal-detail-header__summary-item">
          <span className="goal-detail-header__summary-label">Progress mode</span>
          <span className="goal-detail-header__summary-value">
            <Gauge size={16} />
            {progressModeName}
          </span>
          <p className="goal-detail-header__summary-helper">{progressHelperText}</p>
        </div>
        {targetSummary ? (
          <div className="goal-detail-header__summary-item">
            <span className="goal-detail-header__summary-label">Target</span>
            <span className="goal-detail-header__summary-value">
              <Target size={16} />
              {targetSummary}
            </span>
          </div>
        ) : null}
        {notesPreview ? (
          <div className="goal-detail-header__summary-item goal-detail-header__summary-item--notes">
            <span className="goal-detail-header__summary-label">Notes</span>
            <span className="goal-detail-header__summary-notes">
              <NotebookText size={16} />
              {notesPreview}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
