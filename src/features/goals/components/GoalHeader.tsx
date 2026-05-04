import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Flag, Gauge, NotebookText, Tag, Target } from "lucide-react";
import { computeGoalDeadlineState } from "@/domains/goals/goal-deadline";
import {
  getGoalNotesPreview,
  getGoalProgressModeHelperText,
  getGoalProgressModeName,
  getGoalTargetSummary,
} from "@/domains/goals/goal.utils";
import { Goal } from "@/domains/goals/types";
import { useI18n } from "@/i18n";
import { formatAppDate } from "@/i18n/formatters";

interface GoalHeaderProps {
  goal: Goal;
}

export function GoalHeader({ goal }: GoalHeaderProps): JSX.Element {
  const { language } = useI18n();
  const deadlineState = computeGoalDeadlineState(goal);
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
            {formatGoalDeadline(goal.deadline, language)}
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
        <div
          className={[
            "goal-detail-header__summary-item",
            `goal-detail-header__summary-item--${deadlineState.tone}`,
          ].join(" ")}
        >
          <span className="goal-detail-header__summary-label">Deadline</span>
          <span className="goal-detail-header__summary-value">
            <CalendarDays size={16} />
            {goal.deadline ? formatGoalDeadline(goal.deadline, language) : "No deadline"}
          </span>
          <div className="goal-detail-header__deadline-row">
            <span
              className={[
                "goal-detail-header__deadline-chip",
                `goal-detail-header__deadline-chip--${deadlineState.tone}`,
              ].join(" ")}
            >
              {renderDeadlineIcon(deadlineState.tone)}
              {deadlineState.statusLabel}
            </span>
          </div>
          <p className="goal-detail-header__summary-helper">{deadlineState.helperText}</p>
        </div>
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

function renderDeadlineIcon(
  tone: ReturnType<typeof computeGoalDeadlineState>["tone"],
): JSX.Element {
  switch (tone) {
    case "danger":
    case "warning":
      return <AlertTriangle size={14} />;
    case "success":
      return <CheckCircle2 size={14} />;
    case "info":
      return <Clock3 size={14} />;
    case "neutral":
    default:
      return <CalendarDays size={14} />;
  }
}

function formatGoalDeadline(value: string, language: "en" | "fa"): string {
  const safeDate = new Date(value);
  return Number.isNaN(safeDate.getTime()) ? value : formatAppDate(safeDate, language);
}
