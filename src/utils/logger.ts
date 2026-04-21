export const log = {
  info(message: string, context?: unknown): void {
    console.info(`[LifeOS] ${message}`, context ?? "");
  },
  warn(message: string, context?: unknown): void {
    console.warn(`[LifeOS] ${message}`, context ?? "");
  },
  error(message: string, context?: unknown): void {
    console.error(`[LifeOS] ${message}`, context ?? "");
  },
};
