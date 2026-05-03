import { Settings2 } from "lucide-react";
import { useI18n } from "@/i18n";

interface FinanceSettingsEntryProps {
  onClick: () => void;
}

export function FinanceSettingsEntry({
  onClick,
}: FinanceSettingsEntryProps): JSX.Element {
  const { t } = useI18n();

  return (
    <button className="finance-settings-entry" onClick={onClick} type="button">
      <Settings2 size={16} />
      <span>{t("finance.financeSettings")}</span>
    </button>
  );
}
