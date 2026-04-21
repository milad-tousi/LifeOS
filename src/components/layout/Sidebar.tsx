import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { navigationItems, renderNavigationIcon } from "@/config/navigation.config";
import { SidebarMode } from "@/hooks/useSidebar";

interface SidebarProps {
  isDesktop: boolean;
  isOpen: boolean;
  mode: SidebarMode;
  onCloseMobileMenu: () => void;
  onExpandSidebar: () => void;
  onShrinkSidebar: () => void;
  onHideSidebar: () => void;
}

export function Sidebar({
  isDesktop,
  isOpen,
  mode,
  onCloseMobileMenu,
  onExpandSidebar,
  onHideSidebar,
  onShrinkSidebar,
}: SidebarProps): JSX.Element | null {
  if (!isDesktop && !isOpen) {
    return null;
  }

  const showLabels = !isDesktop || mode === "expanded";
  const className = [
    "sidebar",
    isDesktop ? `sidebar--${mode}` : "sidebar--mobile",
    isOpen ? "sidebar--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {!isDesktop && <button aria-label="Close menu" className="sidebar-backdrop" onClick={onCloseMobileMenu} />}
      <aside aria-label="Primary navigation" className={className}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <span className="sidebar__brand-mark">◌</span>
            {showLabels ? <span className="sidebar__brand-text">LifeOS</span> : null}
          </div>
          {isDesktop ? (
            mode === "expanded" ? (
              <button
                aria-label="Collapse sidebar"
                className="icon-button"
                onClick={onShrinkSidebar}
                type="button"
              >
                <PanelLeftClose size={18} />
              </button>
            ) : mode === "collapsed" ? (
              <button
                aria-label="Expand sidebar"
                className="icon-button"
                onClick={onExpandSidebar}
                type="button"
              >
                <PanelLeftOpen size={18} />
              </button>
            ) : null
          ) : (
            <button aria-label="Close menu" className="icon-button" onClick={onCloseMobileMenu} type="button">
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar__nav">
          {navigationItems.map((item) => {
            return (
              <NavLink
                key={item.href}
                className={({ isActive }) =>
                  isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
                }
                to={item.href}
              >
                {renderNavigationIcon(item.icon, {
                  className: "sidebar__icon",
                })}
                {showLabels ? <span className="sidebar__label">{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        {isDesktop && mode !== "hidden" ? (
          <div className="sidebar__footer">
            {mode === "expanded" ? (
              <button className="sidebar__footer-action" onClick={onShrinkSidebar} type="button">
                <PanelLeftClose size={16} />
                <span>Collapse</span>
              </button>
            ) : (
              <button className="sidebar__footer-action sidebar__footer-action--icon" onClick={onHideSidebar} type="button">
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>
        ) : null}
      </aside>
    </>
  );
}
