import { Check, Flame, Minus, Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Habit, HabitLog } from "@/domains/habits/types";
import { calculateHabitCompletion } from "@/features/habits/services/habits.storage";
import { calculateSimpleStreak } from "@/features/habits/utils/habit.utils";
import { HabitProgressBar } from "@/features/habits/components/HabitProgressBar";

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  todayLog?: HabitLog;
  onUpdateLog: (habitId: string, value: number) => void;
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

  return unit.toLowerCase() === "minutes" ? "min" : unit;
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
  habit,
  logs,
  onUpdateLog,
  todayLog,
}: HabitCardProps): JSX.Element {
  const currentValue = todayLog?.value ?? 0;
  const isCompleted = calculateHabitCompletion(habit, todayLog);
  const target = habit.type === "binary" ? 1 : habit.target;
  const progressPercent = target <= 0 ? 0 : Math.min(100, Math.round((currentValue / target) * 100));
  const progressTone = getProgressTone(progressPercent, isCompleted);
  const streak = calculateSimpleStreak(habit, logs);
  const step = habit.type === "duration" ? 5 : 1;

  return (
    <article className={`today-habit-card${isCompleted ? " today-habit-card--done" : ""}`}>
      <div className="today-habit-card__content">
        <div className="today-habit-card__topline">
          <div className="today-habit-card__title-group">
            <div className="today-habit-card__title-row">
              <h3>{habit.title}</h3>
              {isCompleted ? (
                <span className="habit-complete-mark" aria-label="Completed">
                  <Check size={14} />
                </span>
              ) : null}
            </div>
            <div className="habit-badge-row">
              <span className="habit-badge">{habit.category || "General"}</span>
              <span className="habit-badge habit-badge--soft">{formatFrequency(habit)}</span>
              <span className="habit-streak">
                <Flame size={13} aria-hidden="true" />
                {streak} day streak
              </span>
            </div>
          </div>
          <p className="today-habit-card__progress">{getValueLabel(habit, currentValue)}</p>
        </div>

        <HabitProgressBar percent={isCompleted ? 100 : progressPercent} tone={progressTone} />
      </div>

      {habit.type === "binary" ? (
        <Button
          className="habit-toggle-button"
          variant={isCompleted ? "secondary" : "primary"}
          onClick={() => onUpdateLog(habit.id, isCompleted ? 0 : 1)}
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
            onClick={() => onUpdateLog(habit.id, currentValue - step)}
          >
            <Minus size={16} />
          </button>
          <span aria-live="polite">{currentValue}</span>
          <button
            type="button"
            aria-label={`Increase ${habit.title}`}
            onClick={() => onUpdateLog(habit.id, currentValue + step)}
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </article>
  );
}
