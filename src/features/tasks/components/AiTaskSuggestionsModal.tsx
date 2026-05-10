import { ChangeEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
import { ModalShell } from "@/components/common/ModalShell";
import { TaskPriority, TaskSourceType } from "@/domains/tasks/types";
import { buildSearchLink } from "@/features/search/searchProvider";
import { useI18n } from "@/i18n";

export type AiTaskSuggestionMode = "basic" | "subtasks" | "sources";

export interface EditableAiTagSuggestion {
  id: string;
  label: string;
  selected: boolean;
}

export interface EditableAiBasicSuggestion {
  description: string;
  dueDate: string;
  estimatedMinutes: string;
  priority: TaskPriority;
  selectedDescription: boolean;
  selectedDueDate: boolean;
  selectedEstimatedMinutes: boolean;
  selectedPriority: boolean;
  selectedTitle: boolean;
  tags: EditableAiTagSuggestion[];
  title: string;
}

export interface EditableAiSubtaskSuggestion {
  description: string;
  estimatedMinutes?: number;
  id: string;
  priority?: TaskPriority;
  selected: boolean;
  title: string;
}

export interface EditableAiSourceSuggestion {
  content: string;
  description: string;
  id: string;
  mode: "search" | "url";
  query: string;
  selected: boolean;
  title: string;
  type: TaskSourceType;
  url: string;
}

interface AiTaskSuggestionsModalProps {
  basicSuggestion: EditableAiBasicSuggestion | null;
  dueDateMin?: string;
  error?: string;
  isApplying?: boolean;
  isOpen: boolean;
  isRegenerating?: boolean;
  mode: AiTaskSuggestionMode | null;
  onApply: () => void;
  onBasicChange: (patch: Partial<EditableAiBasicSuggestion>) => void;
  onClose: () => void;
  onRegenerate: () => void;
  onRemoveSource: (sourceId: string) => void;
  onRemoveSubtask: (subtaskId: string) => void;
  onSourceChange: (sourceId: string, patch: Partial<EditableAiSourceSuggestion>) => void;
  onSubtaskChange: (subtaskId: string, patch: Partial<EditableAiSubtaskSuggestion>) => void;
  onTagChange: (tagId: string, patch: Partial<EditableAiTagSuggestion>) => void;
  sourceSuggestions: EditableAiSourceSuggestion[];
  subtaskSuggestions: EditableAiSubtaskSuggestion[];
}

export function AiTaskSuggestionsModal({
  basicSuggestion,
  dueDateMin,
  error = "",
  isApplying = false,
  isOpen,
  isRegenerating = false,
  mode,
  onApply,
  onBasicChange,
  onClose,
  onRegenerate,
  onRemoveSource,
  onRemoveSubtask,
  onSourceChange,
  onSubtaskChange,
  onTagChange,
  sourceSuggestions,
  subtaskSuggestions,
}: AiTaskSuggestionsModalProps): JSX.Element | null {
  const { t } = useI18n();

  if (!isOpen || !mode) {
    return null;
  }

  const hasSelectedItems =
    mode === "basic"
      ? hasSelectedBasicSuggestion(basicSuggestion)
      : mode === "subtasks"
        ? subtaskSuggestions.some((item) => item.selected && item.title.trim())
        : sourceSuggestions.some((item) => item.selected && item.title.trim());

  return (
    <ModalShell
      description={t("tasks.ai.modalDescription")}
      footer={
        <div className="modal-action-row">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button disabled={isRegenerating} onClick={onRegenerate} type="button" variant="ghost">
            {t("tasks.ai.regenerate")}
          </Button>
          <Button disabled={!hasSelectedItems || isApplying} onClick={onApply} type="button">
            {isApplying ? t("common.saving") : t("tasks.ai.applySelected")}
          </Button>
        </div>
      }
      isOpen={isOpen}
      onRequestClose={onClose}
      size="wide"
      title={t("tasks.ai.modalTitle")}
    >
      <div className="task-ai-modal">
        {error ? <p className="auth-form__error">{error}</p> : null}

        {mode === "basic" && basicSuggestion ? (
          <div className="task-ai-basic-grid">
            <label className="task-ai-field-card task-ai-field-card--wide">
              <span className="task-ai-field-card__check">
                <input
                  checked={basicSuggestion.selectedTitle}
                  onChange={(event) => onBasicChange({ selectedTitle: event.target.checked })}
                  type="checkbox"
                />
                <span>{t("tasks.modal.taskTitle")}</span>
              </span>
              <input
                className="auth-form__input"
                onChange={(event) => onBasicChange({ title: event.target.value })}
                value={basicSuggestion.title}
              />
            </label>

            <label className="task-ai-field-card task-ai-field-card--wide">
              <span className="task-ai-field-card__check">
                <input
                  checked={basicSuggestion.selectedDescription}
                  onChange={(event) => onBasicChange({ selectedDescription: event.target.checked })}
                  type="checkbox"
                />
                <span>{t("tasks.modal.description")}</span>
              </span>
              <textarea
                className="auth-form__input task-modal-textarea"
                onChange={(event) => onBasicChange({ description: event.target.value })}
                value={basicSuggestion.description}
              />
            </label>

            <div className="task-ai-field-card task-ai-field-card--wide">
              <span className="task-ai-field-card__label">{t("tasks.modal.tags")}</span>
              <div className="task-ai-chip-list">
                {basicSuggestion.tags.map((tag) => (
                  <label className="task-ai-chip" key={tag.id}>
                    <input
                      checked={tag.selected}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        onTagChange(tag.id, { selected: event.target.checked })
                      }
                      type="checkbox"
                    />
                    <input
                      className="task-ai-chip__input"
                      onChange={(event) => onTagChange(tag.id, { label: event.target.value })}
                      value={tag.label}
                    />
                  </label>
                ))}
              </div>
            </div>

            <label className="task-ai-field-card">
              <span className="task-ai-field-card__check">
                <input
                  checked={basicSuggestion.selectedPriority}
                  onChange={(event) => onBasicChange({ selectedPriority: event.target.checked })}
                  type="checkbox"
                />
                <span>{t("common.priority")}</span>
              </span>
              <select
                className="auth-form__input"
                onChange={(event) => onBasicChange({ priority: event.target.value as TaskPriority })}
                value={basicSuggestion.priority}
              >
                <option value="low">{t("goals.priorities.low")}</option>
                <option value="medium">{t("goals.priorities.medium")}</option>
                <option value="high">{t("goals.priorities.high")}</option>
              </select>
            </label>

            <label className="task-ai-field-card">
              <span className="task-ai-field-card__check">
                <input
                  checked={basicSuggestion.selectedEstimatedMinutes}
                  onChange={(event) => onBasicChange({ selectedEstimatedMinutes: event.target.checked })}
                  type="checkbox"
                />
                <span>{t("tasks.modal.estimatedDuration")}</span>
              </span>
              <input
                className="auth-form__input"
                inputMode="numeric"
                onChange={(event) =>
                  onBasicChange({ estimatedMinutes: event.target.value.replace(/[^\d]/g, "") })
                }
                value={basicSuggestion.estimatedMinutes}
              />
            </label>

            <div className="task-ai-field-card">
              <span className="task-ai-field-card__check">
                <input
                  checked={basicSuggestion.selectedDueDate}
                  onChange={(event) => onBasicChange({ selectedDueDate: event.target.checked })}
                  type="checkbox"
                />
                <span>{t("common.dueDate")}</span>
              </span>
              <LocalizedDateInput
                className="auth-form__input"
                min={dueDateMin}
                onChange={(value) => onBasicChange({ dueDate: value })}
                value={basicSuggestion.dueDate}
              />
            </div>
          </div>
        ) : null}

        {mode === "subtasks" ? (
          <div className="task-ai-suggestion-list">
            {subtaskSuggestions.map((subtask) => (
              <article className="task-ai-suggestion-card" key={subtask.id}>
                <label className="task-ai-suggestion-card__check">
                  <input
                    checked={subtask.selected}
                    onChange={(event) => onSubtaskChange(subtask.id, { selected: event.target.checked })}
                    type="checkbox"
                  />
                  <span>{t("tasks.ai.selected")}</span>
                </label>
                <div className="task-ai-suggestion-card__body">
                  <input
                    className="auth-form__input"
                    onChange={(event) => onSubtaskChange(subtask.id, { title: event.target.value })}
                    value={subtask.title}
                  />
                  <textarea
                    className="auth-form__input task-source-card__textarea"
                    onChange={(event) =>
                      onSubtaskChange(subtask.id, { description: event.target.value })
                    }
                    value={subtask.description}
                  />
                  {subtask.priority || subtask.estimatedMinutes ? (
                    <p className="task-ai-suggestion-card__meta">
                      {[
                        subtask.priority ? t(`goals.priorities.${subtask.priority}`) : null,
                        subtask.estimatedMinutes
                          ? `${subtask.estimatedMinutes} ${t("tasks.ai.minutes")}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    </p>
                  ) : null}
                </div>
                <button
                  aria-label={t("tasks.ai.removeSuggestion")}
                  className="icon-button"
                  onClick={() => onRemoveSubtask(subtask.id)}
                  type="button"
                >
                  <X size={16} />
                </button>
              </article>
            ))}
          </div>
        ) : null}

        {mode === "sources" ? (
          <div className="task-ai-suggestion-list">
            {sourceSuggestions.map((source) => (
              <article className="task-ai-suggestion-card" key={source.id}>
                <label className="task-ai-suggestion-card__check">
                  <input
                    checked={source.selected}
                    onChange={(event) => onSourceChange(source.id, { selected: event.target.checked })}
                    type="checkbox"
                  />
                  <span>{t("tasks.ai.selected")}</span>
                </label>
                <div className="task-ai-suggestion-card__body">
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      onSourceChange(source.id, { type: event.target.value as TaskSourceType })
                    }
                    value={source.type}
                  >
                    <option value="link">{t("tasks.sources.link")}</option>
                    <option value="image">{t("tasks.sources.image")}</option>
                    <option value="video">{t("tasks.sources.video")}</option>
                    <option value="file">{t("tasks.sources.file")}</option>
                    <option value="note">{t("tasks.sources.note")}</option>
                  </select>
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      onSourceChange(source.id, { mode: event.target.value as "search" | "url" })
                    }
                    value={source.mode}
                  >
                    <option value="url">{t("tasks.ai.sourceModeUrl")}</option>
                    <option value="search">{t("tasks.ai.sourceModeSearch")}</option>
                  </select>
                  <input
                    className="auth-form__input"
                    onChange={(event) => onSourceChange(source.id, { title: event.target.value })}
                    placeholder={t("tasks.sources.labelPlaceholder")}
                    value={source.title}
                  />
                  {source.mode === "url" ? (
                    <div className="task-ai-source-row">
                      <input
                        className="auth-form__input"
                        onChange={(event) => onSourceChange(source.id, { url: event.target.value })}
                        placeholder={t("tasks.sources.urlPlaceholder")}
                        value={source.url}
                      />
                      <Button
                        disabled={!source.url.trim()}
                        onClick={() => openExternal(source.url)}
                        type="button"
                        variant="secondary"
                      >
                        {t("tasks.ai.openLink")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="task-ai-source-row">
                        <input
                          className="auth-form__input"
                          onChange={(event) => onSourceChange(source.id, { query: event.target.value })}
                          placeholder={t("tasks.ai.searchQuery")}
                          value={source.query}
                        />
                        <Button
                          disabled={!source.query.trim()}
                          onClick={() => openSearch(source.type, source.query)}
                          type="button"
                          variant="secondary"
                        >
                          {t("tasks.ai.search")}
                        </Button>
                      </div>
                      <input className="auth-form__input" readOnly value={source.url} />
                    </>
                  )}
                  <textarea
                    className="auth-form__input task-source-card__textarea"
                    onChange={(event) =>
                      onSourceChange(source.id, { description: event.target.value })
                    }
                    placeholder={t("tasks.sources.notePlaceholder")}
                    value={source.description}
                  />
                  {source.type === "note" ? (
                    <textarea
                      className="auth-form__input task-source-card__textarea"
                      onChange={(event) => onSourceChange(source.id, { content: event.target.value })}
                      placeholder={t("tasks.sources.referenceTextPlaceholder")}
                      value={source.content}
                    />
                  ) : null}
                </div>
                <button
                  aria-label={t("tasks.ai.removeSuggestion")}
                  className="icon-button"
                  onClick={() => onRemoveSource(source.id)}
                  type="button"
                >
                  <X size={16} />
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}

function hasSelectedBasicSuggestion(suggestion: EditableAiBasicSuggestion | null): boolean {
  if (!suggestion) {
    return false;
  }

  return Boolean(
    (suggestion.selectedTitle && suggestion.title.trim()) ||
      (suggestion.selectedDescription && suggestion.description.trim()) ||
      (suggestion.selectedPriority && suggestion.priority) ||
      (suggestion.selectedEstimatedMinutes && suggestion.estimatedMinutes.trim()) ||
      (suggestion.selectedDueDate && suggestion.dueDate) ||
      suggestion.tags.some((tag) => tag.selected && tag.label.trim()),
  );
}

function openExternal(url: string): void {
  if (!url.trim()) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function openSearch(type: TaskSourceType, query: string): void {
  if (!query.trim()) {
    return;
  }

  // TODO: Replace generated search URLs with validated search API providers
  // such as Tavily, Brave Search, SerpAPI, YouTube Data API, or a backend proxy.
  const searchUrl = buildSearchLink({
    query,
    type: type === "video" ? "youtube" : "web",
  })?.url;

  if (searchUrl) {
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  }
}
