import { Plus, ReceiptText, ScrollText, Target, CheckSquare, Repeat2 } from "lucide-react";

interface QuickActionsProps {
  onNavigate: (path: string) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps): JSX.Element {
  const actions = [
    { icon: CheckSquare, label: "Add Task", path: "/tasks" },
    { icon: Repeat2, label: "Add Habit", path: "/habits" },
    { icon: Target, label: "Add Goal", path: "/goals/new" },
    { icon: ReceiptText, label: "Add Transaction", path: "/finance" },
    { icon: ScrollText, label: "Write Daily Review", path: "/reviews" },
  ] as const;

  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h2>Quick Actions</h2>
          <p>Jump directly into the next useful action.</p>
        </div>
      </div>
      <div className="dashboard-quick-actions">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button key={action.label} onClick={() => onNavigate(action.path)} type="button">
              <Icon size={17} />
              <span>{action.label}</span>
              <Plus size={14} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
