import { Plus, ReceiptText, ScrollText, Target, CheckSquare, Repeat2 } from "lucide-react";
import { TranslationKey } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

interface QuickActionsProps {
  onNavigate: (path: string) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps): JSX.Element {
  const { t } = useI18n();
  const actions = [
    { icon: CheckSquare, labelKey: "tasks.addTask", path: "/tasks" },
    { icon: Repeat2, labelKey: "habits.addHabit", path: "/habits" },
    { icon: Target, labelKey: "goals.addGoal", path: "/goals/new" },
    { icon: ReceiptText, labelKey: "dashboard.addTransaction", path: "/finance" },
    { icon: ScrollText, labelKey: "dashboard.writeDailyReview", path: "/reviews" },
  ] satisfies Array<{ icon: typeof CheckSquare; labelKey: TranslationKey; path: string }>;

  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h2>{t("dashboard.quickActions")}</h2>
          <p>{t("dashboard.quickActionsSubtitle")}</p>
        </div>
      </div>
      <div className="dashboard-quick-actions">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button key={action.labelKey} onClick={() => onNavigate(action.path)} type="button">
              <Icon size={17} />
              <span>{t(action.labelKey)}</span>
              <Plus size={14} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
