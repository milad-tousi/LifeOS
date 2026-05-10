import { CalendarDays, Repeat2, Wallet } from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  AiFinanceAction,
  AiFinanceBudgetAction,
  AiFinanceHabitAction,
  AiFinanceTaskAction,
} from "@/features/finance/types/financialAssistant";
import { useI18n } from "@/i18n";

interface AiFinanceActionCardProps {
  action: AiFinanceAction;
  currency: string;
  onCreateTask: (action: AiFinanceTaskAction) => void;
  onCreateHabit: (action: AiFinanceHabitAction) => void;
  onCreateBudget: (action: AiFinanceBudgetAction) => void;
}

export function AiFinanceActionCard({
  action,
  currency,
  onCreateTask,
  onCreateHabit,
  onCreateBudget,
}: AiFinanceActionCardProps): JSX.Element {
  const { t } = useI18n();

  const typeIcon = {
    task: <CalendarDays size={14} />,
    habit: <Repeat2 size={14} />,
    budget: <Wallet size={14} />,
  }[action.type];

  const typeLabel = {
    task: t("finance.assistant.ai.action.typeTask"),
    habit: t("finance.assistant.ai.action.typeHabit"),
    budget: t("finance.assistant.ai.action.typeBudget"),
  }[action.type];

  function renderMeta(): JSX.Element | null {
    if (action.type === "task" && action.dueDate) {
      return (
        <span className="finance-assistant__ai-action-meta">
          {t("finance.assistant.ai.action.dueDate")} {action.dueDate}
        </span>
      );
    }
    if (action.type === "habit") {
      return (
        <span className="finance-assistant__ai-action-meta">
          {t("finance.assistant.ai.action.frequency")} {action.frequency}
          {action.timeOfDay ? ` · ${action.timeOfDay}` : ""}
        </span>
      );
    }
    if (action.type === "budget") {
      return (
        <span className="finance-assistant__ai-action-meta">
          {t("finance.assistant.ai.action.monthlyLimit")} {currency} {action.monthlyLimit}
        </span>
      );
    }
    return null;
  }

  function renderButton(): JSX.Element {
    if (action.type === "task") {
      return (
        <Button
          onClick={() => onCreateTask(action)}
          type="button"
          variant="secondary"
        >
          {t("finance.assistant.createTask")}
        </Button>
      );
    }
    if (action.type === "habit") {
      return (
        <Button
          onClick={() => onCreateHabit(action)}
          type="button"
          variant="secondary"
        >
          {t("finance.assistant.createHabit")}
        </Button>
      );
    }
    return (
      <Button
        onClick={() => onCreateBudget(action)}
        type="button"
        variant="secondary"
      >
        {t("finance.assistant.createBudget")}
      </Button>
    );
  }

  return (
    <article className="finance-assistant__action-card finance-assistant__action-card--ai">
      <div className="finance-assistant__ai-action-header">
        <div className="finance-assistant__ai-type-badge">
          {typeIcon}
          <span>{typeLabel}</span>
        </div>
        {renderMeta()}
      </div>
      <div>
        <strong>{action.title}</strong>
        <p>{action.description}</p>
        {action.type === "budget" && action.reason ? (
          <p className="finance-assistant__ai-action-reason">{action.reason}</p>
        ) : null}
      </div>
      <div className="finance-assistant__action-buttons">
        {renderButton()}
      </div>
    </article>
  );
}
