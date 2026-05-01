import { DashboardTab } from "@/features/dashboard/types/dashboard.types";

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const tabs: Array<{ label: string; value: DashboardTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Today Plan", value: "today" },
  { label: "Goal Mind Map", value: "mind-map" },
  { label: "Activity", value: "activity" },
];

export function DashboardTabs({ activeTab, onChange }: DashboardTabsProps): JSX.Element {
  return (
    <div className="dashboard-tabs" aria-label="Dashboard tabs">
      {tabs.map((tab) => (
        <button
          className={`dashboard-tabs__item${
            activeTab === tab.value ? " dashboard-tabs__item--active" : ""
          }`}
          key={tab.value}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
