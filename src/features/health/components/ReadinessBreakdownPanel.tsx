import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ReadinessResult } from "@/features/health/types/health.types";

interface ReadinessBreakdownPanelProps {
  readiness: ReadinessResult | null;
}

const BREAKDOWN_ROWS = [
  {
    key: "sleepScore",
    label: "Sleep",
    max: 25,
    helper: "Sleep quality contribution.",
  },
  {
    key: "stressScore",
    label: "Stress",
    max: 20,
    helper: "Lower stress improves readiness.",
  },
  {
    key: "energyScore",
    label: "Energy",
    max: 20,
    helper: "Energy check-in contribution.",
  },
  {
    key: "sorenessScore",
    label: "Soreness",
    max: 15,
    helper: "Lower soreness improves readiness.",
  },
  {
    key: "moodScore",
    label: "Mood",
    max: 10,
    helper: "Mood check-in contribution.",
  },
  {
    key: "workoutLoadScore",
    label: "Workout Load",
    max: 10,
    helper: "Recent training load context.",
  },
] as const;

export function ReadinessBreakdownPanel({
  readiness,
}: ReadinessBreakdownPanelProps): JSX.Element {
  return (
    <Card title="Readiness Breakdown" subtitle="How today's score is assembled.">
      {!readiness ? (
        <EmptyState
          title="No readiness score yet"
          description="Save today's recovery check-in to see the breakdown."
        />
      ) : (
        <div className="readiness-breakdown">
          {BREAKDOWN_ROWS.map((row) => {
            const score = readiness.breakdown[row.key];
            const width = `${Math.round((score / row.max) * 100)}%`;

            return (
              <div className="readiness-breakdown__row" key={row.key}>
                <div className="readiness-breakdown__top">
                  <strong>{row.label}</strong>
                  <span>
                    {score}/{row.max}
                  </span>
                </div>
                <div className="readiness-breakdown__bar">
                  <span style={{ width }} />
                </div>
                <p>{row.helper}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
