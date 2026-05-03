import { Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useI18n } from "@/i18n";

interface GoalCreateButtonProps {
  compact?: boolean;
  onClick: () => void;
}

export function GoalCreateButton({
  compact = false,
  onClick,
}: GoalCreateButtonProps): JSX.Element {
  const { t } = useI18n();

  return (
    <Button
      className={compact ? "goal-create-button goal-create-button--compact" : "goal-create-button"}
      onClick={onClick}
      type="button"
    >
      <Plus size={18} />
      <span>{t("goals.createGoal")}</span>
    </Button>
  );
}
