import { Activity, Check, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Goal } from "@/domains/goals/types";
import { Habit, HabitLog } from "@/domains/habits/types";
import { HabitCategory } from "@/features/habits/services/habit-categories.storage";
import { calculateHabitCompletion } from "@/features/habits/services/habits.storage";
import { calculateCurrentStreak } from "@/features/habits/utils/habit.utils";
import { HabitProgressBar } from "@/features/habits/components/HabitProgressBar";
import { StreakBadge } from "@/features/habits/components/StreakBadge";

interface HabitCardProps {
  categories: HabitCategory[];
  goals: Goal[];
  habit: Habit;
  logs: HabitLog[];
  todayLog?: HabitLog;
  onArchiveHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onOpenHabit: (habit: Habit) => void;
  onUpdateLog: (habitId: string, value: number) => void;
}

function getHabitCategoryName(habit: Habit, categories: HabitCategory[]): string {
  if (!habit.category) {
    return "Uncategorized";
  }

  return (
    categories.find((category) => category.id === habit.category || category.name === habit.category)?.name ??
    "Uncategorized"
  );
}

function getLinkedGoalTitle(habit: Habit, goals: Goal[]): string | null {
  if (!habit.goalId) {
    return null;
  }

  return goals.find((goal) => goal.id === habit.goalId)?.title ?? "Not found";
}

function formatFrequency(habit: Habit): string {
  if (habit.frequency !== "custom") {
    return habit.frequency;
  }

  return "custom";
}

function formatUnit(unit?: string): string {
  if (!unit) {
    return "";
  }

  if (unit.toLowerCase() === "minutes") {
    return "min";
  }

  if (unit.toLowerCase() === "hour") {
    return "hr";
  }

  return unit;
}

function getProgressTone(percent: number, isCompleted: boolean): "gray" | "blue" | "green" {
  if (isCompleted || percent >= 80) {
    return "green";
  }

  if (percent >= 40) {
    return "blue";
  }

  return "gray";
}

function getValueLabel(habit: Habit, value: number): string {
  if (habit.type === "binary") {
    return value >= 1 ? "Completed" : "Not completed";
  }

  const unit = formatUnit(habit.unit);

  return `${value} of ${habit.target}${unit ? ` ${unit}` : ""}`;
}

export function HabitCard({
  categories,
  goals,
  habit,
  logs,
  onArchiveHabit,
  onEditHabit,
  onOpenHabit,
  onUpdateLog,
  todayLog,
}: HabitCardProps): JSX.Element {
  const currentValue = todayLog?.value ?? 0;
  const isCompleted = calculateHabitCompletion(habit, todayLog);
  const target = habit.type === "binary" ? 1 : habit.target;
  const progressPercent = target <= 0 ? 0 : Math.min(100, Math.round((currentValue / target) * 100));
  const progressTone = getProgressTone(progressPercent, isCompleted);
  const streak = calculateCurrentStreak(habit, logs);
  const step = habit.type === "duration" && habit.unit !== "hour" ? 5 : 1;
  const categoryName = getHabitCategoryName(habit, categories);
  const linkedGoalTitle = getLinkedGoalTitle(habit, goals);

  return (
    <article
      className={`today-habit-card${isCompleted ? " today-habit-card--done" : ""}`}
      onClick={() => onOpenHabit(habit)}
    >
      <div className="today-habit-card__icon" aria-hidden="true">
        <Activity size={30} />
      </div>

      <div className="today-habit-card__body">
        <div className="today-habit-card__content">
          <div className="today-habit-card__topline">
            <div className="today-habit-card__title-row">
              <h3>{habit.title}</h3>
              {isCompleted ? (
                <span className="habit-complete-mark" aria-label="Completed">
                  <Check size={14} />
                </span>
              ) : null}
            </div>
            <p className="today-habit-card__progress">{getValueLabel(habit, currentValue)}</p>
          </div>

          {habit.description ? (
            <p className="today-habit-card__description">{habit.description}</p>
          ) : null}

          <div className="habit-badge-row">
            <span className="habit-badge">{categoryName}</span>
            <span className="habit-badge habit-badge--soft">{formatFrequency(habit)}</span>
            {linkedGoalTitle ? (
              <span className="habit-badge habit-badge--goal">Goal: {linkedGoalTitle}</span>
            ) : null}
            <StreakBadge streak={streak} />
            {isCompleted ? <span className="habit-completed-label">Completed today</span> : null}
          </div>

          <HabitProgressBar percent={isCompleted ? 100 : progressPercent} tone={progressTone} />
        </div>

        <div className="today-habit-card__footer">
          <button
            className="habit-text-action"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEditHabit(habit);
            }}
          >
            <Pencil size={16} />
            Edit
          </button>
          <button
            className="habit-text-action"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onArchiveHabit(habit.id);
            }}
          >
            <Trash2 size={16} />
            Remove
          </button>
        </div>
      </div>

      <div className="today-habit-card__actions">
        {habit.type === "binary" ? (
          <Button
            className="habit-toggle-button"
            variant={isCompleted ? "secondary" : "primary"}
            onClick={(event) => {
              event.stopPropagation();
              onUpdateLog(habit.id, isCompleted ? 0 : 1);
            }}
            aria-label={`${isCompleted ? "Undo completed" : "Mark done"} ${habit.title}`}
          >
            {isCompleted ? "Completed" : "Mark Done"}
            {isCompleted ? <Check size={16} /> : null}
          </Button>
        ) : (
          <div
            className={`habit-value-stepper${isCompleted ? " habit-value-stepper--done" : ""}`}
            aria-label={`${habit.title} value controls`}
          >
            <button
            type="button"
            aria-label={`Decrease ${habit.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onUpdateLog(habit.id, currentValue - step);
            }}
            >
              <Minus size={16} />
            </button>
            <span aria-live="polite">{currentValue}</span>
            <button
            type="button"
            aria-label={`Increase ${habit.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onUpdateLog(habit.id, currentValue + step);
            }}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
