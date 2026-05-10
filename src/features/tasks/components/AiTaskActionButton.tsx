import { LoaderCircle, Sparkles } from "lucide-react";

interface AiTaskActionButtonProps {
  disabled?: boolean;
  isLoading?: boolean;
  label: string;
  loadingLabel: string;
  onClick: () => void;
}

export function AiTaskActionButton({
  disabled = false,
  isLoading = false,
  label,
  loadingLabel,
  onClick,
}: AiTaskActionButtonProps): JSX.Element {
  return (
    <button
      aria-label={label}
      className="task-ai-action-button"
      disabled={disabled || isLoading}
      onClick={onClick}
      title={label}
      type="button"
    >
      {isLoading ? (
        <LoaderCircle className="task-ai-action-button__spinner" size={15} />
      ) : (
        <Sparkles size={15} />
      )}
      <span>{isLoading ? loadingLabel : label}</span>
    </button>
  );
}
