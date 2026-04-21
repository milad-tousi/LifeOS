export const notificationService = {
  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    // TODO: Connect this to a native notification bridge when Capacitor is added.
    if (!("Notification" in window)) {
      return "unsupported";
    }

    return Notification.requestPermission();
  },
};
