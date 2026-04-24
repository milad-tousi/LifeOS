import { Settings2 } from "lucide-react";

interface FinanceSettingsEntryProps {
  onClick: () => void;
}

export function FinanceSettingsEntry({
  onClick,
}: FinanceSettingsEntryProps): JSX.Element {
  return (
    <button className="finance-settings-entry" onClick={onClick} type="button">
      <Settings2 size={16} />
      <span>Finance Settings</span>
    </button>
  );
}
