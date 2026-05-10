import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Flag, Gauge, NotebookText, Tag, Target } from "lucide-react";
import { computeGoalDeadlineState } from "@/domains/goals/goal-deadline";
import {
  getGoalNotesPreview,
  getGoalProgressModeHelperText,
  getGoalProgressModeName,
  getGoalTargetSummary,
} from "@/domains/goals/goal.utils";
import { Goal } from "@/domains/goals/types";
import {
  getGoalCategoryDisplayName,
  getGoalPaceDisplayName,
  getGoalPriorityDisplayName,
  getGoalStatusDisplayName,
} from "@/features/goals/utils/goals.i18n";
import { useI18n } from "@/i18n";

interface GoalHeaderProps {
  goal: Goal;
}

export function GoalHeader({ goal }: GoalHeaderProps): JSX.Element {
  const { language, t } = useI18n();
  const deadlineState = computeGoalDeadlineState(goal, t, language);
  const notesPreview = getGoalNotesPreview(goal);
  const targetSummary = getGoalTargetSummary(goal, t, language);
  const progressModeName = getGoalProgressModeName(goal, t);
  const progressHelperText = getGoalProgressModeHelperText(goal, t);

  return (
    <header className="goal-detail-header">
      <div className="goal-detail-header__copy">
        <span className="goal-card__category-pill">{getGoalCategoryDisplayName(goal.category, t)}</span>
        <h2 className="goal-detail-header__title">{goal.title}</h2>
        {goal.description ? (
          <p className="goal-detail-header__description">{goal.description}</p>
        ) : null}
      </div>

      <div className="goal-detail-header__meta">
        <span className="goal-detail-header__meta-item">
          <Tag size={16} />
          {getGoalStatusDisplayName(goal.status, t)}
        </span>
        <span className="goal-detail-header__meta-item">
          <Gauge size={16} />
          {getGoalPaceDisplayName(goal.pace, t)}
        </span>
        <span className="goal-detail-header__meta-item">
          <Flag size={16} />
          {getGoalPriorityDisplayName(goal.priority, t)}
        </span>
        {goal.deadline ? (
          <span className="goal-detail-header__meta-item">
            <CalendarDays size={16} />
            {deadlineState.formattedDeadline}
          </span>
        ) : null}
      </div>

      <div className="goal-detail-header__summary">
        <div className="goal-detail-header__summary-item">
          <span className="goal-detail-header__summary-label">{t("goals.progressMode")}</span>
          <span className="goal-detail-header__summary-value">
            <Gauge size={16} />
            {progressModeName}
          </span>
          <p className="goal-detail-header__summary-helper">{progressHelperText}</p>
        </div>
        {targetSummary ? (
          <div className="goal-detail-header__summary-item">
            <span className="goal-detail-header__summary-label">{t("goals.target")}</span>
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
          <span className="goal-detail-header__summary-label">{t("goals.deadline")}</span>
          <span className="goal-detail-header__summary-value">
            <CalendarDays size={16} />
            {goal.deadline ? deadlineState.formattedDeadline : t("goals.noDeadline")}
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
            <span className="goal-detail-header__summary-label">{t("goals.notes")}</span>
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
