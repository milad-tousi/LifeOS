import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  actionLabel,
  description,
  onAction,
  title,
}: EmptyStateProps): JSX.Element {
  return (
    <Card>
      <div className="empty-state">
        <div>
          <h3 className="empty-state__title">{title}</h3>
          <p className="empty-state__description">{description}</p>
        </div>
        {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </Card>
  );
}
