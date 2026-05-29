import { registerPlugin } from "@capacitor/core";

interface NativeNotificationPlugin {
  send(options: { title: string; body: string }): Promise<void>;
  requestPermission(): Promise<void>;
}

const NativeNotification = registerPlugin<NativeNotificationPlugin>("NativeNotification");

export const nativeNotifications = {
  async requestPermission(): Promise<void> {
    try {
      await NativeNotification.requestPermission();
    } catch {
      // ignore on web
    }
  },

  async send(title: string, body: string): Promise<void> {
    try {
      await NativeNotification.send({ title, body });
    } catch {
      // Fallback to Web Notifications API (browser/dev mode)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    }
  },
};
