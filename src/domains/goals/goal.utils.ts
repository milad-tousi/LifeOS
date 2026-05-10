import { CreateGoalInput, Goal, GoalProgressType, GoalTargetType } from "@/domains/goals/types";
import { formatNumber } from "@/i18n/formatters";
import { Language, TranslationKey } from "@/i18n/i18n.types";

const DEFAULT_GOAL_TARGET_TYPE: GoalTargetType = "none";
const DEFAULT_GOAL_PROGRESS_TYPE: GoalProgressType = "tasks";

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

function normalizeGoalTargetType(value?: string): GoalTargetType {
  switch (value) {
    case "count":
    case "binary":
    case "milestone":
    case "percentage":
    case "none":
      return value;
    default:
      return DEFAULT_GOAL_TARGET_TYPE;
  }
}

function normalizeGoalProgressType(value?: string): GoalProgressType {
  switch (value) {
    case "subtasks":
    case "manual":
    case "target":
    case "tasks":
      return value;
    default:
      return DEFAULT_GOAL_PROGRESS_TYPE;
  }
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function clampProgress(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  return Math.max(0, Math.min(100, value));
}

export function normalizeGoalInput(input: CreateGoalInput): CreateGoalInput {
  const progressType = normalizeGoalProgressType(input.progressType);
  const targetType =
    progressType === "target"
      ? normalizeGoalTargetType(input.targetType)
      : DEFAULT_GOAL_TARGET_TYPE;
  const targetValue = progressType === "target" ? normalizeNullableNumber(input.targetValue) : null;
  const currentValue =
    progressType === "target" && targetType !== "none"
      ? normalizeNullableNumber(input.currentValue)
      : null;
  const manualProgress =
    progressType === "manual" ? clampProgress(normalizeNullableNumber(input.manualProgress)) : null;

  return {
    ...input,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    progressType,
    targetType,
    targetValue,
    currentValue,
    manualProgress,
    notes: input.notes?.trim() || "",
    deadline: input.deadline || undefined,
  };
}

export function normalizeGoal(goal: Goal): Goal {
  const progressType = normalizeGoalProgressType(goal.progressType);
  const targetType =
    progressType === "target" ? normalizeGoalTargetType(goal.targetType) : DEFAULT_GOAL_TARGET_TYPE;
  const targetValue = progressType === "target" ? normalizeNullableNumber(goal.targetValue) : null;
  const currentValue =
    progressType === "target" && targetType !== "none"
      ? normalizeNullableNumber(goal.currentValue)
      : null;
  const manualProgress =
    progressType === "manual" ? clampProgress(normalizeNullableNumber(goal.manualProgress)) : null;

  return {
    ...goal,
    title: goal.title.trim(),
    description: goal.description?.trim() || undefined,
    targetType,
    targetValue,
    currentValue,
    progressType,
    manualProgress,
    notes: goal.notes?.trim() || "",
    deadline: goal.deadline || undefined,
  };
}

export function getGoalProgressPercentFromMode(goal: Goal): number | null {
  if (goal.progressType === "manual") {
    return clampProgress(goal.manualProgress ?? null);
  }

  if (goal.progressType === "target") {
    if (goal.targetType === "binary") {
      return (goal.currentValue ?? 0) > 0 ? 100 : 0;
    }

    if (!goal.targetValue || goal.targetValue <= 0) {
      return null;
    }

    const currentValue = Math.max(0, goal.currentValue ?? 0);
    return clampProgress(Math.round((currentValue / goal.targetValue) * 100));
  }

  return null;
}

export function getGoalProgressModeName(goal: Goal, t: Translate): string {
  return t(`goals.progressTypes.${goal.progressType}`);
}

export function getGoalProgressModeHelperText(goal: Goal, t: Translate): string {
  switch (goal.progressType) {
    case "subtasks":
      return t("goals.progressModeHelpers.subtasks");
    case "manual":
      return t("goals.progressModeHelpers.manual");
    case "target":
      return t("goals.progressModeHelpers.target");
    case "tasks":
    default:
      return t("goals.progressModeHelpers.tasks");
  }
}

export function getGoalTargetSummary(goal: Goal, t: Translate, language: Language): string | null {
  if (goal.progressType !== "target") {
    return null;
  }

  const currentValue = formatNumber(goal.currentValue ?? 0, language);
  const targetValue = goal.targetValue ? formatNumber(goal.targetValue, language) : null;

  switch (goal.targetType) {
    case "count":
      return targetValue
        ? t("goals.targetSummary.count", { current: currentValue, target: targetValue })
        : null;
    case "binary":
      return t("goals.targetSummary.binary");
    case "milestone":
      return targetValue
        ? t("goals.targetSummary.milestone", { current: currentValue, target: targetValue })
        : t("goals.targetTypes.milestone");
    case "percentage":
      return targetValue
        ? t("goals.targetSummary.percentage", { current: currentValue, target: targetValue })
        : t("goals.targetTypes.percentage");
    case "none":
    default:
      return null;
  }
}

export function getGoalNotesPreview(goal: Goal): string | null {
  if (!goal.notes) {
    return null;
  }

  return goal.notes.length > 140 ? `${goal.notes.slice(0, 140).trim()}...` : goal.notes;
}
