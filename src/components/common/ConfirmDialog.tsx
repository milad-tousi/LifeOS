import { ReactNode } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  tone?: "default" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel,
  description,
  isConfirming = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = "default",
  children,
}: ConfirmDialogProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div aria-modal="true" className="confirm-dialog-backdrop" role="dialog">
      <div className="confirm-dialog">
        <div className="confirm-dialog__body">
          <h2 className="confirm-dialog__title">{title}</h2>
          <p className="confirm-dialog__description">{description}</p>
          {children}
        </div>

        <div className="confirm-dialog__actions">
          <button className="button button--secondary" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={`button ${tone === "danger" ? "button--danger" : "button--primary"}`}
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
