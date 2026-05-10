import { ExternalLink } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { Task, TaskSource } from "@/domains/tasks/types";
import { useI18n } from "@/i18n";

export type TaskResourceModalType = "link" | "video" | "note";

interface TaskResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditTask: (task: Task) => void;
  task: Task;
  type: TaskResourceModalType;
}

export function TaskResourceModal({
  isOpen,
  onClose,
  onEditTask,
  task,
  type,
}: TaskResourceModalProps): JSX.Element | null {
  const { t } = useI18n();

  if (!isOpen) {
    return null;
  }

  const sources = task.sources.filter((source) => source.type === type);
  const hasDescriptionNote = type === "note" && Boolean(task.description?.trim());
  const isEmpty = sources.length === 0 && !hasDescriptionNote;
  const titleKey =
    type === "link"
      ? "tasks.resources.linksTitle"
      : type === "video"
        ? "tasks.resources.videosTitle"
        : "tasks.resources.notesTitle";
  const emptyKey =
    type === "link"
      ? "tasks.resources.noLinks"
      : type === "video"
        ? "tasks.resources.noVideos"
        : "tasks.resources.noNotes";

  return (
    <ModalShell
      footer={
        <div className="modal-action-row">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.close")}
          </Button>
          <Button
            onClick={() => {
              onClose();
              onEditTask(task);
            }}
            type="button"
            variant="ghost"
          >
            {t("tasks.resources.editTask")}
          </Button>
        </div>
      }
      isOpen={isOpen}
      onRequestClose={onClose}
      size="medium"
      title={t(titleKey)}
    >
      <div className="task-resource-modal">
        {isEmpty ? (
          <div className="task-editor-empty-state">
            <p className="task-editor-empty-state__title">{t(emptyKey)}</p>
          </div>
        ) : null}

        {hasDescriptionNote ? (
          <article className="task-resource-modal__card">
            <div className="task-resource-modal__card-header">
              <strong>{t("tasks.resources.note")}</strong>
            </div>
            <p className="task-resource-modal__text">{task.description?.trim()}</p>
          </article>
        ) : null}

        {sources.map((source) => (
          <article className="task-resource-modal__card" key={source.id}>
            <div className="task-resource-modal__card-header">
              <strong>{source.label || t(`tasks.resources.${type === "note" ? "note" : type}`)}</strong>
              {isValidUrl(source.value) ? (
                <Button onClick={() => openExternal(source.value)} type="button" variant="secondary">
                  <ExternalLink size={14} />
                  {t("tasks.resources.open")}
                </Button>
              ) : null}
            </div>

            {source.value ? <p className="task-resource-modal__text">{source.value}</p> : null}
            {source.query ? (
              <p className="task-resource-modal__hint">
                {t("tasks.ai.searchQuery")}: {source.query}
              </p>
            ) : null}
            {source.note ? <p className="task-resource-modal__text">{source.note}</p> : null}
          </article>
        ))}
      </div>
    </ModalShell>
  );
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function openExternal(url: string): void {
  if (!url.trim()) {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
