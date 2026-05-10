export type NotificationType =
  | "task_overdue"
  | "goal_overdue"
  | "event_reminder"
  | "payment_due"
  | "habit_reminder";

export type NotificationEntityType = "task" | "goal" | "event" | "finance" | "habit";
export type NotificationSeverity = "info" | "warning" | "critical";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  severity: NotificationSeverity;
  /** ISO date string – when this notification should/did fire */
  scheduledAt: string;
  createdAt: number;
  readAt?: number | null;
  dismissedAt?: number | null;
  /** In-app navigation path */
  actionUrl?: string;
  /** Stable dedup key: type:entityId:dateKey */
  dedupKey: string;
  metadata?: Record<string, unknown>;
}

export function isUnread(n: AppNotification): boolean {
  return !n.readAt && !n.dismissedAt;
}

export function isDismissed(n: AppNotification): boolean {
  return Boolean(n.dismissedAt);
}

export function buildDedupKey(type: NotificationType, entityId: string, dateKey: string): string {
  return `${type}:${entityId}:${dateKey}`;
}
