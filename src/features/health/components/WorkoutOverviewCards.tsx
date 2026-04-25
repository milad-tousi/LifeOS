import { CalendarCheck, Clock, Flame, Gauge, History, Trophy } from "lucide-react";
import { Card } from "@/components/common/Card";
import { WorkoutOverviewStats } from "@/features/health/types/health.types";

interface WorkoutOverviewCardsProps {
  stats: WorkoutOverviewStats;
}

export function WorkoutOverviewCards({ stats }: WorkoutOverviewCardsProps): JSX.Element {
  const cards = [
    {
      title: "Today",
      value: stats.todayWorkout ? stats.todayWorkout.title : "No workout",
      status: stats.todayWorkout?.completed ? "Completed" : "Open",
      helper: "Today's saved workout session.",
      icon: <CalendarCheck size={18} />,
      tone: "today",
    },
    {
      title: "Weekly Minutes",
      value: `${stats.weeklyWorkoutMinutes} min`,
      status: "Last 7 days",
      helper: "Completed workout minutes this week.",
      icon: <Clock size={18} />,
      tone: "minutes",
    },
    {
      title: "Weekly Workouts",
      value: stats.weeklyWorkoutCount.toString(),
      status: "Completed",
      helper: "Completed sessions in the last 7 days.",
      icon: <Trophy size={18} />,
      tone: "count",
    },
    {
      title: "Workout Streak",
      value: `${stats.workoutStreak} day${stats.workoutStreak === 1 ? "" : "s"}`,
      status: stats.workoutStreak > 0 ? "Active" : "Not active",
      helper: "Consecutive completed workout days.",
      icon: <Flame size={18} />,
      tone: "streak",
    },
    {
      title: "Latest Workout",
      value: stats.latestWorkout?.title ?? "None yet",
      status: stats.latestWorkout?.workoutType ?? "No log",
      helper: "Most recent saved workout.",
      icon: <History size={18} />,
      tone: "latest",
    },
    {
      title: "Average Effort",
      value: stats.averageEffort > 0 ? `${stats.averageEffort}/10` : "--/10",
      status: `${stats.totalCompletedWorkouts} completed`,
      helper: "Average perceived effort for completed workouts.",
      icon: <Gauge size={18} />,
      tone: "effort",
    },
  ] as const;

  return (
    <div className="health-overview-grid workout-overview-grid">
      {cards.map((card) => (
        <Card key={card.title}>
          <div className={`health-overview-card workout-card workout-card--${card.tone}`}>
            <div className="health-overview-card__top">
              <span className="health-overview-card__icon">{card.icon}</span>
              <span className="health-overview-card__title">{card.title}</span>
            </div>
            <strong className="health-overview-card__value">{card.value}</strong>
            <span className="health-overview-card__status">{card.status}</span>
            <p className="health-overview-card__helper">{card.helper}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
