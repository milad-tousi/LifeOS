export const appConfig = {
  name: import.meta.env.VITE_APP_NAME ?? "LifeOS",
  version: import.meta.env.VITE_APP_VERSION ?? "0.1.0",
  description: "A lightweight local-first life management app.",
} as const;
