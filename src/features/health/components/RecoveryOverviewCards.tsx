import { Activity, AlertCircle, CalendarCheck, Flame, Gauge, Sparkles } from "lucide-react";
import { Card } from "@/components/common/Card";
import { RecoveryOverviewStats } from "@/features/health/types/health.types";

interface RecoveryOverviewCardsProps {
  stats: RecoveryOverviewStats;
}

export function RecoveryOverviewCards({ stats }: RecoveryOverviewCardsProps): JSX.Element {
  const cards = [
    {
      title: "Readiness Score",
      value: stats.readiness ? `${stats.readiness.score}/100` : "--/100",
      status: stats.readiness?.status ?? "No check-in",
      helper: "Based on today's recovery check-in and local training context.",
      icon: <Gauge size={18} />,
      tone: stats.readiness?.status.toLowerCase() ?? "empty",
    },
    {
      title: "Suggested Activity",
      value: stats.suggestedActivity ?? "Check in",
      status: "General wellness guidance",
      helper: "Use this as a planning cue, not a diagnosis.",
      icon: <Activity size={18} />,
      tone: "activity",
    },
    {
      title: "Average 7 Days",
      value: stats.averageReadiness7Days > 0 ? `${stats.averageReadiness7Days}/100` : "--/100",
      status: "Recent trend",
      helper: "Average readiness from recent check-ins.",
      icon: <Sparkles size={18} />,
      tone: "average",
    },
    {
      title: "Recovery Streak",
      value: `${stats.recoveryStreak} day${stats.recoveryStreak === 1 ? "" : "s"}`,
      status: stats.recoveryStreak > 0 ? "Active" : "Start today",
      helper: "Consecutive days with a recovery check-in.",
      icon: <Flame size={18} />,
      tone: "streak",
    },
    {
      title: "Latest Warning",
      value: stats.latestWarning ?? "None",
      status: stats.latestWarning ? "Review" : "Clear",
      helper: "Warnings are simple wellness flags from local data.",
      icon: <AlertCircle size={18} />,
      tone: "warning",
    },
    {
      title: "Today Check-in",
      value: stats.todayCheckIn ? stats.todayCheckIn.restingFeeling : "Missing",
      status: stats.todayCheckIn ? "Saved" : "Not saved",
      helper: "Save today's check-in to update readiness.",
      icon: <CalendarCheck size={18} />,
      tone: "checkin",
    },
  ] as const;

  return (
    <div className="health-overview-grid recovery-overview-grid">
      {cards.map((card) => (
        <Card key={card.title}>
          <div className={`health-overview-card recovery-card recovery-card--${card.tone}`}>
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
