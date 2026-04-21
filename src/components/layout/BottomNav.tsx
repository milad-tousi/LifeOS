import { NavLink } from "react-router-dom";
import { navigationItems, renderNavigationIcon } from "@/config/navigation.config";

const mobileBottomNavItems = navigationItems.filter((item) => item.showInMobileBottomNav);

export function BottomNav(): JSX.Element {
  return (
    <nav aria-label="Bottom navigation" className="bottom-nav">
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
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
