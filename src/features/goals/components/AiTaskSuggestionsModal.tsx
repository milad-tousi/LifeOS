import { ChangeEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { GoalTaskSuggestion } from "@/features/goals/ai/generateGoalTasks";
import { useI18n } from "@/i18n";

export interface EditableGoalTaskSuggestion extends GoalTaskSuggestion {
  id: string;
  selected: boolean;
}

interface AiTaskSuggestionsModalProps {
  error?: string;
  isAddingTasks?: boolean;
  isOpen: boolean;
  isRegenerating?: boolean;
  onAddSelected: () => void;
  onChangeSelection: (suggestionId: string, selected: boolean) => void;
  onChangeTitle: (suggestionId: string, title: string) => void;
  onClose: () => void;
  onRegenerate: () => void;
  onRemoveSuggestion: (suggestionId: string) => void;
  suggestions: EditableGoalTaskSuggestion[];
}

export function AiTaskSuggestionsModal({
  error = "",
  isAddingTasks = false,
  isOpen,
  isRegenerating = false,
  onAddSelected,
  onChangeSelection,
  onChangeTitle,
  onClose,
  onRegenerate,
  onRemoveSuggestion,
  suggestions,
}: AiTaskSuggestionsModalProps): JSX.Element | null {
  const { t } = useI18n();
  const selectedCount = suggestions.filter((suggestion) => suggestion.selected && suggestion.title.trim()).length;

  if (!isOpen) {
    return null;
  }

  return (
    <ModalShell
      description={t("goals.detail.ai.modalDescription")}
      footer={
        <div className="modal-action-row">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button disabled={isRegenerating} onClick={onRegenerate} type="button" variant="ghost">
            {t("goals.detail.ai.regenerate")}
          </Button>
          <Button
            disabled={selectedCount === 0 || isAddingTasks}
            onClick={onAddSelected}
            type="button"
          >
            {isAddingTasks ? t("common.saving") : t("goals.detail.ai.addSelected")}
          </Button>
        </div>
      }
      isOpen={isOpen}
      onRequestClose={onClose}
      title={t("goals.detail.ai.modalTitle")}
    >
      <div className="goal-ai-modal">
        {error ? <p className="auth-form__error">{error}</p> : null}
        {suggestions.map((suggestion) => (
          <article className="goal-ai-suggestion-card" key={suggestion.id}>
            <label className="goal-ai-suggestion-card__select">
              <input
                checked={suggestion.selected}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChangeSelection(suggestion.id, event.target.checked)
                }
                type="checkbox"
              />
              <span>{t("goals.detail.ai.selectSuggestion")}</span>
            </label>

            <div className="goal-ai-suggestion-card__body">
              <input
                className="auth-form__input"
                onChange={(event) => onChangeTitle(suggestion.id, event.target.value)}
                value={suggestion.title}
              />
              {suggestion.reason ? (
                <p className="goal-ai-suggestion-card__reason">{suggestion.reason}</p>
              ) : null}
            </div>

            <button
              aria-label={t("goals.detail.ai.removeSuggestion")}
              className="icon-button"
              onClick={() => onRemoveSuggestion(suggestion.id)}
              type="button"
            >
              <X size={16} />
            </button>
          </article>
        ))}
      </div>
    </ModalShell>
  );
}
