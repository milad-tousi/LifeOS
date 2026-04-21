import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export function HealthPage(): JSX.Element {
  return (
    <>
      <ScreenHeader
        title="Health"
        description="Health tracking will use compact on-device logs and stay fully offline."
      />
      <Card title="Health">
        <EmptyState
          title="Health MVP placeholder"
          description="This section is reserved for future local health records."
        />
      </Card>
    </>
  );
}
