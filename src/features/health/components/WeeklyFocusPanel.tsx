import { Card } from "@/components/common/Card";
import { WeeklyHealthFocus } from "@/features/health/types/health.types";

interface WeeklyFocusPanelProps {
  focus: WeeklyHealthFocus;
}

export function WeeklyFocusPanel({ focus }: WeeklyFocusPanelProps): JSX.Element {
  return (
    <Card title="Weekly Focus" subtitle="One simple priority for the next few days.">
      <div className="weekly-focus-panel">
        <div>
          <strong>{focus.title}</strong>
          <p>{focus.reason}</p>
          <span>{focus.suggestedAction}</span>
        </div>
        <ul>
          {focus.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
