interface DashboardEmptyStateProps {
  action?: JSX.Element;
  description: string;
  title: string;
}

export function DashboardEmptyState({
  action,
  description,
  title,
}: DashboardEmptyStateProps): JSX.Element {
  return (
    <div className="dashboard-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}
