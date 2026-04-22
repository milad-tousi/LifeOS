import { ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";

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
    <ModalShell
      footer={
        <div className="confirm-dialog__actions">
          <Button onClick={onCancel} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
          >
            {isConfirming ? "Working..." : confirmLabel}
          </Button>
        </div>
      }
      isOpen={isOpen}
      onRequestClose={onCancel}
      title={title}
    >
      <div className="confirm-dialog__body">
        <p className="confirm-dialog__description">{description}</p>
        {children}
      </div>
    </ModalShell>
  );
}
