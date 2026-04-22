import { ChangeEvent } from "react";
import { FileImage, FileText, Film, Link2, NotebookText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/common/Button";
import { createId } from "@/lib/id";
import { TaskSource, TaskSourceType } from "@/domains/tasks/types";

const SOURCE_TYPE_OPTIONS: Array<{ label: string; value: TaskSourceType }> = [
  { label: "Link", value: "link" },
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
  { label: "File", value: "file" },
  { label: "Note", value: "note" },
];

interface TaskSourcesEditorProps {
  sources: TaskSource[];
  onChange: (sources: TaskSource[]) => void;
}

function createEmptySource(type: TaskSourceType = "link"): TaskSource {
  return {
    id: createId(),
    type,
    label: "",
    value: "",
    note: "",
    origin: "url",
  };
}

export function TaskSourcesEditor({
  onChange,
  sources,
}: TaskSourcesEditorProps): JSX.Element {
  function updateSource(sourceId: string, patch: Partial<TaskSource>): void {
    onChange(
      sources.map((source) => (source.id === sourceId ? { ...source, ...patch } : source)),
    );
  }

  function addSource(type: TaskSourceType): void {
    onChange([...sources, createEmptySource(type)]);
  }

  function removeSource(sourceId: string): void {
    onChange(sources.filter((source) => source.id !== sourceId));
  }

  function handleFilePick(sourceId: string, event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    updateSource(sourceId, {
      origin: "local",
      fileName: file.name,
      mimeType: file.type || undefined,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      value: file.name,
      label: file.name.replace(/\.[^.]+$/, ""),
    });
  }

  return (
    <div className="task-editor-section">
      <div className="task-editor-section__header">
        <div>
          <h3 className="task-editor-section__title">Sources</h3>
          <p className="task-editor-section__description">
            Keep the task grounded with links, files, notes, and upload-ready attachments.
          </p>
        </div>
        <div className="task-editor-section__actions">
          {SOURCE_TYPE_OPTIONS.map((option) => (
            <button
              className="task-chip-button"
              key={option.value}
              onClick={() => addSource(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="task-editor-empty-state">
          <p className="task-editor-empty-state__title">No sources attached yet</p>
          <p className="task-editor-empty-state__description">
            Add references now and connect real uploads later without changing the task model.
          </p>
        </div>
      ) : (
        <div className="task-source-list">
          {sources.map((source, index) => (
            <article className="task-source-card" key={source.id}>
              <div className="task-source-card__header">
                <div className="task-source-card__badge">
                  {renderSourceIcon(source.type)}
                  <span>{source.type}</span>
                </div>
                <button
                  aria-label={`Remove source ${index + 1}`}
                  className="task-source-card__remove"
                  onClick={() => removeSource(source.id)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="task-source-card__grid">
                <label className="auth-form__field">
                  <span className="auth-form__label">Type</span>
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      updateSource(source.id, {
                        type: event.target.value as TaskSourceType,
                        origin: event.target.value === "note" ? "local" : source.origin,
                      })
                    }
                    value={source.type}
                  >
                    {SOURCE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="auth-form__field">
                  <span className="auth-form__label">Label</span>
                  <input
                    className="auth-form__input"
                    onChange={(event) => updateSource(source.id, { label: event.target.value })}
                    placeholder="Design spec, screenshot, article..."
                    value={source.label}
                  />
                </label>

                <label className="auth-form__field task-source-card__field--wide">
                  <span className="auth-form__label">
                    {source.type === "note" ? "Reference text" : "URL or reference"}
                  </span>
                  <input
                    className="auth-form__input"
                    onChange={(event) => updateSource(source.id, { value: event.target.value, origin: "url" })}
                    placeholder={
                      source.type === "note"
                        ? "Paste a note or local reference"
                        : "https://example.com/resource"
                    }
                    value={source.value}
                  />
                </label>

                {(source.type === "image" || source.type === "video" || source.type === "file") ? (
                  <label className="auth-form__field task-source-card__field--wide">
                    <span className="auth-form__label">Local placeholder</span>
                    <span className="task-source-card__upload">
                      <Upload size={16} />
                      <span>{source.fileName ? `Selected: ${source.fileName}` : "Select a local file"}</span>
                      <input
                        accept={source.type === "image" ? "image/*" : source.type === "video" ? "video/*" : undefined}
                        className="task-source-card__upload-input"
                        onChange={(event) => handleFilePick(source.id, event)}
                        type="file"
                      />
                    </span>
                  </label>
                ) : null}

                <label className="auth-form__field task-source-card__field--wide">
                  <span className="auth-form__label">Note</span>
                  <textarea
                    className="auth-form__input task-source-card__textarea"
                    onChange={(event) => updateSource(source.id, { note: event.target.value })}
                    placeholder="Add context for why this source matters"
                    value={source.note ?? ""}
                  />
                </label>
              </div>

              <div className="task-source-preview">{renderSourcePreview(source)}</div>
            </article>
          ))}
        </div>
      )}

      {sources.length > 0 ? (
        <Button onClick={() => addSource("link")} type="button" variant="secondary">
          Add another source
        </Button>
      ) : null}
    </div>
  );
}

function renderSourceIcon(type: TaskSourceType): JSX.Element {
  switch (type) {
    case "image":
      return <FileImage size={16} />;
    case "video":
      return <Film size={16} />;
    case "file":
      return <FileText size={16} />;
    case "note":
      return <NotebookText size={16} />;
    case "link":
    default:
      return <Link2 size={16} />;
  }
}

function renderSourcePreview(source: TaskSource): JSX.Element {
  if (source.type === "image" && (source.previewUrl || source.value)) {
    return (
      <div className="task-source-preview__image">
        <img
          alt={source.label || "Task source preview"}
          src={source.previewUrl || source.value}
        />
      </div>
    );
  }

  if (source.type === "link" && source.value) {
    return (
      <a className="task-source-preview__link" href={source.value} rel="noreferrer" target="_blank">
        {source.label || source.value}
      </a>
    );
  }

  return (
    <div className="task-source-preview__fallback">
      {renderSourceIcon(source.type)}
      <div>
        <strong>{source.label || source.fileName || "Untitled source"}</strong>
        <p>{source.fileName || source.value || "Waiting for details"}</p>
      </div>
    </div>
  );
}
