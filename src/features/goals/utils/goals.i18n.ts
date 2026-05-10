import { GoalProgressSnapshot } from "@/domains/goals/goal-progress";
import { Goal, GoalCategory, GoalPace, GoalPriority, GoalProgressType, GoalStatus, GoalTargetType } from "@/domains/goals/types";
import { formatNumber } from "@/i18n/formatters";
import { Language, TranslationKey } from "@/i18n/i18n.types";

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

export function getGoalCategoryDisplayName(category: GoalCategory, t: Translate): string {
  return t(`goals.categories.${category}`);
}

export function getGoalStatusDisplayName(status: GoalStatus, t: Translate): string {
  return t(`goals.statuses.${status}`);
}

export function getGoalPaceDisplayName(pace: GoalPace, t: Translate): string {
  return t(`goals.paces.${pace}`);
}

export function getGoalPriorityDisplayName(priority: GoalPriority, t: Translate): string {
  return t(`goals.priorities.${priority}`);
}

export function getGoalProgressTypeDisplayName(progressType: GoalProgressType, t: Translate): string {
  return t(`goals.progressTypes.${progressType}`);
}

export function getGoalTargetTypeDisplayName(targetType: GoalTargetType, t: Translate): string {
  return t(`goals.targetTypes.${targetType}`);
}

export function formatGoalProgressSummary(
  goal: Goal,
  progress: GoalProgressSnapshot,
  t: Translate,
  language: Language,
): string {
  if (progress.total <= 0 && goal.progressType !== "manual") {
    return t("goals.noStepsYet");
  }

  const completed = formatNumber(progress.completed, language);
  const total = formatNumber(progress.total, language);
  const percent = formatNumber(progress.percentage, language);

  switch (goal.progressType) {
    case "manual":
      return t("goals.progressSummary.manual", { percent });
    case "target":
      return t("goals.progressSummary.target", { completed, total });
    case "subtasks":
      return t("goals.progressSummary.subtasks", { completed, total });
    case "tasks":
    default:
      return t("goals.progressSummary.tasks", { completed, total });
  }
}
