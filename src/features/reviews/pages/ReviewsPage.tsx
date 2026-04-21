import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";

export function ReviewsPage(): JSX.Element {
  return (
    <>
      <ScreenHeader
        title="Reviews"
        description="Daily reviews are planned as small local entries with no backend dependency."
      />
      <Card title="Reviews">
        <EmptyState
          title="Reviews MVP placeholder"
          description="This route is connected and ready for future local review records."
        />
      </Card>
    </>
  );
}
