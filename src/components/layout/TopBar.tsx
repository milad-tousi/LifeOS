import { Bell, Menu } from "lucide-react";
import { PageGreeting } from "@/components/layout/PageGreeting";
import { useI18n } from "@/i18n";

interface TopBarProps {
  isDesktop: boolean;
  isSidebarHidden: boolean;
  isMobileMenuOpen: boolean;
  onMenuClick: () => void;
}

export function TopBar({
  isDesktop,
  isMobileMenuOpen,
  isSidebarHidden,
  onMenuClick,
}: TopBarProps): JSX.Element {
  const { t } = useI18n();
  const showMenuButton = !isDesktop || isSidebarHidden;

  return (
    <header className="topbar">
      <div className="topbar__left">
        {showMenuButton ? (
          <button
            aria-expanded={!isDesktop ? isMobileMenuOpen : undefined}
            aria-label={t("navigation.openMenu")}
            className="icon-button"
            onClick={onMenuClick}
            type="button"
          >
            <Menu size={20} />
          </button>
        ) : null}
        <PageGreeting />
      </div>

      <button aria-label="Notifications" className="icon-button" type="button">
        <Bell size={18} />
      </button>
    </header>
  );
}
