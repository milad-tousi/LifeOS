import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { navigationItems, renderNavigationIcon } from "@/config/navigation.config";
import { SidebarMode } from "@/hooks/useSidebar";
import { useI18n } from "@/i18n";

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
  const { direction, t } = useI18n();

  if (!isDesktop && !isOpen) {
    return null;
  }

  const showLabels = !isDesktop || mode === "expanded";
  const className = [
    "sidebar",
    isDesktop ? `sidebar--${mode}` : "sidebar--mobile",
    `sidebar--${direction}`,
    isOpen ? "sidebar--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {!isDesktop && <button aria-label={t("navigation.closeMenu")} className="sidebar-backdrop" onClick={onCloseMobileMenu} />}
      <aside aria-label={t("navigation.openMenu")} className={className}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <span className="sidebar__brand-mark">◌</span>
            {showLabels ? <span className="sidebar__brand-text">LifeOS</span> : null}
          </div>
          {isDesktop ? (
            mode === "expanded" ? (
              <button
                aria-label={t("navigation.collapse")}
                className="icon-button"
                onClick={onShrinkSidebar}
                type="button"
              >
                <PanelLeftClose size={18} />
              </button>
            ) : mode === "collapsed" ? (
              <button
                aria-label={t("navigation.expand")}
                className="icon-button"
                onClick={onExpandSidebar}
                type="button"
              >
                <PanelLeftOpen size={18} />
              </button>
            ) : null
          ) : (
            <button aria-label={t("navigation.closeMenu")} className="icon-button" onClick={onCloseMobileMenu} type="button">
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
                {showLabels ? <span className="sidebar__label">{t(item.labelKey)}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        {isDesktop && mode !== "hidden" ? (
          <div className="sidebar__footer">
            {mode === "expanded" ? (
              <button className="sidebar__footer-action" onClick={onShrinkSidebar} type="button">
                <PanelLeftClose size={16} />
                <span>{t("navigation.collapse")}</span>
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
