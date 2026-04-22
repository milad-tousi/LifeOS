export type FinanceTab = "overview" | "transactions" | "analytics";

interface FinanceTabsProps {
  activeTab: FinanceTab;
  onChange: (tab: FinanceTab) => void;
}

const TAB_ITEMS: Array<{ label: string; value: FinanceTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Transactions", value: "transactions" },
  { label: "Analytics", value: "analytics" },
];

export function FinanceTabs({
  activeTab,
  onChange,
}: FinanceTabsProps): JSX.Element {
  return (
    <div className="finance-tabs" aria-label="Finance sections" role="tablist">
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
          {tab.label}
        </button>
      ))}
    </div>
  );
}
