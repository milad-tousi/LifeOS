import { CheckCheck, BellOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { AppNotification } from "@/features/notifications/types";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";

interface NotificationPanelProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onClose,
}: NotificationPanelProps): JSX.Element {
  const { t } = useI18n();

  const unread = notifications.filter((n) => !n.readAt);
  const earlier = notifications.filter((n) => n.readAt);
  const hasUnread = unread.length > 0;

  return (
    <div className="notif-panel" role="dialog" aria-label={t("notifications.panelTitle")}>
      {/* Header */}
      <div className="notif-panel__header">
        <span className="notif-panel__title">{t("notifications.panelTitle")}</span>
        {hasUnread && (
          <button
            className="notif-panel__mark-all"
            onClick={onMarkAllRead}
            type="button"
          >
            <CheckCheck size={13} />
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="notif-panel__body">
        {notifications.length === 0 ? (
          <div className="notif-panel__empty">
            <BellOff size={28} className="notif-panel__empty-icon" />
            <p className="notif-panel__empty-text">{t("notifications.empty")}</p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <section className="notif-panel__section">
                <p className="notif-panel__section-label">{t("notifications.unreadSection")}</p>
                {unread.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={onMarkRead}
                    onDismiss={onDismiss}
                  />
                ))}
              </section>
            )}

            {earlier.length > 0 && (
              <section className="notif-panel__section">
                <p className="notif-panel__section-label">{t("notifications.readSection")}</p>
                {earlier.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={onMarkRead}
                    onDismiss={onDismiss}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
