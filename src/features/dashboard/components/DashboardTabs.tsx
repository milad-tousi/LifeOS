import { DashboardTab } from "@/features/dashboard/types/dashboard.types";
import { TranslationKey } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const tabs: Array<{ labelKey: TranslationKey; value: DashboardTab }> = [
  { labelKey: "dashboard.overview", value: "overview" },
  { labelKey: "dashboard.todayPlan", value: "today" },
  { labelKey: "dashboard.goalMindMap", value: "mind-map" },
  { labelKey: "dashboard.activity", value: "activity" },
];

export function DashboardTabs({ activeTab, onChange }: DashboardTabsProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="dashboard-tabs" aria-label={t("dashboard.title")}>
      {tabs.map((tab) => (
        <button
          className={`dashboard-tabs__item${
            activeTab === tab.value ? " dashboard-tabs__item--active" : ""
          }`}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
