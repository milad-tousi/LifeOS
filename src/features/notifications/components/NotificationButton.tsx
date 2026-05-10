import { Bell } from "lucide-react";
import { createPortal } from "react-dom";
import { useRef, useState, useEffect } from "react";
import { useI18n } from "@/i18n";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { NotificationPanel } from "@/features/notifications/components/NotificationPanel";

export function NotificationButton(): JSX.Element {
  const { direction, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelStyle, setPanelStyle] = useState<{
    top: number;
    right: number;
    width: number;
  } | null>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePanelPosition(): void {
      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const desiredWidth = Math.min(360, viewportWidth - 16);
      const desktopRight = Math.max(8, viewportWidth - rect.right);

      setPanelStyle({
        top: rect.bottom + 8,
        right: viewportWidth <= 640 ? 8 : desktopRight,
        width: desiredWidth,
      });
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [direction, isOpen]);

  // Close panel on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent): void {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleToggle(): void {
    setIsOpen((prev) => !prev);
  }

  return (
    <div className="notif-btn-wrap">
      <button
        ref={buttonRef}
        aria-label={t("notifications.buttonLabel")}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="icon-button notif-btn"
        onClick={handleToggle}
        type="button"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && portalTarget && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              className={`notif-panel-wrap notif-panel-wrap--${direction}`}
              style={{
                top: `${panelStyle.top}px`,
                right: `${panelStyle.right}px`,
                width: `${panelStyle.width}px`,
              }}
            >
              <NotificationPanel
                notifications={notifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onDismiss={dismiss}
                onClose={() => setIsOpen(false)}
              />
            </div>,
            portalTarget,
          )
        : null}
    </div>
  );
}
