export type HealthTab =
  | "overview"
  | "body"
  | "workout"
  | "nutrition"
  | "recovery"
  | "insights"
  | "reports";

interface HealthTabsProps {
  activeTab: HealthTab;
  onChange: (tab: HealthTab) => void;
}

const TAB_ITEMS: Array<{ label: string; value: HealthTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Body Metrics", value: "body" },
  { label: "Workout", value: "workout" },
  { label: "Nutrition", value: "nutrition" },
  { label: "Recovery", value: "recovery" },
  { label: "Insights", value: "insights" },
  { label: "Reports", value: "reports" },
];

export function HealthTabs({ activeTab, onChange }: HealthTabsProps): JSX.Element {
  return (
    <div className="health-tabs" aria-label="Health sections" role="tablist">
      {TAB_ITEMS.map((tab) => (
        <button
          aria-selected={activeTab === tab.value}
          className={`health-tabs__item${
            activeTab === tab.value ? " health-tabs__item--active" : ""
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
