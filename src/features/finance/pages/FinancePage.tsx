import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export function FinancePage(): JSX.Element {
  return (
    <>
      <ScreenHeader
        title="Finance"
        description="Finance is prepared as a local-first module for future compact expense tracking."
      />
      <Card title="Finance">
        <EmptyState
          title="Finance MVP placeholder"
          description="This route is ready for a lightweight expense list later."
        />
      </Card>
    </>
  );
}
