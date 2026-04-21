import { Plus } from "lucide-react";
import { Button } from "@/components/common/Button";

interface GoalCreateButtonProps {
  compact?: boolean;
  onClick: () => void;
}

export function GoalCreateButton({
  compact = false,
  onClick,
}: GoalCreateButtonProps): JSX.Element {
  return (
    <Button
      className={compact ? "goal-create-button goal-create-button--compact" : "goal-create-button"}
      onClick={onClick}
      type="button"
    >
      <Plus size={18} />
      <span>Create goal</span>
    </Button>
  );
}
