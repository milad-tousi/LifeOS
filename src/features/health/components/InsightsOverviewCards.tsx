import { AlertTriangle, BarChart3, Lightbulb, Sparkles, Target, ThumbsUp } from "lucide-react";
import { Card } from "@/components/common/Card";
import { HealthInsightOverviewStats } from "@/features/health/types/health.types";

interface InsightsOverviewCardsProps {
  stats: HealthInsightOverviewStats;
}

export function InsightsOverviewCards({ stats }: InsightsOverviewCardsProps): JSX.Element {
  const cards = [
    {
      title: "Total Insights",
      value: stats.totalInsights.toString(),
      status: "Generated locally",
      helper: "Rule-based insights from your recent data.",
      icon: <Lightbulb size={18} />,
      tone: "total",
    },
    {
      title: "Positive Patterns",
      value: stats.positivePatterns.toString(),
      status: "Momentum",
      helper: "Signals that look supportive.",
      icon: <ThumbsUp size={18} />,
      tone: "positive",
    },
    {
      title: "Warning Patterns",
      value: stats.warningPatterns.toString(),
      status: "Review gently",
      helper: "Wellness flags, not medical alerts.",
      icon: <AlertTriangle size={18} />,
      tone: "warning",
    },
    {
      title: "Weekly Focus",
      value: stats.weeklyFocus,
      status: "Priority cue",
      helper: "One practical area for the week.",
      icon: <Target size={18} />,
      tone: "focus",
    },
    {
      title: "Data Coverage",
      value: `${stats.dataCoverageScore}/100`,
      status: "Last 14 days",
      helper: "More coverage makes patterns more useful.",
      icon: <BarChart3 size={18} />,
      tone: "coverage",
    },
    {
      title: "Best Pattern",
      value: stats.bestPattern,
      status: "Current highlight",
      helper: "The strongest supportive signal available.",
      icon: <Sparkles size={18} />,
      tone: "best",
    },
  ] as const;

  return (
    <div className="health-overview-grid insights-overview-grid">
      {cards.map((card) => (
        <Card key={card.title}>
          <div className={`health-overview-card insight-card insight-card--${card.tone}`}>
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
