import { Bell } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useI18n } from "@/i18n";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { NotificationPanel } from "@/features/notifications/components/NotificationPanel";

export function NotificationButton(): JSX.Element {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

      {isOpen && (
        <div ref={panelRef} className="notif-panel-wrap">
          <NotificationPanel
            notifications={notifications}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onDismiss={dismiss}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
