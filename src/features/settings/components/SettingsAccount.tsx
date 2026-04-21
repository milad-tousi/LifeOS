import { ChevronRight, LogOut } from "lucide-react";

interface SettingsAccountProps {
  isLoading?: boolean;
  onLogout: () => void | Promise<void>;
}

export function SettingsAccount({
  isLoading = false,
  onLogout,
}: SettingsAccountProps): JSX.Element {
  function handleLogoutClick(): void {
    void onLogout();
  }

  return (
    <button
      className="settings-action-row"
      disabled={isLoading}
      onClick={handleLogoutClick}
      type="button"
    >
      <div className="settings-action-row__icon-wrap">
        <LogOut size={20} strokeWidth={1.9} />
      </div>

      <div className="settings-action-row__content">
        <span className="settings-action-row__title">Logout</span>
        <span className="settings-action-row__subtitle">Sign out of your current session</span>
      </div>

      <div className="settings-action-row__meta">
        <ChevronRight size={18} strokeWidth={1.9} />
      </div>
    </button>
  );
}
