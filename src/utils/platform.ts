export function isCapacitorRuntime(): boolean {
  return Boolean((window as Window & { Capacitor?: object }).Capacitor);
}

export function getPlatformName(): "web" | "native-shell" {
  return isCapacitorRuntime() ? "native-shell" : "web";
}

