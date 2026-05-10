import { CheckCheck, X, ExternalLink, AlertTriangle, Info, Bell, Calendar, DollarSign, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppNotification, NotificationType, NotificationSeverity } from "@/features/notifications/types";
import { useI18n } from "@/i18n";

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function getTypeIcon(type: NotificationType, severity: NotificationSeverity): JSX.Element {
  switch (type) {
    case "task_overdue":
      return <AlertTriangle size={15} className={`notif-item__icon notif-item__icon--${severity}`} />;
    case "goal_overdue":
      return <Target size={15} className={`notif-item__icon notif-item__icon--${severity}`} />;
    case "event_reminder":
      return <Calendar size={15} className={`notif-item__icon notif-item__icon--${severity}`} />;
    case "payment_due":
      return <DollarSign size={15} className={`notif-item__icon notif-item__icon--${severity}`} />;
    case "habit_reminder":
      return <Bell size={15} className={`notif-item__icon notif-item__icon--${severity}`} />;
    default:
      return <Info size={15} className={`notif-item__icon notif-item__icon--info`} />;
  }
}

function formatRelativeTime(createdAt: number, t: (key: string, v?: Record<string, string | number>) => string): string {
  const diffMs = Date.now() - createdAt;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return t("notifications.time.justNow");
  if (diffMin < 60) return t("notifications.time.minutesAgo", { count: diffMin });
  if (diffHr < 24) return t("notifications.time.hoursAgo", { count: diffHr });
  return t("notifications.time.daysAgo", { count: diffDay });
}

export function NotificationItem({ notification, onMarkRead, onDismiss }: NotificationItemProps): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isUnread = !notification.readAt;

  function handleOpen(): void {
    if (!notification.readAt) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  }

  return (
    <div
      className={`notif-item${isUnread ? " notif-item--unread" : ""}${notification.actionUrl ? " notif-item--clickable" : ""}`}
      onClick={notification.actionUrl ? handleOpen : undefined}
      role={notification.actionUrl ? "button" : undefined}
      tabIndex={notification.actionUrl ? 0 : undefined}
      onKeyDown={notification.actionUrl ? (e) => { if (e.key === "Enter" || e.key === " ") handleOpen(); } : undefined}
    >
      <div className="notif-item__icon-wrap">
        {getTypeIcon(notification.type, notification.severity)}
      </div>

      <div className="notif-item__body">
        <p className="notif-item__title">{notification.title}</p>
        <p className="notif-item__message">{notification.message}</p>
        <span className="notif-item__time">{formatRelativeTime(notification.createdAt, t)}</span>
      </div>

      <div className="notif-item__actions" onClick={(e) => e.stopPropagation()}>
        {isUnread && (
          <button
            className="notif-item__btn"
            aria-label={t("notifications.markRead")}
            title={t("notifications.markRead")}
            onClick={() => onMarkRead(notification.id)}
            type="button"
          >
            <CheckCheck size={14} />
          </button>
        )}
        {notification.actionUrl && (
          <button
            className="notif-item__btn"
            aria-label={t("notifications.openItem")}
            title={t("notifications.openItem")}
            onClick={handleOpen}
            type="button"
          >
            <ExternalLink size={14} />
          </button>
        )}
        <button
          className="notif-item__btn notif-item__btn--dismiss"
          aria-label={t("notifications.dismiss")}
          title={t("notifications.dismiss")}
          onClick={() => onDismiss(notification.id)}
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
