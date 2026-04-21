import { NavLink } from "react-router-dom";
import { navigationItems } from "@/config/navigation.config";

export function BottomNav(): JSX.Element {
  return (
    <nav aria-label="Primary navigation" className="bottom-nav">
      <ul className="bottom-nav__list">
        {navigationItems.map((item) => (
          <li key={item.href}>
            <NavLink
              className={({ isActive }) =>
                isActive ? "bottom-nav__link active" : "bottom-nav__link"
              }
              to={item.href}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
