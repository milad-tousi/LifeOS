import { ReactNode } from "react";

interface TaskResourceBadgeProps {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
}

export function TaskResourceBadge({
  ariaLabel,
  children,
  onClick,
}: TaskResourceBadgeProps): JSX.Element {
  return (
    <button
      aria-label={ariaLabel}
      className="task-resource-badge"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      {children}
    </button>
  );
}
