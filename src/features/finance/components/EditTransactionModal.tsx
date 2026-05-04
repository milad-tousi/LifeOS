import { ModalShell } from "@/components/common/ModalShell";
import { TransactionForm, TransactionFormValue } from "@/features/finance/components/TransactionForm";
import {
  FinanceCategory,
  FinanceMerchantRule,
  FinanceTransaction,
  SmartRule,
} from "@/features/finance/types/finance.types";
import { useI18n } from "@/i18n";

interface EditTransactionModalProps {
  categories: FinanceCategory[];
  isOpen: boolean;
  merchantRules: FinanceMerchantRule[];
  onClose: () => void;
  onSubmit: (value: TransactionFormValue) => void;
  smartRules: SmartRule[];
  transaction: FinanceTransaction | null;
}

export function EditTransactionModal({
  categories,
  isOpen,
  merchantRules,
  onClose,
  onSubmit,
  smartRules,
  transaction,
}: EditTransactionModalProps): JSX.Element | null {
  const { t } = useI18n();

  if (!isOpen || !transaction) {
    return null;
  }

  return (
    <ModalShell
      description={t("finance.editTransactionDescription")}
      isOpen={isOpen}
      onRequestClose={onClose}
      size="wide"
      title={t("finance.editTransaction")}
    >
      <div className="finance-form-shell">
        <TransactionForm
          categories={categories}
          initialValue={transaction}
          merchantRules={merchantRules}
          mode="edit"
          onCancel={onClose}
          onSubmit={onSubmit}
          smartRules={smartRules}
        />
      </div>
    </ModalShell>
  );
}
