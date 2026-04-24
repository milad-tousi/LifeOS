import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface DeleteTransactionDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteTransactionDialog({
  isOpen,
  onCancel,
  onConfirm,
}: DeleteTransactionDialogProps): JSX.Element | null {
  return (
    <ConfirmDialog
      confirmLabel="Delete Transaction"
      description="Are you sure you want to delete this transaction?"
      isOpen={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Delete Transaction"
      tone="danger"
    />
  );
}
