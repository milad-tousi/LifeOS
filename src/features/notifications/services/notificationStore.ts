import { db, ensureDatabaseReady } from "@/db/dexie";
import { createId } from "@/lib/id";
import { AppNotification, buildDedupKey, NotificationType, NotificationEntityType, NotificationSeverity } from "@/features/notifications/types";
import { nativeNotifications } from "@/services/notifications/native-notifications";


export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  severity: NotificationSeverity;
  scheduledAt: string;
  actionUrl?: string;
  dedupKey: string;
  metadata?: Record<string, unknown>;
}

export const notificationStore = {
  async getAll(): Promise<AppNotification[]> {
    await ensureDatabaseReady();
    return db.notifications
      .orderBy("createdAt")
      .reverse()
      .toArray() as Promise<AppNotification[]>;
  },

  async getActive(): Promise<AppNotification[]> {
    await ensureDatabaseReady();
    const all = await db.notifications
      .orderBy("createdAt")
      .reverse()
      .toArray() as AppNotification[];
    return all.filter((n) => !n.dismissedAt);
  },

  async getUnreadCount(): Promise<number> {
    await ensureDatabaseReady();
    const all = await db.notifications.toArray() as AppNotification[];
    return all.filter((n) => !n.readAt && !n.dismissedAt).length;
  },

  async existsByDedupKey(dedupKey: string): Promise<boolean> {
    await ensureDatabaseReady();
    const existing = await db.notifications
      .where("dedupKey")
      .equals(dedupKey)
      .first();
    return Boolean(existing);
  },

  async upsert(input: CreateNotificationInput): Promise<void> {
    await ensureDatabaseReady();
    const exists = await this.existsByDedupKey(input.dedupKey);
    if (exists) return;

    const notification: AppNotification = {
      id: createId(),
      ...input,
      createdAt: Date.now(),
      readAt: null,
      dismissedAt: null,
    };
    await db.notifications.add(notification as never);

    // Fire native Android system notification
    void nativeNotifications.send(input.title, input.message);
  },

  async markRead(id: string): Promise<void> {
    await ensureDatabaseReady();
    await db.notifications.update(id, { readAt: Date.now() } as never);
  },

  async markAllRead(): Promise<void> {
    await ensureDatabaseReady();
    const now = Date.now();
    const unread = (await db.notifications.toArray() as AppNotification[])
      .filter((n) => !n.readAt && !n.dismissedAt);
    await Promise.all(unread.map((n) => db.notifications.update(n.id, { readAt: now } as never)));
  },

  async dismiss(id: string): Promise<void> {
    await ensureDatabaseReady();
    await db.notifications.update(id, { dismissedAt: Date.now() } as never);
  },

  async dismissByDedupKey(dedupKey: string): Promise<void> {
    await ensureDatabaseReady();
    const record = await db.notifications
      .where("dedupKey")
      .equals(dedupKey)
      .first() as AppNotification | undefined;
    if (record && !record.dismissedAt) {
      await db.notifications.update(record.id, { dismissedAt: Date.now() } as never);
    }
  },

  async pruneOldDismissed(olderThanDays = 14): Promise<void> {
    await ensureDatabaseReady();
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const old = (await db.notifications.toArray() as AppNotification[])
      .filter((n) => n.dismissedAt && n.dismissedAt < cutoff);
    await Promise.all(old.map((n) => db.notifications.delete(n.id)));
  },
};
