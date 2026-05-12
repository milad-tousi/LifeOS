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
    left?: number;
    right?: number;
    width: number;
  } | null>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!isOpen) return;

    function updatePanelPosition(): void {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const desiredWidth = Math.min(360, viewportWidth - 16);
      const top = rect.bottom + 8;
      if (viewportWidth <= 640) {
        const leftEdge = Math.max(8, Math.min(rect.left, viewportWidth - desiredWidth - 8));
        setPanelStyle({ top, left: leftEdge, width: desiredWidth });
      } else if (direction === "rtl") {
        const leftEdge = Math.max(8, Math.min(rect.left, viewportWidth - desiredWidth - 8));
        setPanelStyle({ top, left: leftEdge, width: desiredWidth });
      } else {
        const rightEdge = Math.max(8, viewportWidth - rect.right);
        const clampedRight = Math.min(rightEdge, viewportWidth - desiredWidth - 8);
        setPanelStyle({ top, right: Math.max(8, clampedRight), width: desiredWidth });
      }
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [direction, isOpen]);

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
              className={"notif-panel-wrap notif-panel-wrap--" + direction}
              style={Object.assign(
                { top: panelStyle.top + "px", width: panelStyle.width + "px" },
                panelStyle.left !== undefined
                  ? { left: panelStyle.left + "px" }
                  : { right: (panelStyle.right ?? 8) + "px" },
              )}
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
