import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { db } from "@/db/dexie";
import { AppNotification } from "@/features/notifications/types";
import { notificationStore } from "@/features/notifications/services/notificationStore";

export interface UseNotificationsResult {
  /** All non-dismissed notifications, newest first */
  notifications: AppNotification[];
  /** Count of notifications that are neither read nor dismissed */
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  // useLiveQuery re-runs whenever the notifications table changes
  const raw = useLiveQuery<AppNotification[]>(async () => {
    const all = (await db.notifications
      .orderBy("createdAt")
      .reverse()
      .toArray()) as AppNotification[];
    return all.filter((n) => !n.dismissedAt);
  }, []);

  const notifications: AppNotification[] = raw ?? [];
  const loading = raw === undefined;
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markRead = useCallback(async (id: string) => {
    await notificationStore.markRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationStore.markAllRead();
  }, []);

  const dismiss = useCallback(async (id: string) => {
    await notificationStore.dismiss(id);
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, dismiss };
}
