import { buildConnectionTestMessages } from "@/features/ai/promptBuilder";
import {
  parseApiErrorMessage,
  parseOllamaText,
  parseOpenAiCompatibleText,
} from "@/features/ai/responseParser";
import {
  AiConnectionResult,
  AiGenerateTextResult,
  AiMessage,
  AiProvider,
  AiSettings,
  AiVisionInput,
  AiVisionResult,
} from "@/features/ai/types";

interface ProviderAdapter {
  endpoint: (baseUrl: string) => string;
  parseText: (payload: unknown) => string;
  payload: (settings: AiSettings, messages: AiMessage[]) => Record<string, unknown>;
}

const OPENAI_COMPATIBLE_ADAPTER: ProviderAdapter = {
  endpoint: (baseUrl) => joinUrl(baseUrl, "chat/completions"),
  parseText: parseOpenAiCompatibleText,
  payload: (settings, messages) => ({
    model: settings.model,
    messages,
    temperature: 0.3,
  }),
};

const OLLAMA_ADAPTER: ProviderAdapter = {
  endpoint: (baseUrl) => joinUrl(baseUrl, "api/chat"),
  parseText: parseOllamaText,
  payload: (settings, messages) => ({
    model: settings.model,
    messages,
    stream: false,
  }),
};

const ADAPTERS: Record<AiProvider, ProviderAdapter> = {
  openai: OPENAI_COMPATIBLE_ADAPTER,
  claude: OPENAI_COMPATIBLE_ADAPTER,
  gemini: OPENAI_COMPATIBLE_ADAPTER,
  custom: OPENAI_COMPATIBLE_ADAPTER,
  ollama: OLLAMA_ADAPTER,
};

export async function testConnection(settings: AiSettings): Promise<AiConnectionResult> {
  try {
    const result = await generateText(settings, buildConnectionTestMessages());

    return {
      provider: settings.provider,
      status: "success",
      text: result.text,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Connection test failed.",
      provider: settings.provider,
      status: "failed",
    };
  }
}

export async function generateText(
  settings: AiSettings,
  messages: AiMessage[],
): Promise<AiGenerateTextResult> {
  const sanitizedSettings = sanitizeSettings(settings);

  if (!sanitizedSettings.baseUrl) {
    throw new Error("API base URL is required.");
  }

  if (!sanitizedSettings.model) {
    throw new Error("Model name is required.");
  }

  const adapter = ADAPTERS[sanitizedSettings.provider];
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(adapter.endpoint(sanitizedSettings.baseUrl), {
      body: JSON.stringify(adapter.payload(sanitizedSettings, messages)),
      headers: createHeaders(sanitizedSettings),
      method: "POST",
      signal: controller.signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const apiError = parseApiErrorMessage(payload);
      throw new Error(apiError ?? `Request failed with status ${response.status}.`);
    }

    return {
      provider: sanitizedSettings.provider,
      raw: payload,
      text: adapter.parseText(payload),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Connection timed out.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}


// ── Vision / image input ──────────────────────────────────────────────────────

/**
 * Send a prompt + image to the AI provider and return the text response.
 * Builds a provider-specific multimodal request payload.
 */
export async function generateVision(
  settings: AiSettings,
  input: AiVisionInput,
): Promise<AiVisionResult> {
  const sanitizedSettings = sanitizeSettings(settings);

  if (!sanitizedSettings.baseUrl) {
    throw new Error("API base URL is required.");
  }
  if (!sanitizedSettings.model) {
    throw new Error("Model name is required.");
  }

  const dataUrl = `data:${input.image.mimeType};base64,${input.image.imageBase64}`;
  let endpoint: string;
  let requestBody: Record<string, unknown>;

  if (sanitizedSettings.provider === "ollama") {
    // Ollama vision: images array on the message
    endpoint = joinUrl(sanitizedSettings.baseUrl, "api/chat");
    requestBody = {
      model: sanitizedSettings.model,
      stream: false,
      messages: [
        ...(input.systemPrompt
          ? [{ role: "system", content: input.systemPrompt }]
          : []),
        {
          role: "user",
          content: input.userPrompt,
          images: [input.image.imageBase64],
        },
      ],
    };
  } else {
    // OpenAI-compatible vision (openai, gemini, claude, custom)
    endpoint = joinUrl(sanitizedSettings.baseUrl, "chat/completions");
    const userContent: unknown[] = [
      { type: "text", text: input.userPrompt },
      {
        type: "image_url",
        image_url: { url: dataUrl },
      },
    ];
    requestBody = {
      model: sanitizedSettings.model,
      temperature: 0.1,
      messages: [
        ...(input.systemPrompt
          ? [{ role: "system", content: input.systemPrompt }]
          : []),
        { role: "user", content: userContent },
      ],
    };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000); // 30 s for image

  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify(requestBody),
      headers: createHeaders(sanitizedSettings),
      method: "POST",
      signal: controller.signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const apiError = parseApiErrorMessage(payload);
      throw new Error(apiError ?? `Request failed with status ${response.status}.`);
    }

    // Parse the text from the response using the matching adapter
    const adapter = ADAPTERS[sanitizedSettings.provider];
    return {
      provider: sanitizedSettings.provider,
      raw: payload,
      text: adapter.parseText(payload),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Connection timed out.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function sanitizeSettings(settings: AiSettings): AiSettings {
  return {
    ...settings,
    apiKey: settings.apiKey?.trim() ?? "",
    baseUrl: settings.baseUrl.trim(),
    model: settings.model.trim(),
  };
}

function createHeaders(settings: AiSettings): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.apiKey?.trim()) {
    headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
  }

  return headers;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBaseUrl}/${normalizedPath}`;
}
