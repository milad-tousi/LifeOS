interface HabitProgressBarProps {
  percent: number;
  tone: "gray" | "blue" | "green";
}

export function HabitProgressBar({ percent, tone }: HabitProgressBarProps): JSX.Element {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div
      aria-label={`${safePercent}% complete`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={safePercent}
      className="habit-progress-bar"
      role="progressbar"
    >
      <span
        className={`habit-progress-bar__fill habit-progress-bar__fill--${tone}`}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
}
