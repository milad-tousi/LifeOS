import { TranslationKey } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

export type FinanceTab = "overview" | "transactions" | "analytics";

interface FinanceTabsProps {
  activeTab: FinanceTab;
  onChange: (tab: FinanceTab) => void;
}

const TAB_ITEMS: Array<{ labelKey: TranslationKey; value: FinanceTab }> = [
  { labelKey: "finance.overview", value: "overview" },
  { labelKey: "finance.transactions", value: "transactions" },
  { labelKey: "finance.analytics", value: "analytics" },
];

export function FinanceTabs({
  activeTab,
  onChange,
}: FinanceTabsProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="finance-tabs" aria-label={t("finance.title")} role="tablist">
      {TAB_ITEMS.map((tab) => (
        <button
          aria-selected={activeTab === tab.value}
          className={`finance-tabs__item${
            activeTab === tab.value ? " finance-tabs__item--active" : ""
          }`}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          role="tab"
          type="button"
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
