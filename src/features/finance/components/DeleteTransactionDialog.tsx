import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();

  return (
    <ConfirmDialog
      confirmLabel={t("finance.deleteTransaction")}
      description={t("finance.deleteTransactionDescription")}
      isOpen={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={t("finance.deleteTransaction")}
      tone="danger"
    />
  );
}
