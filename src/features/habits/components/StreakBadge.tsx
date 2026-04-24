interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps): JSX.Element {
  return (
    <span className={`habit-streak${streak === 0 ? " habit-streak--empty" : ""}`}>
      {streak > 0 ? `🔥 ${streak} ${streak === 1 ? "day" : "days"}` : "Start streak"}
    </span>
  );
}
