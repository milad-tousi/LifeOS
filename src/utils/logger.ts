type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, scope: string, message: string, context?: unknown): void {
  const prefix = `[${scope}]`;

  if (level === "info") {
    console.info(prefix, message, context ?? "");
    return;
  }

  if (level === "warn") {
    console.warn(prefix, message, context ?? "");
    return;
  }

  console.error(prefix, message, context ?? "");
}

export function createLogger(scope: string) {
  return {
    info(message: string, context?: unknown): void {
      write("info", scope, message, context);
    },
    warn(message: string, context?: unknown): void {
      write("warn", scope, message, context);
    },
    error(message: string, context?: unknown): void {
      write("error", scope, message, context);
    },
  };
}

export const log = createLogger("LifeOS");
