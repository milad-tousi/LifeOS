import { NavLink } from "react-router-dom";
import { navigationItems, renderNavigationIcon } from "@/config/navigation.config";
import { useI18n } from "@/i18n";

const mobileBottomNavItems = navigationItems.filter((item) => item.showInMobileBottomNav);

export function BottomNav(): JSX.Element {
  const { t } = useI18n();

  return (
    <nav aria-label={t("navigation.openMenu")} className="bottom-nav">
      <ul className="bottom-nav__list">
        {mobileBottomNavItems.map((item) => {
          return (
            <li key={item.href}>
              <NavLink
                className={({ isActive }) =>
                  isActive ? "bottom-nav__link bottom-nav__link--active" : "bottom-nav__link"
                }
                to={item.href}
              >
                {renderNavigationIcon(item.icon)}
                <span>{t(item.labelKey)}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
