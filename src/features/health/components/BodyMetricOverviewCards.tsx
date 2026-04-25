import { Activity, ListChecks, Percent, Ruler, Scale, ShieldCheck } from "lucide-react";
import { Card } from "@/components/common/Card";
import { BodyMetricOverviewStats } from "@/features/health/types/health.types";

interface BodyMetricOverviewCardsProps {
  stats: BodyMetricOverviewStats;
}

export function BodyMetricOverviewCards({
  stats,
}: BodyMetricOverviewCardsProps): JSX.Element {
  const cards = [
    {
      title: "Weight",
      value: formatNullable(stats.latestWeightKg, "kg"),
      status: formatChange(stats.weightChangeFromPrevious, "kg"),
      helper: "Latest saved body weight.",
      icon: <Scale size={18} />,
      tone: "weight",
    },
    {
      title: "BMI",
      value: stats.latestBmi === null ? "--" : stats.latestBmi.toString(),
      status: stats.latestBmiStatus,
      helper: "General wellness category, not a medical diagnosis.",
      icon: <ShieldCheck size={18} />,
      tone: "bmi",
    },
    {
      title: "Body Fat",
      value: formatNullable(stats.latestBodyFatPercent, "%"),
      status: formatChange(stats.bodyFatChangeFromPrevious, "%"),
      helper: "Latest body composition estimate.",
      icon: <Percent size={18} />,
      tone: "body-fat",
    },
    {
      title: "Muscle Mass",
      value: formatNullable(stats.latestMuscleMassKg, "kg"),
      status: stats.latestMuscleMassKg === null ? "No data yet" : "Latest logged",
      helper: "Track changes alongside training and nutrition.",
      icon: <Activity size={18} />,
      tone: "muscle",
    },
    {
      title: "Waist",
      value: formatNullable(stats.latestWaistCm, "cm"),
      status: formatChange(stats.waistChangeFromPrevious, "cm"),
      helper: "Latest waist measurement.",
      icon: <Ruler size={18} />,
      tone: "waist",
    },
    {
      title: "Entries",
      value: stats.totalEntries.toString(),
      status: stats.totalEntries === 1 ? "1 log" : `${stats.totalEntries} logs`,
      helper: "Total local body metric entries.",
      icon: <ListChecks size={18} />,
      tone: "entries",
    },
  ] as const;

  return (
    <div className="health-overview-grid body-metric-overview-grid">
      {cards.map((card) => (
        <Card key={card.title}>
          <div className={`health-overview-card body-metric-card body-metric-card--${card.tone}`}>
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

function formatNullable(value: number | null, unit: string): string {
  if (value === null) {
    return `-- ${unit}`;
  }

  return `${formatNumber(value)} ${unit}`;
}

function formatChange(value: number | null, unit: string): string {
  if (value === null) {
    return "No previous log";
  }

  if (Math.abs(value) < 0.1) {
    return "Stable";
  }

  return `${value > 0 ? "+" : ""}${formatNumber(value)} ${unit}`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
