import { Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

export function FinanceSettingsEntry(): JSX.Element {
  return (
    <Link className="finance-settings-entry" to="/settings">
      <Settings2 size={16} />
      <span>Finance Settings</span>
    </Link>
  );
}
