import { useLiveQuery } from "dexie-react-hooks";
import { settingsRepository } from "@/domains/settings/repository";
import { AiProvider, AiSettings } from "@/features/ai/types";

export const AI_SETTINGS_KEY = "aiAssistant";

export const AI_PROVIDER_OPTIONS: AiProvider[] = [
  "openai",
  "claude",
  "gemini",
  "ollama",
  "custom",
];

export const AI_PROVIDER_DEFAULTS: Record<AiProvider, Pick<AiSettings, "baseUrl" | "model">> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
  },
  claude: {
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-5-haiku-latest",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
  },
  ollama: {
    baseUrl: "http://localhost:11434",
    model: "llama3.1",
  },
  custom: {
    baseUrl: "",
    model: "",
  },
};

export function createDefaultAiSettings(): AiSettings {
  return {
    enabled: false,
    provider: "openai",
    baseUrl: AI_PROVIDER_DEFAULTS.openai.baseUrl,
    apiKey: "",
    model: AI_PROVIDER_DEFAULTS.openai.model,
    lastTestStatus: null,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeAiSettings(value: unknown): AiSettings {
  const defaults = createDefaultAiSettings();

  if (typeof value !== "object" || value === null) {
    return defaults;
  }

  const candidate = value as Partial<AiSettings>;

  return {
    enabled: candidate.enabled ?? defaults.enabled,
    provider: isAiProvider(candidate.provider) ? candidate.provider : defaults.provider,
    baseUrl: typeof candidate.baseUrl === "string" ? candidate.baseUrl : defaults.baseUrl,
    apiKey: typeof candidate.apiKey === "string" ? candidate.apiKey : defaults.apiKey,
    model: typeof candidate.model === "string" ? candidate.model : defaults.model,
    lastTestStatus:
      candidate.lastTestStatus === "success" || candidate.lastTestStatus === "failed"
        ? candidate.lastTestStatus
        : null,
    updatedAt:
      typeof candidate.updatedAt === "string" && candidate.updatedAt
        ? candidate.updatedAt
        : defaults.updatedAt,
  };
}

export async function getAiSettings(): Promise<AiSettings> {
  const storedSetting = await settingsRepository.getByKey(AI_SETTINGS_KEY);
  return normalizeAiSettings(storedSetting?.value);
}

export async function saveAiSettings(settings: AiSettings): Promise<AiSettings> {
  const nextSettings = normalizeAiSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });

  await settingsRepository.upsert({
    key: AI_SETTINGS_KEY,
    updatedAt: Date.now(),
    value: nextSettings,
  });

  return nextSettings;
}

export function useAiSettings(): { loading: boolean; settings: AiSettings } {
  const storedSetting = useLiveQuery(async () => (await settingsRepository.getByKey(AI_SETTINGS_KEY)) ?? null, []);

  return {
    loading: storedSetting === undefined,
    settings: storedSetting ? normalizeAiSettings(storedSetting.value) : createDefaultAiSettings(),
  };
}

function isAiProvider(value: string | undefined): value is AiProvider {
  return AI_PROVIDER_OPTIONS.includes(value as AiProvider);
}
