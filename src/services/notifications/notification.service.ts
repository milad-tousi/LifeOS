// Detect Capacitor environment
function isCapacitor(): boolean {
  return typeof window !== "undefined" && "Capacitor" in window;
}

export const notificationService = {
  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!("Notification" in window)) {
      return "unsupported";
    }

    // On Capacitor (Android/iOS), Notification.requestPermission() triggers
    // the native OS permission dialog when POST_NOTIFICATIONS is declared
    // in AndroidManifest.xml. The WebView bridges the web API to native.
    if (isCapacitor()) {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch {
        return "denied";
      }
    }

    return Notification.requestPermission();
  },

  getPermission(): NotificationPermission | "unsupported" {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  },
};
