import { LoaderCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";

interface AiGoalTaskButtonProps {
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

export function AiGoalTaskButton({
  disabled = false,
  isLoading = false,
  onClick,
}: AiGoalTaskButtonProps): JSX.Element {
  const { t } = useI18n();

  return (
    <button
      aria-label={t("goals.detail.ai.suggestTasks")}
      className="goal-detail-ai-button"
      disabled={disabled || isLoading}
      onClick={onClick}
      title={t("goals.detail.ai.suggestTasks")}
      type="button"
    >
      {isLoading ? (
        <LoaderCircle className="goal-detail-ai-button__spinner" size={15} />
      ) : (
        <Sparkles size={15} />
      )}
      <span>{isLoading ? t("goals.detail.ai.thinking") : t("goals.detail.ai.suggestTasks")}</span>
    </button>
  );
}
