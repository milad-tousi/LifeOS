/**
 * Native system notifications.
 *
 * Uses the Web Notifications API which Android WebView bridges to the OS
 * notification tray when POST_NOTIFICATIONS permission is granted.
 */

let _permissionChecked = false;

export const nativeNotifications = {
  async requestPermission(): Promise<void> {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    _permissionChecked = true;
  },

  async send(title: string, body: string): Promise<void> {
    if (!("Notification" in window)) return;

    // Request permission on first use
    if (!_permissionChecked || Notification.permission === "default") {
      await this.requestPermission();
    }

    if (Notification.permission !== "granted") return;

    try {
      // eslint-disable-next-line no-new
      new Notification(title, {
        body,
        icon: "./icons/icon-192.png",
        badge: "./icons/icon-192.png",
        tag: `lifeos-${Date.now()}`,
      });
    } catch (err) {
      console.warn("[nativeNotifications] send failed:", err);
    }
  },
};
